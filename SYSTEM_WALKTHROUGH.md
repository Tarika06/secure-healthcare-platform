# 🏥 SecureCare+ System Walkthrough: Technical Onboarding Guide

Welcome to the **SecureCare+** development team. This document is a comprehensive guide to understanding the architecture, security protocols, and codebase of our enterprise-grade healthcare platform.

---

## 1. 🏗️ Overall System Architecture

The system follows a **Three-Tier Architecture** centered around a "Zero-Trust" security model.

*   **Frontend (Presentation Layer)**: React 19 (Vite) single-page application. It is completely stateless; it carries identity in a JWT and interacts with the backend via REST APIs.
*   **Backend (Application Layer)**: Node.js/Express server. It acts as the "Decision Engine," handling authentication, cryptographic operations, and business logic.
*   **Database (Data Layer)**: MongoDB (NoSQL). It stores identity, clinical records, and immutable audit logs.

### The Security Flow
1.  **Authentication**: Happens at the `authRoutes` via `passport`/`bcrypt`.
2.  **Authorization**: Happens in `middleware/authorize.js` using the **userId Prefix** logic.
3.  **Audit Logging**: Integrated into every service and route via `auditService`. No sensitive action goes unrecorded.

---

## 2. 📂 Backend Walkthrough (`/backend/src`)

### 🛰️ Entry Points
*   **`server.js`**: The main execution point. It connects to the DB, configures global middleware (CORS, JSON parsing), and mounts all API routes.
*   **`app.js`**: Defines the Express application instance. This separation allows us to test the API without starting the network server.

### 🛡️ Middleware (The Guards)
*   **`authenticate.js`**: The JWT verificator. It extracts the token from the header and attaches the user object to the request.
*   **`authorize.js`**: The RBAC engine. It checks if the user's role allows them to access a specific resource.
*   **`checkBlockedIP.js`**: A front-line security filter that kills requests from IPs flagged by the AI for malicious activity.
*   **`auditLogger.js`**: Automatically captures request/response metadata and sends it to the audit trail.

### 🧠 Services (The Business Logic)
*   **`encryptionService.js`**: Implements **AES-256-CBC**. This is where medical records are encrypted before storage and decrypted for viewing.
*   **`LoggerService.js`**: **CRITICAL.** Implements the **SHA-256 Hash Chain**. It links every audit log to the previous one, making the history tamper-proof.
*   **`aiService.js`**: Uses Google Gemini to analyze logs for brute-force attacks or unauthorized patterns.
*   **`gdprService.js`**: Handles the logic for "Right to Access" (PDF generation) and "Right to Erasure" (anonymization).

### 🗃️ Models (The Schema)
*   **`User.js`**: Identity data + roles.
*   **`MedicalRecord.js`**: Encrypted clinical data.
*   **`Consent.js`**: The permission link between Doctors and Patients.
*   **`AuditLog.js`**: The immutable storage schema for security logs.

### 🛣️ Routes (The Interface)
*   **`authRoutes.js`**: `/api/auth` - Login/Registration.
*   **`recordRoutes.js`**: `/api/records` - Secure EHR access.
*   **`consentRoutes.js`**: `/api/consent` - Permission management.
*   **`adminRoutes.js`**: `/api/admin` - System governance.

---

## 3. 📂 Frontend Walkthrough (`/frontend/src`)

### 🔐 Auth & API
*   **`context/AuthContext.jsx`**: Global state for the user. It handles the `login`/`logout` logic and keeps the JWT in the app's memory.
*   **`api/client.js`**: Custom Axios instance. It includes an **Interceptor** that automatically attaches the JWT to every request.

### 🧩 Components & Navigation
*   **`components/ProtectedRoute.jsx`**: A wrapper that redirects unauthenticated users to the Login page.
*   **`components/Sidebar.jsx`**: Role-based navigation. It hides the "Record Creator" from Patients and the "Privacy Menu" from Admins.

### 📄 Pages (The Features)
*   **`pages/patient/PatientDashboard.jsx`**: UI for viewing personal health history and managing privacy.
*   **`pages/doctor/DoctorDashboard.jsx`**: UI for patient lookup and clinical report creation.
*   **`pages/admin/AdminDashboard.jsx`**: UI for monitoring audit logs and security alerts.

---

## 4. 🗺️ Feature-to-Code Mapping

| Feature | Frontend File | Backend Route | Key Service |
| :--- | :--- | :--- | :--- |
| **User Login** | `LoginPage.jsx` | `authRoutes.js` | `bcrypt.compare` |
| **EHR Storage** | `RecordForm.jsx` | `recordRoutes.js` | `encryptionService.js` |
| **Privacy Access** | `ConsentManager.jsx`| `consentRoutes.js` | `auditService.js` |
| **Data Export** | `GDPRPanel.jsx` | `gdprRoutes.js` | `gdprService.js` |
| **RBAC Blocking**| `App.jsx` | `authorize.js` | `permissions.js` |

---

## 5. 🔄 Core Workflows

### **Flow A: Data Retrieval (The Security Chain)**
1.  **Request**: Doctor requests Record `R45`.
2.  **Auth**: `authenticate.js` verifies the JWT.
3.  **Check 1**: `authorize.js` checks if the user is a `DOCTOR`.
4.  **Check 2**: `recordRoutes.js` checks if the Patient has granted active `CONSENT`.
5.  **Decrypt**: `encryptionService` converts ciphertext into JSON.
6.  **Audit**: `auditService` creates a SHA-256 fingerprint of this access.
7.  **Response**: Decrypted data sent to UI.

---

## 6. 🛡️ Security & Compliance Logic

*   **Why Hashing?**: We use `bcrypt` for passwords so a DB leak doesn't reveal user credentials.
*   **Why JWT?**: It allows the server to be stateless; the token is a self-contained proof of identity.
*   **Why the Hash Chain?**: HIPAA requires audit trails. Our chain proves the logs haven't been edited.
*   **Least Privilege**: A Nurse has the same identity as a Doctor, but the **Permission Matrix** blocks them from viewing Diagnoses because they don't *need* them for their task.

---

## 7. 🔑 Critical Files (Understand these first!)

1.  **`backend/src/services/LoggerService.js`**: The heart of system integrity.
2.  **`backend/src/config/permissions.js`**: The rulebook of the app.
3.  **`backend/src/services/encryptionService.js`**: The privacy engine.
4.  **`frontend/src/context/AuthContext.jsx`**: The frontend security hub.

---

## 8. ⚠️ Common Pitfalls

*   **Manual DB Edits**: **NEVER** edit an Audit Log manually in MongoDB. The hash chain will break, and the Admin panel will show a "Tampering Detected" alert.
*   **UserID Prefixes**: All login logic relies on `P` (Patient), `D` (Doctor), `A` (Admin). If you create a user with a custom ID format, the RBAC system will deny access.
*   **Middleware Order**: Always ensure `authenticate` is placed **before** `authorize` in your routes, or the system won't know who the user is.

---
**SecureCare+ | Building the Future of Secure Healthcare**
