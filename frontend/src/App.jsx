import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
import MfaVerifyPage from './pages/MfaVerifyPage';
import MfaSetupPage from './pages/MfaSetupPage';
import ValidatedAppointmentPage from './pages/ValidatedAppointmentPage';
import PageWrapper from './components/PageWrapper';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
            <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
            <Route path="/mfa-verify" element={<PageWrapper><MfaVerifyPage /></PageWrapper>} />
            <Route
              path="/mfa-setup"
              element={
                <ProtectedRoute allowedRoles={['PATIENT', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN', 'ADMIN']}>
                  <PageWrapper><MfaSetupPage /></PageWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <PageWrapper><DoctorDashboard /></PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/profile"
              element={
                <ProtectedRoute allowedRoles={['DOCTOR']}>
                  <PageWrapper><ProfilePage role="DOCTOR" dashboardPath="/doctor/dashboard" /></PageWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/patient/dashboard"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <PageWrapper><PatientDashboard /></PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/profile"
              element={
                <ProtectedRoute allowedRoles={['PATIENT']}>
                  <PageWrapper><ProfilePage role="PATIENT" dashboardPath="/patient/dashboard" /></PageWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/nurse/dashboard"
              element={
                <ProtectedRoute allowedRoles={['NURSE']}>
                  <PageWrapper><NurseDashboard /></PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/nurse/profile"
              element={
                <ProtectedRoute allowedRoles={['NURSE']}>
                  <PageWrapper><ProfilePage role="NURSE" dashboardPath="/nurse/dashboard" /></PageWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/lab/dashboard"
              element={
                <ProtectedRoute allowedRoles={['LAB_TECHNICIAN']}>
                  <PageWrapper><LabTechDashboard /></PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lab/profile"
              element={
                <ProtectedRoute allowedRoles={['LAB_TECHNICIAN']}>
                  <PageWrapper><ProfilePage role="LAB_TECHNICIAN" dashboardPath="/lab/dashboard" /></PageWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <PageWrapper><AdminDashboard /></PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <PageWrapper><ProfilePage role="ADMIN" dashboardPath="/admin/dashboard" /></PageWrapper>
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

            <Route path="/appointment/:id" element={<PageWrapper><ValidatedAppointmentPage /></PageWrapper>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

