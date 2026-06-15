# Digital Payment and Wallet System

[![Python Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Mobile Frontend](https://img.shields.io/badge/Frontend-React_Native_%2F_Expo-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactnative.dev/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL_%2F_Supabase-336791?style=flat-square&logo=postgresql&logoColor=white)](https://supabase.com/)

A secure, high-concurrency, **offline-first** Peer-to-Peer (P2P) digital wallet mobile application tailored for the Cameroonian economic ecosystem. Developed as a final year project for the Bachelor of Science in Computer Science at the **University of Buea**.

This repository corresponds directly to the implementations detailed in the **"Abonkwe Princely (SC23A522) report.docx"** graduation document.

---

## 📌 Project Overview

Traditional payment architectures struggle with infrastructural "dead zones" and network fluctuations in Cameroon, often causing anxiety over double-spending and missing transaction details. This system bridges that gap by implementing a robust, local caching layer for seamless **offline visibility** alongside an **asynchronous backend** engineered to survive real-world connection drops gracefully.

### Core Features
*   **Wallet Management:** Real-time balance updates and extensive logs documenting successful, pending, or failed operations.
*   **Atomic P2P Transfers:** Secure fund transfers directly between users using encrypted token pathways.
*   **Offline-First Visibility:** Local data persistence allows users to view cached transaction histories and balances without an active internet connection[cite: 1].
*   **Robust Security:** Strict Multi-Factor Authentication (MFA) / PIN validation pipelines with backend Row-Level Security (RLS)[cite: 1].
*   **Local Payment Gateway Integration:** Configured to handle webhooks from local aggregators like Fapshi and NkwaPay[cite: 1].

---

## 🏗️ Architecture & Tech Stack

The application relies on a **Three-Tier Architecture** ensuring clean separation of presentation, validation, and data storage layers[cite: 1].

### Technical Toolkit
*   **Backend Application:** **FastAPI (Python 3.10+)** for ultra-fast asynchronous JSON request routing and automatic OpenAPI documentation[cite: 1].
*   **Frontend Mobile Environment:** **React Native & Expo Ecosystem** utilizing TypeScript for a unified Android/iOS codebase native experience[cite: 1].
*   **Database Management System:** **PostgreSQL (Hosted on Supabase)** to enforce strict transactional ACID principles and isolate atomic P2P data states[cite: 1].
*   **Dependency Management:** **`uv` (Astral Software)** as a lightning-fast virtual environment manager utilizing exact lockfiles for reproducible builds[cite: 1].

---

## 📊 Database Design & Ledger Assertions

To guarantee complete ledger accuracy and avoid negative balances, the system applies strict check constraints directly at the database level[cite: 1]:

| Schema Identifier | Field Matrix Elements & Typing | Operational Rule & Constraint Assertions |
| :--- | :--- | :--- |
| **`profiles`** | `id (UUID, PK)`, `full_name (TEXT)`, `phone_number (VARCHAR, UNIQUE)` | Enforces user identification. The unique phone index maps direct peer routes[cite: 1]. |
| **`wallets`** | `id (UUID, PK)`, `user_id (FK)`, `balance (NUMERIC(12,2))`, `currency` | Tracks user assets. Employs a database check constraint ensuring `balance >= 0.00` to completely block overdraft errors[cite: 1]. |
| **`transactions`** | `id (UUID, PK)`, `sender_id (FK)`, `receiver_id (FK)`, `amount`, `status` | Logs financial operations. Enforces a database check constraint requiring `amount > 0.00` to block faulty or negative adjustments[cite: 1]. |

---

## ⚙️ Getting Started

### Prerequisites
*   **Development Rig:** Minimum Intel i5 (or equivalent), 8GB+ RAM (16GB recommended for containers), 40GB free SSD space[cite: 1].
*   **Mobile Target:** Android 10.0+ / iOS 15.0+[cite: 1].
*   Python 3.10+ installed locally[cite: 1].
*   Node.js installed (LTS recommended)[cite: 1].

### 1. Backend Setup (FastAPI)
Navigate to the backend directory and use `uv` to construct your isolated environment[cite: 1]:
```bash
cd backend

# Install dependencies using uv
uv venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
uv pip install -r requirements.txt

# Configure your environment variables (.env)
cp .env.example .env

# Fire up the asynchronous development server
python main.py
