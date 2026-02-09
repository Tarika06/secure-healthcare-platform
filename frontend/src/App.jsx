import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProfilePage from './components/ProfilePage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientDashboard from './pages/patient/PatientDashboard';
import NurseDashboard from './pages/nurse/NurseDashboard';
import LabTechDashboard from './pages/lab/LabTechDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['DOCTOR']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute allowedRoles={['DOCTOR']}>
                <ProfilePage role="DOCTOR" dashboardPath="/doctor/dashboard" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRoles={['PATIENT']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute allowedRoles={['PATIENT']}>
                <ProfilePage role="PATIENT" dashboardPath="/patient/dashboard" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nurse/dashboard"
            element={
              <ProtectedRoute allowedRoles={['NURSE']}>
                <NurseDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nurse/profile"
            element={
              <ProtectedRoute allowedRoles={['NURSE']}>
                <ProfilePage role="NURSE" dashboardPath="/nurse/dashboard" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/lab/dashboard"
            element={
              <ProtectedRoute allowedRoles={['LAB_TECHNICIAN']}>
                <LabTechDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lab/profile"
            element={
              <ProtectedRoute allowedRoles={['LAB_TECHNICIAN']}>
                <ProfilePage role="LAB_TECHNICIAN" dashboardPath="/lab/dashboard" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ProfilePage role="ADMIN" dashboardPath="/admin/dashboard" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/unauthorized"
            element={
              <div className="min-h-screen flex items-center justify-center dashboard-bg">
                <div className="card max-w-md text-center">
                  <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
                  <p className="text-slate-600">You don't have permission to access this page.</p>
                  <a href="/login" className="btn-primary mt-4 inline-block">
                    Back to Login
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

