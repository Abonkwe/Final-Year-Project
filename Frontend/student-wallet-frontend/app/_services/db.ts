import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('wallet.db');
  }
  return dbInstance;
}

export interface LocalProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  balance: number;
  last_sync: number;
}

export interface LocalTransaction {
  id: string;
  userId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  timestamp: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export async function initDatabase(): Promise<void> {
  const db = await getDB();
  
  // Initialize SQLite schema
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT,
      fullName TEXT,
      phone TEXT,
      balance REAL,
      last_sync INTEGER
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      userId TEXT,
      type TEXT,
      amount REAL,
      description TEXT,
      timestamp TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS pending_transfers (
      id TEXT PRIMARY KEY,
      sender_phone TEXT,
      receiver_phone TEXT,
      amount REAL,
      created_at TEXT
    );
  `);
}

// Retrieve cached profile
export async function getLocalProfile(userId: string): Promise<LocalProfile | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<any>('SELECT * FROM profiles WHERE id = ?', [userId]);
  if (!row) return null;
  return {
    id: row.id,
    email: row.email || '',
    fullName: row.fullName || '',
    phone: row.phone || '',
    balance: row.balance || 0.0,
    last_sync: row.last_sync || 0,
  };
}

// Save profile cache
export async function saveLocalProfile(profile: Omit<LocalProfile, 'last_sync'>): Promise<void> {
  const db = await getDB();
  const now = Date.now();
  await db.runAsync(
    'INSERT OR REPLACE INTO profiles (id, email, fullName, phone, balance, last_sync) VALUES (?, ?, ?, ?, ?, ?)',
    [profile.id, profile.email, profile.fullName, profile.phone, profile.balance, now]
  );
}

// Retrieve local cached statement history (including pending transfers)
export async function getLocalTransactions(userId: string): Promise<LocalTransaction[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM transactions WHERE userId = ? ORDER BY timestamp DESC',
    [userId]
  );
  return rows.map(row => ({
    id: row.id,
    userId: row.userId,
    type: row.type as 'CREDIT' | 'DEBIT',
    amount: row.amount,
    description: row.description,
    timestamp: row.timestamp,
    status: row.status as 'COMPLETED' | 'PENDING' | 'FAILED',
  }));
}

// Cache statements from the server without losing local pending actions
export async function saveLocalTransactions(userId: string, txns: Omit<LocalTransaction, 'userId'>[]): Promise<void> {
  const db = await getDB();
  
  await db.withTransactionAsync(async () => {
    // Delete existing non-pending transactions to refresh cache
    await db.runAsync('DELETE FROM transactions WHERE userId = ? AND status != ?', [userId, 'PENDING']);
    
    // Insert fresh items
    for (const txn of txns) {
      await db.runAsync(
        'INSERT OR REPLACE INTO transactions (id, userId, type, amount, description, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [txn.id, userId, txn.type, txn.amount, txn.description, txn.timestamp, txn.status]
      );
    }
  });
}

// Save offline transfer in SQLite queue, update balance locally
export async function queueOfflineTransfer(params: {
  tempId: string;
  userId: string;
  senderPhone: string;
  receiverPhone: string;
  amount: number;
}): Promise<void> {
  const db = await getDB();
  const timestamp = new Date().toISOString();
  
  await db.withTransactionAsync(async () => {
    // Add pending item for Instant UI Statement Rendering
    await db.runAsync(
      'INSERT INTO transactions (id, userId, type, amount, description, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        params.tempId,
        params.userId,
        'DEBIT',
        params.amount,
        `Sent Transfer (Pending Sync)`,
        timestamp,
        'PENDING'
      ]
    );

    // Register inside queue
    await db.runAsync(
      'INSERT INTO pending_transfers (id, sender_phone, receiver_phone, amount, created_at) VALUES (?, ?, ?, ?, ?)',
      [
        params.tempId,
        params.senderPhone,
        params.receiverPhone,
        params.amount,
        timestamp
      ]
    );

    // Subtract amount immediately from local database cache
    await db.runAsync(
      'UPDATE profiles SET balance = balance - ? WHERE id = ?',
      [params.amount, params.userId]
    );
  });
}

export interface PendingTransfer {
  id: string;
  sender_phone: string;
  receiver_phone: string;
  amount: number;
  created_at: string;
}

// Fetch all queued transfers to process
export async function getPendingTransfers(): Promise<PendingTransfer[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<any>('SELECT * FROM pending_transfers ORDER BY created_at ASC');
  return rows.map(row => ({
    id: row.id,
    sender_phone: row.sender_phone,
    receiver_phone: row.receiver_phone,
    amount: row.amount,
    created_at: row.created_at,
  }));
}

// Resolve or reject a pending transaction
export async function resolvePendingTransfer(
  tempId: string,
  finalId: string,
  status: 'COMPLETED' | 'FAILED',
  details?: { errorMsg?: string; revertAmount?: number; userId?: string }
): Promise<void> {
  const db = await getDB();
  
  await db.withTransactionAsync(async () => {
    // Delete from queue
    await db.runAsync('DELETE FROM pending_transfers WHERE id = ?', [tempId]);
    
    if (status === 'COMPLETED') {
      // Sync succeeded. Update transaction log with actual server ID and clear pending state
      await db.runAsync(
        'UPDATE transactions SET id = ?, status = ?, description = ? WHERE id = ?',
        [finalId, 'COMPLETED', 'Sent Transfer', tempId]
      );
    } else {
      // Sync failed due to logical errors (insufficient balance on backend or unknown receiver)
      const errMessage = details?.errorMsg ? `Sent Transfer Failed: ${details.errorMsg}` : 'Sent Transfer Failed';
      await db.runAsync(
        'UPDATE transactions SET status = ?, description = ? WHERE id = ?',
        ['FAILED', errMessage, tempId]
      );
      
      // Revert the locally deducted balance
      if (details?.revertAmount && details?.userId) {
        await db.runAsync(
          'UPDATE profiles SET balance = balance + ? WHERE id = ?',
          [details.revertAmount, details.userId]
        );
      }
    }
  });
}
