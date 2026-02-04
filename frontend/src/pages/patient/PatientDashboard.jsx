import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Shield, Bell, CheckCircle, XCircle, LayoutDashboard, ShieldCheck, Download, Trash2, FileJson } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import MedicalCard from '../../components/MedicalCard';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import consentApi from '../../api/consentApi';
import gdprApi from '../../api/gdprApi';

const PatientDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const [records, setRecords] = useState([]);
    const [pendingConsents, setPendingConsents] = useState([]);
    const [activeConsents, setActiveConsents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch medical records
    const fetchRecords = async () => {
        try {
            const response = await apiClient.get('/records/my-records');
            setRecords(response.data.records || []);
        } catch (error) {
            console.error('Error fetching records:', error);
        }
    };

    // Fetch consent data
    const fetchConsents = async () => {
        try {
            const [pending, active] = await Promise.all([
                consentApi.getPendingConsents(),
                consentApi.getActiveConsents()
            ]);
            setPendingConsents(pending.consents || []);
            setActiveConsents(active.consents || []);
        } catch (error) {
            console.error('Error fetching consents:', error);
        }
    };

    useEffect(() => {
        Promise.all([fetchRecords(), fetchConsents()]).finally(() => setLoading(false));
    }, []);

    const handleGrantConsent = async (consentId) => {
        try {
            await consentApi.grantConsent(consentId);
            await fetchConsents(); // Refresh
        } catch (error) {
            alert('Failed to grant consent');
        }
    };

    const handleDenyConsent = async (consentId) => {
        try {
            await consentApi.denyConsent(consentId);
            await fetchConsents(); // Refresh
        } catch (error) {
            alert('Failed to deny consent');
        }
    };

    const handleRevokeConsent = async (consentId) => {
        if (!confirm('Are you sure you want to revoke this consent? The doctor will no longer be able to access your records.')) {
            return;
        }

        try {
            await consentApi.revokeConsent(consentId);
            await fetchConsents(); // Refresh
        } catch (error) {
            alert('Failed to revoke consent');
        }
    };

    const handleDownloadJSON = async () => {
        try {
            const data = await gdprApi.getPersonalData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `medical_data_${user.userId}.json`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            alert('Failed to download JSON data');
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const blob = await gdprApi.exportDataPDF();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `medical_data_${user.userId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            alert('Failed to download PDF report');
        }
    };

    const handleErasureRequest = async () => {
        const confirmed = confirm(
            "CRITICAL WARNING: This will anonymize your personal information and retract all medical consents. " +
            "You will NO LONGER be able to log in with this account. This action is IRREVERSIBLE.\n\n" +
            "Are you absolutely sure you want to proceed?"
        );

        if (!confirmed) return;

        try {
            await gdprApi.requestErasure();
            alert("Your account has been anonymized. You will now be logged out.");
            handleLogout();
        } catch (error) {
            alert("Erasure request failed: " + (error.response?.data?.message || error.message));
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="flex h-screen">
                <Sidebar role="PATIENT" onLogout={handleLogout} pendingConsents={pendingConsents.length} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700 mx-auto"></div>
                        <p className="mt-4 text-slate-600">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar role="PATIENT" onLogout={handleLogout} pendingConsents={pendingConsents.length} />

            <div className="flex-1 overflow-y-auto">
                <div className="container-medical">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900">Patient Dashboard</h1>
                        <p className="text-slate-600 mt-1">Welcome back, {user?.firstName} {user?.lastName}</p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-4 border-b border-slate-200 mb-8">
                        <button
                            onClick={() => navigate('/patient/dashboard?tab=overview')}
                            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${activeTab === 'overview'
                                ? 'border-primary-700 text-primary-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <LayoutDashboard className="h-5 w-5 inline mr-2" />
                            Dashboard
                        </button>
                        <button
                            onClick={() => navigate('/patient/dashboard?tab=records')}
                            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${activeTab === 'records'
                                ? 'border-primary-700 text-primary-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <FileText className="h-5 w-5 inline mr-2" />
                            My Records
                        </button>
                        <button
                            onClick={() => navigate('/patient/dashboard?tab=consent')}
                            className={`pb-3 px-1 border-b-2 font-medium transition-colors relative ${activeTab === 'consent'
                                ? 'border-primary-700 text-primary-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Shield className="h-5 w-5 inline mr-2" />
                            Consent Manager
                            {pendingConsents.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {pendingConsents.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => navigate('/patient/dashboard?tab=privacy')}
                            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${activeTab === 'privacy'
                                ? 'border-primary-700 text-primary-700'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <ShieldCheck className="h-5 w-5 inline mr-2" />
                            Privacy & GDPR
                        </button>
                    </div>

                    {/* Dashboard Overview Tab */}
                    {activeTab === 'overview' && (
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Overview</h2>

                            <div className="grid md:grid-cols-3 gap-6 mb-8">
                                <div className="card-medical">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <FileText className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Total Records</p>
                                            <p className="text-2xl font-bold text-slate-900">{records.length}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-medical">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                                            <Shield className="h-6 w-6 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Active Consents</p>
                                            <p className="text-2xl font-bold text-slate-900">{activeConsents.length}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-medical">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                                            <Bell className="h-6 w-6 text-yellow-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-600">Pending Requests</p>
                                            <p className="text-2xl font-bold text-slate-900">{pendingConsents.length}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Records */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-slate-900">Recent Medical Records</h3>
                                    {records.length > 0 && (
                                        <button
                                            onClick={() => navigate('/patient/dashboard?tab=records')}
                                            className="text-primary-700 hover:text-primary-800 font-medium text-sm"
                                        >
                                            View All →
                                        </button>
                                    )}
                                </div>

                                {records.length === 0 ? (
                                    <div className="card text-center py-12">
                                        <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Medical Records Yet</h3>
                                        <p className="text-slate-600">Your medical records will appear here once created by your doctor.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {records.slice(0, 3).map((record) => (
                                            <MedicalCard key={record._id} record={record} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pending Consent Alerts */}
                            {pendingConsents.length > 0 && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Bell className="h-5 w-5 text-yellow-600" />
                                        <div className="flex-1">
                                            <p className="font-semibold text-yellow-800">
                                                You have {pendingConsents.length} pending consent request{pendingConsents.length > 1 ? 's' : ''}
                                            </p>
                                            <p className="text-sm text-yellow-700 mt-1">
                                                Review and respond to access requests from doctors
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => navigate('/patient/dashboard?tab=consent')}
                                            className="btn-primary"
                                        >
                                            Review Now
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* My Records Tab */}
                    {activeTab === 'records' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-slate-900">My Medical Records</h2>
                                <span className="text-sm text-slate-600">{records.length} total records</span>
                            </div>

                            {records.length === 0 ? (
                                <div className="card text-center py-12">
                                    <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Medical Records Yet</h3>
                                    <p className="text-slate-600">Your medical records will appear here once created by your doctor.</p>
                                </div>
                            ) : (
                                <div className="grid gap-6">
                                    {records.map((record) => (
                                        <MedicalCard key={record._id} record={record} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Consent Manager Tab */}
                    {activeTab === 'consent' && (
                        <div className="space-y-8">
                            {/* Pending Requests */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Bell className="h-6 w-6 text-yellow-600" />
                                    <h2 className="text-2xl font-bold text-slate-900">Pending Requests</h2>
                                    {pendingConsents.length > 0 && (
                                        <span className="badge badge-pending">{pendingConsents.length} pending</span>
                                    )}
                                </div>

                                {pendingConsents.length === 0 ? (
                                    <div className="card text-center py-8">
                                        <p className="text-slate-600">No pending consent requests</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {pendingConsents.map((consent) => (
                                            <div key={consent._id} className="card-medical">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-slate-900">
                                                            Access Request from Dr. {consent.doctor?.firstName} {consent.doctor?.lastName}
                                                        </h3>
                                                        <p className="text-sm text-slate-600 mt-1">
                                                            {consent.doctor?.specialty && `Specialty: ${consent.doctor.specialty}`}
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-2">
                                                            Requested on {new Date(consent.requestedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleGrantConsent(consent._id)}
                                                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                            Grant
                                                        </button>
                                                        <button
                                                            onClick={() => handleDenyConsent(consent._id)}
                                                            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                            Deny
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Active Consents */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                    <h2 className="text-2xl font-bold text-slate-900">Active Consents</h2>
                                </div>

                                {activeConsents.length === 0 ? (
                                    <div className="card text-center py-8">
                                        <p className="text-slate-600">No active consents</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {activeConsents.map((consent) => (
                                            <div key={consent._id} className="card">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-slate-900">
                                                            Dr. {consent.doctor?.firstName} {consent.doctor?.lastName}
                                                        </h3>
                                                        <p className="text-sm text-slate-600">
                                                            {consent.doctor?.specialty && `${consent.doctor.specialty} • `}
                                                            Granted on {new Date(consent.respondedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRevokeConsent(consent._id)}
                                                        className="btn-danger"
                                                    >
                                                        Revoke Access
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Privacy & GDPR Tab */}
                    {activeTab === 'privacy' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-slate-900">Privacy & Data Management</h2>
                                <p className="text-slate-600">Manage your data rights under GDPR compliance.</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Right to Access */}
                                <div className="card-medical p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Download className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">Right to Access</h3>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-6">
                                        Download a complete copy of your personal and medical data stored in our system.
                                        You can choose between a machine-readable JSON format or a portable PDF report.
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={handleDownloadJSON}
                                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                                        >
                                            <FileJson className="h-4 w-4" />
                                            Download JSON
                                        </button>
                                        <button
                                            onClick={handleDownloadPDF}
                                            className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                                        >
                                            <FileText className="h-4 w-4" />
                                            Download PDF Report
                                        </button>
                                    </div>
                                </div>

                                {/* Right to Erasure */}
                                <div className="card-medical p-6 border-red-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-red-100 rounded-lg">
                                            <Trash2 className="h-6 w-6 text-red-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 text-red-700">Right to Erasure</h3>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-6">
                                        Request the anonymization of your personal data. Medical records will be pseudonymized for legal compliance,
                                        but your personal identifiers (name, email) will be permanently erased.
                                    </p>
                                    <button
                                        onClick={handleErasureRequest}
                                        className="flex items-center gap-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Request Data Erasure
                                    </button>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start">
                                <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-blue-900">GDPR Compliance</p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        All operations are audited and stored securely. Your data is encrypted at rest using AES-256 standards.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;
