import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Shield, Bell, CheckCircle, XCircle, LayoutDashboard } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import MedicalCard from '../../components/MedicalCard';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import consentApi from '../../api/consentApi';

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
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;
