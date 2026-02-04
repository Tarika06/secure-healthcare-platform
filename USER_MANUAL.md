# SecureCare Healthcare Platform
## User Manual v1.0

---

# Table of Contents
1. [Introduction](#introduction)
2. [System Requirements](#system-requirements)
3. [Installation & Setup](#installation--setup)
4. [User Roles](#user-roles)
5. [Getting Started](#getting-started)
6. [Patient Guide](#patient-guide)
7. [Doctor Guide](#doctor-guide)
8. [Nurse Guide](#nurse-guide)
9. [Lab Technician Guide](#lab-technician-guide)
10. [Admin Guide](#admin-guide)
11. [API Reference](#api-reference)
12. [Security Features](#security-features)
13. [Troubleshooting](#troubleshooting)

---

# Introduction

**SecureCare** is a secure, HIPAA-compliant healthcare management platform designed to protect sensitive patient data while enabling seamless collaboration between healthcare providers.

### Key Features:
- 🔐 **AES-256 Encryption** - All medical records are encrypted at rest
- ✅ **Consent-Based Access** - Doctors can only view patient records with explicit patient consent
- 👥 **Role-Based Access Control** - Different roles have different permissions
- 📝 **Audit Logging** - Every data access is logged for compliance
- 🏥 **Multi-Role Support** - Patients, Doctors, Nurses, Lab Technicians, and Admins

---

# System Requirements

### Server Requirements:
- Node.js v18 or higher
- MongoDB (Local or Atlas cloud)
- 2GB RAM minimum
- 10GB storage

### Client Requirements:
- Any REST API client (Postman, Insomnia, or web frontend)
- Modern web browser

---

# Installation & Setup

## Step 1: Install Dependencies

Open a terminal in the project folder and run:

```bash
cd backend
npm install
```

## Step 2: Configure Environment Variables

Create or edit the `.env` file in the `backend` folder:

```env
MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/securecare_db
JWT_SECRET=your_secret_key_here_make_it_long_and_random
PORT=5000
ENCRYPTION_KEY=64f69741e97f5f9e776e7379e9a4f4d2f0088927891823908123098120398123
NODE_ENV=development
```

> ⚠️ **IMPORTANT**: The `ENCRYPTION_KEY` must be exactly 64 hexadecimal characters (32 bytes). Never share this key!

## Step 3: Start the Server

```bash
cd backend
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

You should see:
```
Server running on port 5000
MongoDB connected
```

## Step 4: Create Test Users

Use the registration API or insert directly into MongoDB:

```javascript
// Example users in MongoDB 'users' collection:
{ userId: "P001", passwordHash: "<bcrypt_hash>", role: "PATIENT", firstName: "John", lastName: "Doe" }
{ userId: "D001", passwordHash: "<bcrypt_hash>", role: "DOCTOR", firstName: "Dr. Sarah", lastName: "Smith" }
{ userId: "N001", passwordHash: "<bcrypt_hash>", role: "NURSE", firstName: "Nancy", lastName: "Johnson" }
{ userId: "L001", passwordHash: "<bcrypt_hash>", role: "LAB_TECH", firstName: "Larry", lastName: "Wilson" }
{ userId: "A001", passwordHash: "<bcrypt_hash>", role: "ADMIN", firstName: "Admin", lastName: "User" }
```

---

# User Roles

| Role | ID Prefix | Permissions |
|------|-----------|-------------|
| **Patient** | P | View own records, manage consent, see who has access |
| **Doctor** | D | Create records, view patient records (with consent), request consent |
| **Nurse** | N | View vitals only (no diagnoses or prescriptions) |
| **Lab Tech** | L | Upload lab results only |
| **Admin** | A | View anonymized statistics, system management |

---

# Getting Started

## How to Login

**All users** must first login to get an authentication token.

### Request:
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
    "userId": "P001",
    "password": "your_password"
}
```

### Response:
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> 📌 **Save this token!** You'll need it for all other requests.

## Using the Token

For all protected endpoints, add this header:
```
Authorization: Bearer <your_token_here>
```

In Postman:
1. Go to the **Authorization** tab
2. Select **Type**: `Bearer Token`
3. Paste your token

---

# Patient Guide

As a patient, you have full control over your medical data.

## View Your Medical Records

```
GET http://localhost:5000/api/mgmt/patient/my-records
Authorization: Bearer <patient_token>
```

Returns all your medical records (decrypted for your viewing).

---

## View Pending Consent Requests

See which doctors are requesting access to your records:

```
GET http://localhost:5000/api/consent/pending
Authorization: Bearer <patient_token>
```

---

## Grant Consent to a Doctor

Allow a doctor to view your records:

```
POST http://localhost:5000/api/consent/grant/<consent_id>
Authorization: Bearer <patient_token>
```

> The consent is valid for 1 year by default.

---

## Deny Consent

Reject a doctor's request:

```
POST http://localhost:5000/api/consent/deny/<consent_id>
Authorization: Bearer <patient_token>
```

---

## Revoke Consent

Remove a doctor's access at any time:

```
POST http://localhost:5000/api/consent/revoke/<consent_id>
Authorization: Bearer <patient_token>
```

---

## See Who Has Access to Your Records

```
GET http://localhost:5000/api/mgmt/patient/access-list
Authorization: Bearer <patient_token>
```

---

# Doctor Guide

As a doctor, you can create medical records and view patient data (with consent).

## Request Consent from Patient

Before viewing any patient's records, you must request consent:

```
POST http://localhost:5000/api/consent/request
Authorization: Bearer <doctor_token>
Content-Type: application/json

{
    "patientId": "P001"
}
```

The patient will see this request and can approve or deny it.

---

## Check if You Have Consent

```
GET http://localhost:5000/api/consent/check/P001
Authorization: Bearer <doctor_token>
```

---

## Create a Medical Record

```
POST http://localhost:5000/api/mgmt/doctor/ehr
Authorization: Bearer <doctor_token>
Content-Type: application/json

{
    "patientId": "P001",
    "title": "Annual Physical Examination",
    "diagnosis": "Patient is in good health",
    "details": "Blood pressure normal, no concerning symptoms",
    "prescription": "Continue current vitamin regimen",
    "recordType": "GENERAL",
    "vitals": {
        "bloodPressure": "120/80",
        "heartRate": "72 bpm",
        "temperature": "98.6°F",
        "weight": "165 lbs"
    }
}
```

> 🔐 The diagnosis, details, and prescription are automatically encrypted!

---

## View Patient Records (Requires Consent)

```
GET http://localhost:5000/api/mgmt/doctor/ehr/P001
Authorization: Bearer <doctor_token>
```

If you don't have consent, you'll receive:
```json
{
    "error": "CONSENT_REQUIRED",
    "message": "No active consent from patient. Please request consent first."
}
```

---

## View All Patients List

```
GET http://localhost:5000/api/records/patients/list
Authorization: Bearer <doctor_token>
```

---

# Nurse Guide

Nurses have limited access - they can only view vital signs, not diagnoses or prescriptions.

## View Patient Vitals

```
GET http://localhost:5000/api/mgmt/nurse/vitals/P001
Authorization: Bearer <nurse_token>
```

### Response:
```json
{
    "message": "Vitals retrieved successfully",
    "patientId": "P001",
    "vitals": [
        {
            "recordId": "...",
            "recordType": "GENERAL",
            "vitals": {
                "bloodPressure": "120/80",
                "heartRate": "72 bpm"
            },
            "createdAt": "2026-02-02T10:00:00Z"
        }
    ]
}
```

> ℹ️ Notice: No diagnosis, details, or prescription is visible to nurses.

---

# Lab Technician Guide

Lab technicians can upload test results directly to patient records.

## Upload Lab Results

```
POST http://localhost:5000/api/mgmt/lab/upload
Authorization: Bearer <labtech_token>
Content-Type: application/json

{
    "patientId": "P001",
    "testName": "Complete Blood Count (CBC)",
    "resultValue": "Normal",
    "unit": "",
    "referenceRange": "See detailed report",
    "notes": "All values within normal limits"
}
```

The result is automatically encrypted and saved.

---

# Admin Guide

Administrators can view system-wide statistics without accessing individual patient data.

## View Anonymized Health Trends

```
GET http://localhost:5000/api/mgmt/analysis/trends
Authorization: Bearer <admin_token>
```

### Response:
```json
{
    "message": "Anonymized health trends",
    "stats": {
        "totalRecords": 150,
        "recordsByType": [
            { "_id": "GENERAL", "count": 80 },
            { "_id": "LAB_RESULT", "count": 50 },
            { "_id": "PRESCRIPTION", "count": 20 }
        ],
        "totalPatients": 45,
        "totalDoctors": 12,
        "recentRecordsLast7Days": 23,
        "generatedAt": "2026-02-02T12:00:00Z"
    }
}
```

> 🔒 No individual patient data is exposed - only aggregate statistics.

---

# API Reference

## Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and get token |

## Patient Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mgmt/patient/my-records` | View own records |
| GET | `/api/mgmt/patient/access-list` | See who has access |
| GET | `/api/consent/pending` | View pending requests |
| GET | `/api/consent/active` | View active consents |
| POST | `/api/consent/grant/:id` | Grant consent |
| POST | `/api/consent/deny/:id` | Deny consent |
| POST | `/api/consent/revoke/:id` | Revoke consent |

## Doctor Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mgmt/doctor/ehr` | Create medical record |
| GET | `/api/mgmt/doctor/ehr/:patientId` | View patient EHR (needs consent) |
| POST | `/api/consent/request` | Request patient consent |
| GET | `/api/consent/check/:patientId` | Check consent status |
| GET | `/api/records/patients/list` | List all patients |

## Nurse Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mgmt/nurse/vitals/:patientId` | View vitals only |

## Lab Tech Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mgmt/lab/upload` | Upload lab results |

## Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mgmt/analysis/trends` | View anonymized stats |

---

# Security Features

## 1. AES-256-GCM Encryption
All sensitive medical data (diagnosis, details, prescriptions) is encrypted before storage using military-grade AES-256-GCM encryption.

**What's encrypted:**
- Diagnosis
- Treatment details
- Prescriptions
- Lab results

**What's NOT encrypted (for search/filtering):**
- Patient ID
- Record type
- Timestamps
- Doctor ID

## 2. Consent-Based Access
- Doctors MUST have explicit patient consent before viewing records
- Patients can revoke consent at any time
- All consent changes are logged

## 3. Role-Based Access Control (RBAC)
- Each role has specific permissions
- Users cannot access data outside their role
- Role is determined by User ID prefix (P, D, N, L, A)

## 4. Audit Logging
Every data access is logged with:
- Who accessed the data
- What action was performed
- When it occurred
- Whether it was allowed or denied

## 5. JWT Authentication
- All requests require valid authentication
- Tokens expire after a set period
- Invalid tokens are rejected

---

# Troubleshooting

## "No Authorization header found"
**Cause:** You didn't include the Bearer token.
**Fix:** Add `Authorization: Bearer <token>` to your request headers.

## "Unauthorized"
**Cause:** Your token is invalid or expired.
**Fix:** Login again to get a new token.

## "Access denied: Unauthorized role"
**Cause:** Your role doesn't have permission for this endpoint.
**Fix:** Use an account with the correct role.

## "CONSENT_REQUIRED"
**Cause:** Doctor attempting to view records without patient consent.
**Fix:** Request consent first using `/api/consent/request`.

## "Error creating medical record"
**Cause:** Missing required fields.
**Fix:** Ensure you include: patientId, title, diagnosis, details.

## Server won't start
**Cause:** Missing environment variables or MongoDB connection issue.
**Fix:** Check your `.env` file and ensure MongoDB is running.

---

# Support

For technical support, please contact your system administrator.

**Version:** 1.0  
**Last Updated:** February 2026

---

*SecureCare - Protecting Patient Privacy, Enabling Better Care*
