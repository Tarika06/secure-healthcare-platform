# 🏥 SecureCare+

### Secure Healthcare Information & Patient Management System

A **HIPAA/GDPR compliant** full-stack healthcare management system designed for secure patient data handling, role-based access control, and comprehensive audit logging.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

---

## ✨ Features

### 🔒 Security & Compliance

- **Field-Level Encryption** — AES-256-GCM encryption for sensitive patient data (PHI/PII) including demographics, medical history, and contact information
- **Role-Based Access Control (RBAC)** — Granular permissions for Patients, Doctors, and Administrators
- **JWT Authentication** — Secure token-based authentication with account lockout protection
- **Comprehensive Audit Logging** — Immutable, high-write-optimized audit trail for all system actions
- **Security Headers** — Helmet.js integration with CSP, HSTS, and other security best practices

### 👥 User Management

- **Multi-Role Support** — Distinct experiences for `PATIENT`, `DOCTOR`, and `ADMIN` roles
- **Account Protection** — Failed login tracking with automatic account lockout (5 attempts / 15-minute lockout)
- **Password Security** — bcrypt hashing with configurable salt rounds

### 📋 Patient Records

- **Encrypted Demographics** — Name, DOB, gender, and address stored with field-level encryption
- **Medical History Management** — Conditions, allergies, surgeries, medications, and family history
- **Clinical Data Tracking** — Lab results, vital signs, diagnoses, and prescriptions
- **Consent Management** — Track patient consents for data sharing and treatment

### 📊 Audit & Compliance

- **Immutable Audit Logs** — All access and modifications are permanently recorded
- **Configurable Retention** — Optional TTL index for 7-year HIPAA compliance
- **Query Optimization** — Compound indexes for efficient compliance reporting
- **Action Categories** — Authentication, authorization, patient records, clinical data, and admin actions

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
├── src/                    # Backend source code
│   ├── app.js              # Express application entry point
│   ├── config/             # Database & encryption configuration
│   ├── middleware/         # Auth, RBAC, and audit middleware
│   ├── models/             # Mongoose schemas
│   │   ├── User.js         # User authentication & roles
│   │   ├── Patient.js      # Encrypted patient records
│   │   ├── ClinicalData.js # Medical data & test results
│   │   ├── Consent.js      # Patient consent tracking
│   │   └── AuditLog.js     # Immutable audit trail
│   ├── routes/             # API route handlers
│   └── utils/              # Audit logger utilities
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth context provider
│   │   ├── pages/          # Application pages
│   │   └── api/            # API client configuration
│   └── public/             # Static assets
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
git clone https://github.com/yourusername/securecare.git
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

> 💡 Generate a secure encryption key using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Running the Application

```bash
# Start backend server (development)
npm run dev

# In a new terminal - Start frontend
cd client
npm run dev
```

The backend runs on `http://localhost:5000` and frontend on `http://localhost:5173`

---

## 🔐 Security Implementation

| Feature | Implementation |
|---------|----------------|
| Data Encryption | AES-256-GCM with automatic encrypt/decrypt via Mongoose getters/setters |
| Password Hashing | bcrypt with 12 salt rounds |
| Token Authentication | JWT with configurable expiration |
| Access Control | Role-based middleware with automatic audit logging |
| Audit Trail | Immutable logs with IP, user agent, and request metadata |
| Security Headers | Helmet.js with strict CSP, HSTS, and referrer policy |

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

<p align="center">
  <b>Built with ❤️ for secure healthcare data management</b>
</p>
