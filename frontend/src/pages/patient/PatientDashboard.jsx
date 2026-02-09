import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Shield, Bell, CheckCircle, XCircle, LayoutDashboard, Eye, Heart, Clock, TrendingUp, Activity, User } from 'lucide-react';
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
    const [accessHistory, setAccessHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchRecords = async () => {
        try {
            const response = await apiClient.get('/records/my-records');
            setRecords(response.data.records || []);
        } catch (error) { console.error('Error fetching records:', error); }
    };

    const fetchConsents = async () => {
        try {
            const [pending, active] = await Promise.all([consentApi.getPendingConsents(), consentApi.getActiveConsents()]);
            setPendingConsents(pending.consents || []);
            setActiveConsents(active.consents || []);
        } catch (error) { console.error('Error fetching consents:', error); }
    };

    const fetchAccessHistory = async () => {
        try {
            const response = await apiClient.get('/patient/access-history');
            setAccessHistory(response.data.accessHistory || []);
        } catch (error) { console.error('Error fetching access history:', error); }
    };

    useEffect(() => {
        Promise.all([fetchRecords(), fetchConsents()]).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (activeTab === 'history') fetchAccessHistory();
    }, [activeTab]);

    const handleGrantConsent = async (consentId) => {
        try { await consentApi.grantConsent(consentId); await fetchConsents(); }
        catch (error) { alert('Failed to grant consent'); }
    };

    const handleDenyConsent = async (consentId) => {
        try { await consentApi.denyConsent(consentId); await fetchConsents(); }
        catch (error) { alert('Failed to deny consent'); }
    };

    const handleRevokeConsent = async (consentId) => {
        if (!confirm('Revoke this consent? Doctor will lose access.')) return;
        try { await consentApi.revokeConsent(consentId); await fetchConsents(); }
        catch (error) { alert('Failed to revoke consent'); }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const StatCard = ({ icon: Icon, label, value, colorClass, delay }) => (
        <div
            className={`stat-card-glass group transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${colorClass}`}>
                    <Icon className="w-7 h-7" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
                </div>
            </div>
        </div>
    );

    const tabs = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'records', label: 'My Records', icon: FileText },
        { id: 'consent', label: 'Consent Manager', icon: Shield, badge: pendingConsents.length },
        { id: 'history', label: 'Access History', icon: Eye }
    ];

    if (loading) return (
        <div className="flex min-h-screen">
            <Sidebar role="PATIENT" onLogout={handleLogout} pendingConsents={pendingConsents.length} />
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
                    <p className="text-slate-500 mt-4">Loading your health data...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen dashboard-glass-bg">
            <Sidebar role="PATIENT" onLogout={handleLogout} pendingConsents={pendingConsents.length} />

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
                                <Heart className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">Patient Dashboard</h1>
                                <p className="text-slate-500">Welcome back, <span className="text-primary-600 font-medium">{user?.firstName} {user?.lastName}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className={`flex gap-2 mb-8 overflow-x-auto pb-2 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => navigate(`/patient/dashboard?tab=${tab.id}`)}
                                className={`relative flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-primary-600 to-teal-600 text-white shadow-lg shadow-primary-500/25'
                                    : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                                {tab.badge > 0 && (
                                    <span className={`ml-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${activeTab === tab.id ? 'bg-white/30 text-white' : 'bg-red-500 text-white'
                                        }`}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Stats */}
                            <div className="grid md:grid-cols-3 gap-6">
                                <StatCard icon={FileText} label="Total Records" value={records.length} colorClass="icon-container-blue" delay={100} />
                                <StatCard icon={Shield} label="Active Consents" value={activeConsents.length} colorClass="icon-container-green" delay={200} />
                                <StatCard icon={Bell} label="Pending Requests" value={pendingConsents.length} colorClass="icon-container-amber" delay={300} />
                            </div>

                            {/* Recent Records */}
                            <div className={`transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-slate-900">Recent Records</h3>
                                    {records.length > 0 && (
                                        <button onClick={() => navigate('/patient/dashboard?tab=records')} className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-1">
                                            View All <span>→</span>
                                        </button>
                                    )}
                                </div>

                                {records.length === 0 ? (
                                    <div className="card text-center py-16">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                                            <FileText className="w-10 h-10 text-slate-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-900 mb-2">No Records Yet</h3>
                                        <p className="text-slate-500">Your medical records will appear here once created by your healthcare provider.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {records.slice(0, 3).map((record, idx) => (
                                            <div key={record._id} style={{ animationDelay: `${500 + idx * 100}ms` }}>
                                                <MedicalCard record={record} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pending Consent Alert */}
                            {pendingConsents.length > 0 && (
                                <div className={`p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-2xl transition-all duration-700 delay-600 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                            <Bell className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-amber-900">{pendingConsents.length} pending consent request{pendingConsents.length > 1 ? 's' : ''}</p>
                                            <p className="text-amber-700 text-sm">Healthcare providers are waiting for your approval to access your records</p>
                                        </div>
                                        <button onClick={() => navigate('/patient/dashboard?tab=consent')} className="btn-primary">
                                            Review Now
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Records Tab */}
                    {activeTab === 'records' && (
                        <div className={`transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">My Medical Records</h2>
                                    <p className="text-slate-500 mt-1">{records.length} total records</p>
                                </div>
                            </div>

                            {records.length === 0 ? (
                                <div className="card text-center py-16">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                                        <FileText className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Records Yet</h3>
                                    <p className="text-slate-500">Your records will appear here once created.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {records.map((record, idx) => (
                                        <div key={record._id} style={{ animationDelay: `${idx * 100}ms` }}>
                                            <MedicalCard record={record} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Consent Tab */}
                    {activeTab === 'consent' && (
                        <div className={`space-y-8 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                            {/* Pending Requests */}
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                        <Bell className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900">Pending Requests</h2>
                                    {pendingConsents.length > 0 && (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">{pendingConsents.length}</span>
                                    )}
                                </div>

                                {pendingConsents.length === 0 ? (
                                    <div className="card text-center py-12">
                                        <p className="text-slate-500">No pending consent requests</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {pendingConsents.map((consent, idx) => (
                                            <div key={consent._id} className="card hover:shadow-xl transition-all duration-300 border-l-4 border-amber-400" style={{ animationDelay: `${idx * 100}ms` }}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                                                            {consent.doctor?.firstName?.charAt(0)}{consent.doctor?.lastName?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-slate-900">Dr. {consent.doctor?.firstName} {consent.doctor?.lastName}</h3>
                                                            <p className="text-sm text-slate-500">{consent.doctor?.specialty}</p>
                                                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                Requested {new Date(consent.requestedAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleGrantConsent(consent._id)} className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg">
                                                            <CheckCircle className="w-4 h-4" />Grant
                                                        </button>
                                                        <button onClick={() => handleDenyConsent(consent._id)} className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg">
                                                            <XCircle className="w-4 h-4" />Deny
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
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900">Active Consents</h2>
                                </div>

                                {activeConsents.length === 0 ? (
                                    <div className="card text-center py-12">
                                        <p className="text-slate-500">No active consents</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {activeConsents.map((consent, idx) => (
                                            <div key={consent._id} className="card hover:shadow-xl transition-all duration-300 border-l-4 border-green-400" style={{ animationDelay: `${idx * 100}ms` }}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold">
                                                            {consent.doctor?.firstName?.charAt(0)}{consent.doctor?.lastName?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-slate-900">Dr. {consent.doctor?.firstName} {consent.doctor?.lastName}</h3>
                                                            <p className="text-sm text-slate-500">{consent.doctor?.specialty && `${consent.doctor.specialty} • `}Granted {new Date(consent.respondedAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleRevokeConsent(consent._id)} className="btn-danger">
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

                    {/* Access History Tab */}
                    {activeTab === 'history' && (
                        <div className={`transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-slate-900">Access History</h2>
                                <p className="text-slate-500 mt-1">Track who has accessed your medical records (GDPR compliance)</p>
                            </div>

                            {accessHistory.length === 0 ? (
                                <div className="card text-center py-16">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Eye className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Access History</h3>
                                    <p className="text-slate-500">When healthcare providers view your records, it will be logged here.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {accessHistory.map((log, idx) => (
                                        <div key={idx} className="card hover:shadow-xl transition-all duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-teal-100 flex items-center justify-center">
                                                        <Eye className="w-6 h-6 text-primary-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{log.accessedBy?.name || log.accessedBy?.userId}</p>
                                                        <p className="text-sm text-slate-500">{log.accessedBy?.role}{log.accessedBy?.specialty && ` • ${log.accessedBy.specialty}`}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-slate-900">{new Date(log.accessedAt).toLocaleDateString()}</p>
                                                    <p className="text-xs text-slate-500">{new Date(log.accessedAt).toLocaleTimeString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;
