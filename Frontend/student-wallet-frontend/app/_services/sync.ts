import NetInfo from '@react-native-community/netinfo';
import api from './api';
import {
  getPendingTransfers,
  resolvePendingTransfer,
  PendingTransfer
} from './db';

let isSyncing = false;

/**
 * Triggers the synchronization of all local pending (queued) transfers to the backend API.
 */
export async function syncPendingTransfers(userId: string): Promise<boolean> {
  if (isSyncing) return false;
  isSyncing = true;

  try {
    const pendingList: PendingTransfer[] = await getPendingTransfers();
    if (pendingList.length === 0) {
      isSyncing = false;
      return true;
    }

    console.log(`[Sync] Found ${pendingList.length} pending transfers to sync.`);

    for (const pending of pendingList) {
      try {
        const payload = {
          sender_phone: pending.sender_phone,
          receiver_phone: pending.receiver_phone,
          amount: pending.amount,
        };

        // Attempt to send transfer to remote FastAPI backend
        const response = await api.post('/transfers/', payload);

        if (response.data && response.data.status === 'success') {
          const finalTxnId = response.data.transaction_id || `remote_${Date.now()}`;
          // Resolve transfer in SQLite database as COMPLETED
          await resolvePendingTransfer(pending.id, finalTxnId, 'COMPLETED');
          console.log(`[Sync] Transfer ${pending.id} successfully synced as ${finalTxnId}`);
        } else {
          await resolvePendingTransfer(pending.id, `remote_${Date.now()}`, 'COMPLETED');
        }
      } catch (error: any) {
        console.error(`[Sync] Error syncing transfer ${pending.id}:`, error);

        if (error.response) {
          // The server processed the request and rejected it (e.g., 400 Bad Request or 404 Not Found)
          // Since it will never succeed, fail it and revert the sender's balance.
          const errorMsg = error.response.data?.detail || 'Transaction rejected by server';
          console.log(`[Sync] Logical rejection for ${pending.id}: ${errorMsg}. Reverting balance.`);
          
          await resolvePendingTransfer(pending.id, '', 'FAILED', {
            errorMsg,
            revertAmount: pending.amount,
            userId,
          });
        } else {
          // Network timeout, DNS issue, or server down.
          // Keep in the local database queue to retry later when network stabilizes.
          console.log(`[Sync] Network timeout/error for ${pending.id}. Retaining in queue.`);
          break; 
        }
      }
    }
    return true;
  } catch (err) {
    console.error('[Sync] Fatal error during pending sync execution:', err);
    return false;
  } finally {
    isSyncing = false;
  }
}

/**
 * Registers a global listener for internet connectivity.
 * Triggers background sync when network status changes from offline to online.
 */
export function setupNetworkSyncListener(userId: string, onSyncComplete?: () => void) {
  if (!userId) return () => {};
  
  return NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      console.log('[Sync] Network back online. Initiating background sync...');
      syncPendingTransfers(userId).then((success) => {
        if (success && onSyncComplete) {
          onSyncComplete();
        }
      });
    }
  });
}
