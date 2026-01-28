# SecureCare+ Healthcare Management System

![SecureCare+ Banner](https://img.shields.io/badge/SecureCare+-Healthcare%20Platform-0f766e?style=for-the-badge)

## 🏥 Overview

**SecureCare+** is an enterprise-grade, GDPR & HIPAA-compliant healthcare information management system designed for secure patient data management with role-based access control and comprehensive consent management.

## 🎯 Key Features

### 1. **User & Role Management Module**
- ✅ JWT-based authentication
- ✅ Role-based access control (PATIENT, DOCTOR, ADMIN)
- ✅ Least-privilege access enforcement
- ✅ User registration with privacy policy acceptance
- ✅ Secure password hashing with bcryptjs

### 2. **Patient Data Management Module**
- ✅ Electronic Health Records (EHR) management
- ✅ Multiple record types (Lab Results, Prescriptions, Diagnosis, Imaging, Vitals)
- ✅ Medical history tracking
- ✅ Doctor-created medical reports
- ✅ Patient medical timeline view

### 3. **Consent & Compliance Module**
- ✅ Patient consent workflow (Request → Grant/Deny → Revoke)
- ✅ Explicit consent required for data access
- ✅ 403 Access Denied enforcement
- ✅ GDPR/HIPAA compliance built-in
- ✅ Audit trail for all consent actions

## 🗄️ Database Collections

### **Users Collection**
```javascript
{
  userId: String (unique),
  email: String,
  passwordHash: String,
  firstName: String,
  lastName: String,
  role: enum['PATIENT', 'DOCTOR', 'ADMIN'],
  specialty: String,  // For doctors
  status: enum['ACTIVE', 'SUSPENDED']
}
```

### **MedicalRecords Collection**
```javascript
{
  patientId: String (ref: User),
  recordType: enum['LAB_RESULT', 'PRESCRIPTION', 'DIAGNOSIS', 'IMAGING', 'VITALS', 'GENERAL'],
  title: String,
  diagnosis: String,
  details: String,
  prescription: String,
  createdBy: String (doctorId),
  createdAt: Date,
  metadata: Object
}
```

### **Consents Collection**
```javascript
{
  patientId: String (ref: User),
  doctorId: String (ref: User),
  status: enum['PENDING', 'ACTIVE', 'DENIED', 'REVOKED'],
  purpose: String,
  requestedAt: Date,
  respondedAt: Date,
  revokedAt: Date
}
```

### **AuditLogs Collection**
```javascript
{
  userId: String,
  action: String,
  resource: String,
  status: enum['SUCCESS', 'DENIED'],
  timestamp: Date,
  metadata: Object
}
```

## 🚀 Tech Stack

### Backend
- **Runtime:** Node.js + Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Security:** bcryptjs, CORS
- **Environment:** dotenv

### Frontend
- **Framework:** React 18 + Vite
- **Routing:** React Router DOM v6
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **State Management:** React Context API

## 📁 Project Structure

```
secure-healthcare-platform/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── MedicalRecord.js
│   │   │   ├── Consent.js
│   │   │   └── AuditLog.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── recordRoutes.js
│   │   │   ├── consentRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── patientRoutes.js
│   │   │   ├── doctorRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   ├── services/
│   │   │   └── consentService.js
│   │   ├── config/
│   │   │   └── database.js
│   │   └── server.js
│   ├── .env
│   ├── .gitignore
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Modal.jsx
│   │   │   ├── MedicalCard.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── patient/
│   │   │   │   └── PatientDashboard.jsx
│   │   │   └── doctor/
│   │   │       └── DoctorDashboard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── api/
│   │   │   ├── client.js
│   │   │   └── consentApi.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .gitignore
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/securecare
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

4. Start the backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 👥 Demo Credentials

### Patient Account
- **User ID:** `P001`
- **Password:** `password123`

### Doctor Account
- **User ID:** `D001`
- **Password:** `password123`

## 🔐 API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login

### Consent Routes (`/api/consent`)
- `POST /request` - Doctor requests consent from patient
- `POST /grant/:consentId` - Patient grants consent
- `POST /deny/:consentId` - Patient denies consent
- `POST /revoke/:consentId` - Patient revokes consent
- `GET /pending` - Get pending consent requests (Patient)
- `GET /active` - Get active consents (Patient)
- `GET /check/:patientId` - Check consent status (Doctor)

### Medical Records Routes (`/api/records`)
- `POST /create` - Create medical record (Doctor)
- `GET /my-records` - Get patient's own records (Patient)
- `GET /patient/:patientId` - Get patient records (Doctor, requires consent)
- `GET /patients/list` - List all patients (Doctor)

### User Routes (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile

## 🎨 Design System

### Color Palette
- **Primary (Teal):** `#0f766e` - Medical trust and professionalism
- **Secondary (Slate):** `#f8fafc` - Clean, minimal backgrounds
- **Accent Colors:** Blue, Green, Yellow for status indicators

### Key UI Components
- **Medical Cards:** Color-coded by record type
- **Stats Cards:** Dashboard overview metrics
- **Consent Manager:** Grant/Deny/Revoke interface
- **Modal Dialogs:** Access request notifications

## 🔒 Security Features

✅ **Password Hashing:** bcryptjs with salt rounds  
✅ **JWT Authentication:** Secure token-based auth  
✅ **Role-Based Access Control:** Middleware enforcement  
✅ **Consent-Based Data Access:** 403 blocking without consent  
✅ **CORS Protection:** Configured for specific origins  
✅ **Input Validation:** Server-side validation  
✅ **GDPR/HIPAA Compliance:** Privacy policy acceptance required  

## 📱 Features by Role

### Patient Dashboard
- View all medical records
- Manage consent requests (Grant/Deny/Revoke)
- Dashboard with stats overview
- Medical timeline visualization

### Doctor Dashboard
- Create medical reports for patients
- View patient list
- Request consent to access patient data
- View medical timeline (with consent)
- Handle 403 errors gracefully

## 🤝 Contributing

This is an academic project for SEM-6 Software Engineering coursework.

## 📄 License

Educational Use Only - © 2026 SecureCare+

## 📞 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for secure, compliant healthcare management**
