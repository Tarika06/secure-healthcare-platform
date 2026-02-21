import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Shield, Bell, CheckCircle, XCircle, LayoutDashboard, Eye, Heart, Clock, Activity, User, Download, Trash2, ArrowRight, Sun, Moon, Sparkles, Pill, AlertTriangle, RotateCcw } from 'lucide-react';
import MedicalCard from '../../components/MedicalCard';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../api/client';
import consentApi from '../../api/consentApi';
import gdprApi from '../../api/gdprApi';
import logo from '../../assets/logo.png';

// Custom Stat Card Component (User Story 8 Visualization)
const StatCard = ({ icon: Icon, label, value, gradient, delay, mounted }) => (
    <div
        className={`glass-card group transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{ transitionDelay: `${delay}ms` }}
    >
        <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg bg-gradient-to-br ${gradient}`}>
                <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="stat-number text-gradient mt-1">{value ?? '—'}</p>
            </div>
        </div>
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[80px] opacity-[0.04] bg-gradient-to-br ${gradient}`} />
    </div>
);

const PatientDashboard = () => {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const [records, setRecords] = useState([]);
    const [pendingConsents, setPendingConsents] = useState([]);
    const [activeConsents, setActiveConsents] = useState([]);
    const [accessHistory, setAccessHistory] = useState([]);
    const [healthReport, setHealthReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [showRectifyModal, setShowRectifyModal] = useState(false);
    const [rectificationNote, setRectificationNote] = useState('');
    const [submittingRectification, setSubmittingRectification] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchRecords = async () => {
        try {
            const response = await apiClient.get('/records/my-records');
            setRecords(response.data.records || []);
        } catch (_) { }
    };

    const fetchConsents = async () => {
        try {
            const [pending, active] = await Promise.all([consentApi.getPendingConsents(), consentApi.getActiveConsents()]);
            setPendingConsents(pending.consents || []);
            setActiveConsents(active.consents || []);
        } catch (_) { }
    };

    const fetchHealthReport = async () => {
        try {
            const response = await apiClient.get('/patient/health-report');
            setHealthReport(response.data);
        } catch (_) { }
    };

    const fetchAccessHistory = async () => {
        try {
            const response = await apiClient.get('/patient/access-history');
            setAccessHistory(response.data.accessHistory || []);
        } catch (_) { }
    };

    useEffect(() => {
        Promise.all([fetchRecords(), fetchConsents()]).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (activeTab === 'history') fetchAccessHistory();
        if (activeTab === 'report') fetchHealthReport();
    }, [activeTab]);

    const handleGrantConsent = async (consentId) => {
        try { await consentApi.grantConsent(consentId); await fetchConsents(); }
        catch (_) { alert('Failed to grant consent'); }
    };

    const handleDenyConsent = async (consentId) => {
        try { await consentApi.denyConsent(consentId); await fetchConsents(); }
        catch (_) { alert('Failed to deny consent'); }
    };

    const handleRevokeConsent = async (consentId) => {
        if (!confirm('Revoke this consent? Doctor will lose access.')) return;
        try { await consentApi.revokeConsent(consentId); await fetchConsents(); }
        catch (error) { alert('Failed to revoke consent'); }
    };

    const handleRectifyRequest = async () => {
        if (!rectificationNote.trim()) return;
        setSubmittingRectification(true);
        try {
            await apiClient.post(`/records/${selectedRecord._id}/rectify`, { patientNote: rectificationNote });
            alert('Rectification request sent to the provider.');
            setShowRectifyModal(false);
            setRectificationNote('');
            fetchRecords(); // Refresh to show status
            setSelectedRecord(null);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to send rectification request');
        } finally {
            setSubmittingRectification(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleDownloadData = async (format) => {
        try {
            setDownloading(true);
            if (format === 'json') {
                const data = await gdprApi.getPersonalData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `my_data_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else if (format === 'pdf') {
                const blob = await gdprApi.exportDataPDF();
                const url = window.URL.createObjectURL(new Blob([blob]));
                const a = document.createElement('a');
                a.href = url;
                a.download = `my_health_record_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
            alert('Data export started successfully.');
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download data. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            "⚠️ DANGER ZONE: Are you sure you want to delete your account?\n\n" +
            "This action cannot be undone. All your personal data will be anonymized or permanently deleted in accordance with GDPR/HIPAA regulations."
        );
        if (confirmed) {
            const doubleCheck = window.prompt("Type 'DELETE' to confirm account deletion:");
            if (doubleCheck === 'DELETE') {
                try {
                    setDeleting(true);
                    await gdprApi.requestErasure();
                    alert('Your account deletion request has been processed. You will now be logged out.');
                    await logout();
                    navigate('/login');
                } catch (error) {
                    console.error('Deletion error:', error);
                    alert('Failed to process deletion request: ' + (error.response?.data?.error || error.message));
                } finally {
                    setDeleting(false);
                }
            }
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'records', label: 'Records', icon: FileText },
        { id: 'report', label: 'My Report', icon: Activity },
        { id: 'consent', label: 'Consent', icon: Shield, badge: pendingConsents.length },
        { id: 'history', label: 'Access Log', icon: Eye },
        { id: 'privacy', label: 'Privacy', icon: Shield }
    ];


    if (loading) return (
        <div className="aurora-bg-patient flex items-center justify-center min-h-screen">
            <div className="text-center relative z-10">
                <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto" />
                <p className="text-slate-500 mt-6 font-medium">Loading your health data...</p>
            </div>
        </div>
    );

    return (
        <div className="aurora-bg-patient min-h-screen">
            {/* ═══ Top Navigation Bar ═══ */}
            <div className="topnav-glass">
                <div className="h-full max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="SecureCare+" className="w-9 h-9 object-contain" />
                        <span className="text-lg font-bold text-gradient hidden sm:block">SecureCare<span className="text-primary-400">+</span></span>
                    </div>

                    {/* Tab Pills */}
                    <nav className="flex items-center gap-1">
                        {tabs.map((tab) => {
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => navigate(`/patient/dashboard?tab=${tab.id}`)}
                                    className={`${activeTab === tab.id ? 'topnav-pill-active' : 'topnav-pill'} flex items-center gap-2 relative`}
                                >
                                    <TabIcon className="w-4 h-4" />
                                    <span className="hidden md:inline">{tab.label}</span>
                                    {tab.badge > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                                            {tab.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* User Area */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 text-slate-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                        </button>
                        <div className="security-badge hidden lg:flex">
                            <Shield className="w-3.5 h-3.5" />
                            <span>Encrypted</span>
                        </div>
                        <button
                            onClick={() => navigate('/patient/profile')}
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
                            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </button>
                        <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══ Main Content (below top bar) ═══ */}
            <main className="pt-[80px] pb-12 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-7xl mx-auto">

                    {/* ─── Overview Tab ─── */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Hero Card */}
                            <div className={`glass-card p-8 relative overflow-hidden transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sparkles className="w-5 h-5 text-teal-500" />
                                        <span className="text-sm font-medium text-teal-600">{getGreeting()}</span>
                                    </div>
                                    <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">
                                        Welcome back, <span className="text-gradient">{user?.firstName}</span>
                                    </h1>
                                    <p className="text-slate-500 max-w-lg">
                                        Your health data is securely managed. Review your records, manage consent, and control your privacy — all in one place.
                                    </p>
                                </div>
                                {/* Decorative gradient orb */}
                                <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-gradient-to-br from-teal-400/10 to-cyan-400/10 blur-2xl" />
                                <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-400/8 to-teal-400/8 blur-xl" />
                            </div>

                            {/* Stats Grid */}
                            <div className="grid md:grid-cols-3 gap-6">
                                <StatCard icon={FileText} label="Total Records" value={records.length} gradient="from-blue-500 to-indigo-600" delay={200} mounted={mounted} />
                                <StatCard icon={Shield} label="Active Consents" value={activeConsents.length} gradient="from-emerald-500 to-green-600" delay={300} mounted={mounted} />
                                <StatCard icon={Bell} label="Pending Requests" value={pendingConsents.length} gradient="from-amber-500 to-orange-600" delay={400} mounted={mounted} />
                            </div>

                            {/* Pending Consent Alert */}
                            {pendingConsents.length > 0 && (
                                <div className={`glass-card border-l-4 border-amber-400 bg-gradient-to-r from-amber-50/80 to-orange-50/50 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                    style={{ transitionDelay: '500ms' }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                                            <Bell className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-amber-900">{pendingConsents.length} pending consent request{pendingConsents.length > 1 ? 's' : ''}</p>
                                            <p className="text-amber-700 text-sm">Healthcare providers are waiting for your approval</p>
                                        </div>
                                        <button onClick={() => navigate('/patient/dashboard?tab=consent')} className="btn-primary flex items-center gap-2">
                                            Review <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Recent Records */}
                            <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                style={{ transitionDelay: '600ms' }}
                            >
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-xl font-heading font-bold text-slate-900">Recent Records</h3>
                                    {records.length > 0 && (
                                        <button onClick={() => navigate('/patient/dashboard?tab=records')} className="text-teal-600 hover:text-teal-700 font-semibold text-sm flex items-center gap-1 group">
                                            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    )}
                                </div>

                                {records.length === 0 ? (
                                    <div className="glass-card text-center py-16">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                                            <FileText className="w-10 h-10 text-slate-400 animate-float" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-800 mb-2">No Records Yet</h3>
                                        <p className="text-slate-500">Your medical records will appear here once created by your healthcare provider.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {records.slice(0, 3).map((record, idx) => (
                                            <div key={record._id} className="stagger-item" style={{ animationDelay: `${700 + idx * 100}ms` }}>
                                                <MedicalCard
                                                    record={record}
                                                    onClick={() => setSelectedRecord(record)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ─── Records Tab ─── */}
                    {activeTab === 'records' && (
                        <div className="tab-content">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-heading font-bold text-slate-900">My Medical Records</h2>
                                    <p className="text-slate-500 mt-1">{records.length} total records</p>
                                </div>
                            </div>

                            {records.length === 0 ? (
                                <div className="glass-card text-center py-16">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                                        <FileText className="w-10 h-10 text-slate-400 animate-float" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-2">No Records Yet</h3>
                                    <p className="text-slate-500">Your records will appear here once created.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {records.map((record, idx) => (
                                        <div key={record._id} className="stagger-item" style={{ animationDelay: `${idx * 80}ms` }}>
                                            <MedicalCard
                                                record={record}
                                                onClick={() => setSelectedRecord(record)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── Consent Tab ─── */}
                    {activeTab === 'consent' && (
                        <div className="space-y-10 tab-content">
                            {/* Pending Requests */}
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                                        <Bell className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-heading font-bold text-slate-900">Pending Requests</h2>
                                    {pendingConsents.length > 0 && (
                                        <span className="badge badge-pending">{pendingConsents.length}</span>
                                    )}
                                </div>

                                {pendingConsents.length === 0 ? (
                                    <div className="glass-card text-center py-12">
                                        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                                        <p className="text-slate-500 font-medium">No pending consent requests — you're all caught up!</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {pendingConsents.map((consent, idx) => (
                                            <div key={consent._id} className="glass-card border-l-4 border-amber-400 hover:shadow-glass-hover stagger-item" style={{ animationDelay: `${idx * 100}ms` }}>
                                                <div className="flex items-start justify-between flex-wrap gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
                                                            {consent.doctor?.firstName?.charAt(0)}{consent.doctor?.lastName?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-slate-900">Dr. {consent.doctor?.firstName} {consent.doctor?.lastName}</h3>
                                                            <p className="text-sm text-slate-500">{consent.doctor?.specialty}</p>
                                                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                Requested {new Date(consent.requestedAt).toLocaleDateString()}
                                                            </p>
                                                            <div className="mt-2 text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-md inline-block border border-amber-100">
                                                                Purpose: {consent.purpose}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleGrantConsent(consent._id)} className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                                                            <CheckCircle className="w-4 h-4" />Grant
                                                        </button>
                                                        <button onClick={() => handleDenyConsent(consent._id)} className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5">
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
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md">
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-heading font-bold text-slate-900">Active Consents</h2>
                                </div>

                                {activeConsents.length === 0 ? (
                                    <div className="glass-card text-center py-12">
                                        <p className="text-slate-500">No active consents at this time.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {activeConsents.map((consent, idx) => (
                                            <div key={consent._id} className="glass-card border-l-4 border-emerald-400 hover:shadow-glass-hover stagger-item" style={{ animationDelay: `${idx * 100}ms` }}>
                                                <div className="flex items-center justify-between flex-wrap gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-semibold shadow-md">
                                                            {consent.doctor?.firstName?.charAt(0)}{consent.doctor?.lastName?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-slate-900">Dr. {consent.doctor?.firstName} {consent.doctor?.lastName}</h3>
                                                            {consent.expiresAt && (
                                                                <p className={`text-xs mt-1 flex items-center gap-1 font-medium ${new Date(consent.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-amber-600' : 'text-slate-400'}`}>
                                                                    <Clock className="w-3 h-3" />
                                                                    Access Expires: {new Date(consent.expiresAt).toLocaleDateString()}
                                                                    {new Date(consent.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && ' (Soon)'}
                                                                </p>
                                                            )}
                                                            <div className="mt-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md inline-block border border-amber-100">
                                                                Purpose: {consent.purpose}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleRevokeConsent(consent._id)} className="btn-danger flex items-center gap-2">
                                                        <XCircle className="w-4 h-4" /> Revoke Access
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                    }

                    {/* ─── Access History Tab ─── */}
                    {
                        activeTab === 'history' && (
                            <div className="tab-content">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-heading font-bold text-slate-900">Access History</h2>
                                    <p className="text-slate-500 mt-1">Track who has accessed your medical records (GDPR compliance)</p>
                                </div>

                                {accessHistory.length === 0 ? (
                                    <div className="glass-card text-center py-16">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                                            <Eye className="w-10 h-10 text-slate-400 animate-float" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-800 mb-2">No Access History</h3>
                                        <p className="text-slate-500">When healthcare providers view your records, it will be logged here.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {accessHistory.map((log, idx) => (
                                            <div key={idx} className="glass-card hover:shadow-glass-hover transition-all duration-300 stagger-item" style={{ animationDelay: `${idx * 80}ms` }}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                                                            <Eye className="w-6 h-6 text-teal-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">{log.accessedBy?.name || log.accessedBy?.userId}</p>
                                                            <p className="text-sm text-slate-500">{log.accessedBy?.role}{log.accessedBy?.specialty && ` • ${log.accessedBy.specialty}`}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium text-slate-900">{new Date(log.accessedAt).toLocaleDateString()}</p>
                                                        <p className="text-xs font-mono text-slate-500">{new Date(log.accessedAt).toLocaleTimeString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {/* ─── Health Report Tab (User Story 8) ─── */}
                    {
                        activeTab === 'report' && (
                            <div className="tab-content space-y-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl font-heading font-bold text-slate-900">Personal Health Report</h2>
                                        <p className="text-slate-500 mt-1">Self-review of your aggregated medical documents</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last Consultation</p>
                                        <p className="text-sm font-semibold text-teal-600">
                                            {healthReport?.summary?.lastConsultation ? new Date(healthReport.summary.lastConsultation).toLocaleDateString() : 'None'}
                                        </p>
                                    </div>
                                </div>

                                {healthReport ? (
                                    <>
                                        {/* Report Summary Cards */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
                                                <span className="text-2xl font-bold text-blue-600">{healthReport.summary.diagnoses.length}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Diagnoses</span>
                                            </div>
                                            <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
                                                <span className="text-2xl font-bold text-emerald-600">{healthReport.summary.prescriptions.length}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Meds</span>
                                            </div>
                                            <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
                                                <span className="text-2xl font-bold text-purple-600">{healthReport.summary.labResults.length}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Labs</span>
                                            </div>
                                            <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
                                                <span className="text-2xl font-bold text-rose-600">{healthReport.summary.vitals.length}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Vitals</span>
                                            </div>
                                        </div>

                                        {/* Grouped History */}
                                        <div className="space-y-6">
                                            <section>
                                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Activity className="w-4 h-4 text-teal-500" /> Recent Activity Log
                                                </h3>
                                                <div className="space-y-3">
                                                    {healthReport.fullHistory.length === 0 ? (
                                                        <p className="text-slate-400 italic text-sm py-4">No records found.</p>
                                                    ) : (
                                                        healthReport.fullHistory.slice(0, 10).map((record, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="glass-card flex items-center justify-between p-4 stagger-item cursor-pointer hover:bg-white/50 transition-all"
                                                                style={{ animationDelay: `${idx * 50}ms` }}
                                                                onClick={() => setSelectedRecord(record)}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.recordType === 'PRESCRIPTION' ? 'bg-emerald-50 text-emerald-600' :
                                                                        record.recordType === 'DIAGNOSIS' ? 'bg-blue-50 text-blue-600' :
                                                                            'bg-slate-50 text-slate-600'
                                                                        }`}>
                                                                        <FileText className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-900 text-sm">{record.title}</p>
                                                                        <p className="text-xs text-slate-500">{new Date(record.createdAt).toLocaleDateString()} • {record.recordType?.replace(/_/g, ' ') || 'GENERAL'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right hidden sm:block">
                                                                    <p className="text-xs font-semibold text-slate-700">{record.diagnosis || 'General Update'}</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </section>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {/* ─── Privacy & GDPR Tab ─── */}
                    {
                        activeTab === 'privacy' && (
                            <div className="space-y-8 tab-content">
                                <div className="mb-2">
                                    <h2 className="text-2xl font-heading font-bold text-slate-900">Data Privacy & Rights</h2>
                                    <p className="text-slate-500 mt-1">Manage your data portability and check compliance (GDPR & HIPAA)</p>
                                </div>

                                {/* Data Portability */}
                                <div className="glass-card">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                            <Download className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-slate-900">Data Portability (Right to Access)</h3>
                                            <p className="text-slate-500 text-sm mt-1 mb-5">
                                                Download a copy of all your personal data and medical records. Choose between machine-readable JSON or a readable PDF report.
                                            </p>
                                            <div className="flex flex-wrap gap-3">
                                                <button onClick={() => handleDownloadData('json')} disabled={downloading} className="btn-secondary flex items-center gap-2">
                                                    {downloading ? <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" /> : <FileText className="w-4 h-4" />}
                                                    Export as JSON
                                                </button>
                                                <button onClick={() => handleDownloadData('pdf')} disabled={downloading} className="btn-primary flex items-center gap-2">
                                                    {downloading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FileText className="w-4 h-4" />}
                                                    Export as PDF
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right to Erasure */}
                                <div className="glass-card border-l-4 border-red-500 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-red-50/40 to-transparent pointer-events-none" />
                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                            <Trash2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-slate-900">Right to Erasure (Delete Account)</h3>
                                            <p className="text-slate-500 text-sm mt-1 mb-4">
                                                Permanently delete your account and anonymize your medical records.
                                                <span className="font-bold text-red-600 block mt-1">⚠ Warning: This action is irreversible.</span>
                                            </p>
                                            <button onClick={handleDeleteAccount} disabled={deleting} className="btn-danger flex items-center gap-2">
                                                {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                Delete My Account
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div >
            </main >

            {/* Record Detail Modal */}
            < Modal
                isOpen={!!selectedRecord}
                onClose={() => setSelectedRecord(null)}
                title={selectedRecord?.title || 'Record Details'}
                icon={FileText}
                size="lg"
            >
                {selectedRecord && (
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-4 items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</p>
                                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 ring-1 ring-teal-100`}>
                                    {selectedRecord.recordType?.replace(/_/g, ' ') || 'GENERAL'}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Date</p>
                                <p className="text-sm font-semibold text-slate-700 mt-1">{new Date(selectedRecord.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Diagnosis / Subject</p>
                            <p className="text-lg font-bold text-slate-900">{selectedRecord.diagnosis}</p>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Clinical Details</p>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
                                "{selectedRecord.details}"
                            </div>
                        </div>

                        {selectedRecord.prescription && (
                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <Pill className="w-3.5 h-3.5" /> Prescription Plan
                                    </p>
                                    <p className="text-slate-800 font-medium">{selectedRecord.prescription}</p>
                                </div>
                                <Pill className="absolute -right-4 -bottom-4 w-20 h-20 text-emerald-600 opacity-[0.05] rotate-12" />
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                                    Dr
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Provider</p>
                                    <p className="text-sm font-semibold text-slate-700">Dr. {selectedRecord.createdBy}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {(!selectedRecord.rectification?.status || selectedRecord.rectification?.status === 'NONE') && (
                                    <button
                                        onClick={() => setShowRectifyModal(true)}
                                        className="px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all flex items-center gap-2"
                                    >
                                        <AlertTriangle className="w-4 h-4" /> Request Correction
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedRecord(null)}
                                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-black transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        {selectedRecord.rectification?.status && selectedRecord.rectification?.status !== 'NONE' && (
                            <div className={`mt-4 p-4 rounded-xl border ${selectedRecord.rectification?.status === 'REQUESTED' ? 'bg-amber-50 border-amber-100' :
                                selectedRecord.rectification?.status === 'FIXED' ? 'bg-emerald-50 border-emerald-100' :
                                    'bg-rose-50 border-rose-100'
                                }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <RotateCcw className={`w-4 h-4 ${selectedRecord.rectification?.status === 'REQUESTED' ? 'text-amber-600' :
                                        selectedRecord.rectification?.status === 'FIXED' ? 'text-emerald-600' :
                                            'text-rose-600'
                                        }`} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Rectification: {selectedRecord.rectification?.status}</span>
                                </div>
                                <p className="text-sm text-slate-700 font-medium">Your Note: {selectedRecord.rectification?.patientNote}</p>
                                {selectedRecord.rectification?.doctorResponse && (
                                    <p className="text-sm text-slate-600 mt-2 p-2 bg-white/50 rounded-lg italic">
                                        Doctor's Response: {selectedRecord.rectification?.doctorResponse}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </Modal >

            {/* Rectification Request Modal */}
            <Modal
                isOpen={showRectifyModal}
                onClose={() => setShowRectifyModal(false)}
                title="Request Correction"
                icon={AlertTriangle}
                size="md"
            >
                <div className="space-y-4">
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 text-left">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-amber-900 text-sm">Right to Rectification</h4>
                            <p className="text-amber-700 text-xs mt-1">
                                Explain clearly what information is incorrect in this record. The providing doctor will review your request.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block px-1">Reason for request</label>
                        <textarea
                            value={rectificationNote}
                            onChange={(e) => setRectificationNote(e.target.value)}
                            placeholder="e.g. The dosage mentioned is incorrect, it should be 10mg instead of 50mg..."
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all font-medium text-slate-700 min-h-[120px]"
                        />
                    </div>

                    <div className="flex gap-3 justify-end mt-4">
                        <button onClick={() => setShowRectifyModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors">Cancel</button>
                        <button
                            onClick={handleRectifyRequest}
                            disabled={submittingRectification || !rectificationNote.trim()}
                            className="btn-primary bg-amber-600 hover:bg-amber-700 py-2.5 px-5 text-sm flex items-center gap-2"
                        >
                            {submittingRectification ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                            Send Request
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
};

export default PatientDashboard;
