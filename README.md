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
