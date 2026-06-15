* **Decoupled Infrastructure:** The client interface is entirely separated from backend operations, interacting strictly over a versioned REST API.
* **Data Integrity Guardrails:** The ledger implements sequential transactional sequence handling with comprehensive cleanup rollbacks to completely eliminate orphaned state anomalies across tables.
* **Cryptographic Sovereignty:** Employs stateless token-based identity verification via JSON Web Tokens (JWT) signed with `HS256`, completely replacing memory-intensive traditional sessions.

---

## 🛠 Tech Stack

* **Backend Engine:** FastAPI (Python 3.10+)
* **Asynchronous Server Gateway:** Uvicorn
* **Database & Cloud Security:** Supabase (PostgreSQL engine)
* **Data Modeling & Compliance:** Pydantic v2
* **Network Access Control:** CORS Middleware Engine

---

## 📋 Database Entity-Relationship Layout (ERD)

The database enforces a strict, production-standard 1:1:Many relational constraint pipeline utilizing type-safe Universally Unique Identifiers (`UUID`) across all matching keys:

1.  **`auth.users` (Internal Vault):** Managed natively by Supabase Auth. Securely hashes registration passwords. Generates the base account `UUID`.
2.  **`public.profiles`:** Connects 1:1 with `auth.users.id`. Enforces data integrity through user-facing metadata attributes.
3.  **`public.wallets`:** Main identity wallet account tracker. Maps 1:1 to `profiles.id` through a foreign key constraint combined with a strict `UNIQUE` column clause, preventing duplicate wallets per profile. Auto-seeds with a `1000.00 XAF` sign-up credit.
4.  **`public.transactions`:** The system's central immutable financial ledger. Records sender and receiver reference UUIDs, precise currency figures, and timestamps for comprehensive auditing.

---

## 🛣 Core REST API Endpoints

All network request and response pathways are organized cleanly behind a versioned prefix (`/api/v1`):

### 📁 Authentication Layer
* `POST /api/v1/auth/signup` - Validates inbound payload shapes, creates an encrypted auth profile, provisions public records, and safely attaches an empty currency wallet. Implements automated cascade rollback in case of downstream validation faults.
* `POST /api/v1/auth/login` - Authenticates user credentials against the secure cryptographic vault and generates a stateless session JWT access token.

### 📁 Financial Transfers Layer
* `POST /api/v1/transfers/` - Coordinates atomic P2P fund movements. Runs balance inquiries, handles fee deductions, and commits immutable ledger rows to prevent account overdrafts.
* `GET /api/v1/transfers/history/{user_id}` - Scans the transaction table simultaneously using an logical `OR` condition, compiling a unified, reverse-chronological list of a user's incoming and outgoing transfers.

### 📁 System Diagnostics
* `GET /` - Root lightweight health status diagnostics payload.

---

## ⚙️ Installation & Development Setup

Follow these steps to run this logic engine locally on your machine:

### 1. Clone the Workspace
```bash
git clone [https://github.com/your-username/my_wallet.git](https://github.com/your-username/my_wallet.git)
cd my_wallet
