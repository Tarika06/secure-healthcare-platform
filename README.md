# 🏥 SecureCare+

### Secure Healthcare Information & Patient Management System with Regulatory Compliance

A **cloud-based healthcare information and patient management system** that handles sensitive medical data with privacy, access control, and auditability at its core. The system models real-world healthcare roles such as patients, doctors, and administrators, enabling controlled access to medical records, prescriptions, and lab results through role-based permissions and consent mechanisms.

Engineering decisions are informed by real regulatory principles from **GDPR and HIPAA**, translating legal requirements into practical features like encryption, least-privilege access, consent-driven data sharing, and activity logging. The focus is on building a trustworthy, compliance-aware system with clear architecture, resilience, and realistic workflows.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![HIPAA](https://img.shields.io/badge/HIPAA-Compliant-green)
![GDPR](https://img.shields.io/badge/GDPR-Compliant-blue)
![License](https://img.shields.io/badge/License-ISC-blue)

---

## 📋 System Modules

### 1. � User & Role Management Module
- Handles authentication and role-based access (patients, doctors, admins)
- Implements JWT-based secure authentication
- Ensures **least-privilege access** through granular permissions
- Account lockout protection against brute force attacks

### 2. 📁 Patient Data Management Module
- Manages **encrypted electronic health records (EHR)**
- Stores medical history, lab results, and prescriptions
- Field-level **AES-256-GCM encryption** for sensitive PHI/PII data
- Secure storage of demographics, contact info, and treatment records

### 3. ✅ Consent & Compliance Module
- Manages patient consent for data sharing
- Tracks consent types, validity periods, and revocation
- Enforces **GDPR/HIPAA compliance** rules programmatically
- Consent-driven access control for medical records

### 4. 🤖 AI & Analytics Module (ML / DL / LLM)
- **ML/DL**: Risk stratification and health trend analysis (non-diagnostic)
- **LLM**: Clinical note summarization and structured documentation
- Uses only **anonymized or synthetic data** for model training
- Privacy-preserving analytics and insights

### 5. �️ Security & Anomaly Detection Module
- Detects abnormal access patterns and potential breaches
- Real-time monitoring of system activities
- Supports compliance enforcement and threat mitigation
- Automated alerting for suspicious behavior

### 6. 📝 Audit & Logging Module
- Logs **every data access and system action** immutably
- Captures IP addresses, user agents, and request metadata
- Ensures traceability and **legal audit readiness**
- High-write-optimized for performance at scale

### 7. 📊 Reporting Module (Purpose-Based Reports)
| Report Type | Description |
|-------------|-------------|
| **Clinical Reports** | Patient history & treatment summary |
| **Operational Reports** | Appointments & workflow efficiency |
| **Compliance Reports** | Audit logs & consent status |
| **AI Reports** | Risk trends & anomaly insights |

---

## ✨ Key Features

### � Security & Compliance
- **Field-Level Encryption** — AES-256-GCM encryption for sensitive patient data
- **Role-Based Access Control (RBAC)** — Granular permissions for all user roles
- **JWT Authentication** — Secure token-based authentication with lockout protection
- **Immutable Audit Logging** — Complete traceability of all system actions
- **Security Headers** — Helmet.js with CSP, HSTS, and security best practices

### 👥 Healthcare Roles
| Role | Capabilities |
|------|-------------|
| **Patient** | View own records, manage consents, access health data |
| **Doctor** | Access patient records (with consent), manage treatments |
| **Admin** | System management, user administration, compliance oversight |

### 📋 Patient Records
- Encrypted demographics (name, DOB, gender, address)
- Complete medical history management
- Clinical data tracking (lab results, vital signs, diagnoses)
- Consent management with validity tracking

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js (≥18) | Runtime Environment |
| Express.js | Web Framework |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |
| Helmet | Security Headers |
| bcryptjs | Password Hashing |
| AES-256-GCM | Field Encryption |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI Framework |
| Vite | Build Tool |
| React Router v7 | Routing |
| Axios | HTTP Client |

---

## 📁 Project Structure

```
SecureCare/
├── src/                          # Backend source code
│   ├── app.js                    # Express application entry point
│   ├── config/
│   │   ├── database.js           # MongoDB connection
│   │   └── encryption.js         # AES-256-GCM encryption utilities
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   ├── rbac.js               # Role-based access control
│   │   └── index.js              # Middleware exports
│   ├── models/
│   │   ├── User.js               # User authentication & roles
│   │   ├── Patient.js            # Encrypted patient records
│   │   ├── ClinicalData.js       # Medical data & test results
│   │   ├── Consent.js            # Patient consent tracking
│   │   └── AuditLog.js           # Immutable audit trail
│   ├── routes/                   # API route handlers
│   └── utils/
│       └── auditLogger.js        # Audit logging utilities
├── client/                       # React frontend
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── context/              # Auth context provider
│   │   ├── pages/                # Application pages
│   │   │   ├── Dashboard.jsx     # Role-based dashboard
│   │   │   ├── Patients.jsx      # Patient management
│   │   │   ├── MyRecords.jsx     # Patient health records
│   │   │   ├── Consents.jsx      # Consent management
│   │   │   └── auth/             # Login & Register
│   │   └── api/                  # API client configuration
│   └── public/                   # Static assets
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18.0.0
- MongoDB instance (local or Atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/Tarika06/secure-healthcare-platform.git
cd securecare

# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_64_character_hex_key
ALLOWED_ORIGINS=http://localhost:5173
```

> 💡 **Generate a secure encryption key:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### Running the Application

```bash
# Start backend server (development)
npm run dev

# In a new terminal - Start frontend
cd client
npm run dev
```

| Service | URL |
|---------|-----|
| Backend API | `http://localhost:5000` |
| Frontend | `http://localhost:5173` |

---

## 🔐 Security Implementation

| Feature | Implementation |
|---------|----------------|
| Data Encryption | AES-256-GCM with Mongoose getters/setters |
| Password Hashing | bcrypt with 12 salt rounds |
| Token Authentication | JWT with configurable expiration |
| Access Control | Role-based middleware with auto audit logging |
| Audit Trail | Immutable logs with IP, user agent, metadata |
| Security Headers | Helmet.js (CSP, HSTS, referrer policy) |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | User login |
| GET | `/api/v1/profile` | Get user profile |

### Protected Routes
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/admin/dashboard` | Admin | Admin dashboard data |
| GET | `/api/v1/doctor/patients` | Doctor, Admin | List patients |

---

## 📜 Regulatory Compliance

### HIPAA Compliance
- ✅ Access controls and audit trails
- ✅ Encryption of PHI at rest and in transit
- ✅ Automatic session management
- ✅ 7-year audit log retention capability

### GDPR Compliance
- ✅ Consent-based data processing
- ✅ Right to access personal data
- ✅ Data minimization principles
- ✅ Purpose limitation for data usage

---

## 🤝 Contributing

Contributions are welcome! Please ensure all changes maintain HIPAA/GDPR compliance standards.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the ISC License.

---

