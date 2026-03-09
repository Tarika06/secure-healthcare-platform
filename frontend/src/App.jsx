import { useState } from 'react';
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
import MfaVerifyPage from './pages/MfaVerifyPage';
import MfaSetupPage from './pages/MfaSetupPage';
import PageWrapper from './components/PageWrapper';
import { ThemeProvider } from './context/ThemeContext';
import IntroScreen from './components/IntroScreen';
import ValidatedAppointmentPage from './pages/ValidatedAppointmentPage';
import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Force HMR Update
function App() {
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('hasSeenIntro');
  });

  const AppointmentsRedirect = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;

    let dashboard = '/patient/dashboard';
    let tab = 'appointments';

    if (user.role === 'ADMIN') dashboard = '/admin/dashboard';
    else if (user.role === 'DOCTOR') dashboard = '/doctor/dashboard';
    else if (user.role === 'NURSE') {
      dashboard = '/nurse/dashboard';
      tab = 'verify';
    }

    return <Navigate to={`${dashboard}?tab=${tab}`} />;
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem('hasSeenIntro', 'true');
  };

  return (
    <ThemeProvider>
      {showIntro && <IntroScreen onComplete={handleIntroComplete} />}
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
            <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
            <Route path="/verify-mfa" element={<PageWrapper><MfaVerifyPage /></PageWrapper>} />
            <Route path="/mfa/setup" element={<ProtectedRoute><PageWrapper><MfaSetupPage /></PageWrapper></ProtectedRoute>} />

            {/* Appointment Routes */}
            <Route path="/appointment/:id" element={<PageWrapper><ValidatedAppointmentPage /></PageWrapper>} />
            <Route path="/appointments" element={<ProtectedRoute><AppointmentsRedirect /></ProtectedRoute>} />
            <Route path="/appointments/create" element={<ProtectedRoute><AppointmentsRedirect /></ProtectedRoute>} />
            <Route path="/appointments/:id" element={<ProtectedRoute><AppointmentsRedirect /></ProtectedRoute>} />

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
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

