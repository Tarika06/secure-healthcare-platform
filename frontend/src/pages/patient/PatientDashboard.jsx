import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Shield, Bell, CheckCircle, XCircle, LayoutDashboard, Eye, Heart, Clock, Activity, User, Download, Trash2, ArrowRight, Sun, Moon, Sparkles, KeyRound, AlertTriangle, ShieldAlert, Smartphone, Lock, Unlock, X } from 'lucide-react';
import MedicalCard from '../../components/MedicalCard';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import apiClient from '../../api/client';
import consentApi from '../../api/consentApi';
import gdprApi from '../../api/gdprApi';
import logo from '../../assets/logo.png';

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
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Deletion workflow state
    const [deletionStatus, setDeletionStatus] = useState(null);
    const [showMfaModal, setShowMfaModal] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [mfaError, setMfaError] = useState('');
    const [mfaVerifying, setMfaVerifying] = useState(false);
    const [deletionStep, setDeletionStep] = useState(null); // 'initiate', 'verify', 'confirmed'
    const [notifications, setNotifications] = useState([]);
    const [authNotifications, setAuthNotifications] = useState([]);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [showMobileSim, setShowMobileSim] = useState(false);
    const [mobileStatus, setMobileStatus] = useState('locked'); // 'locked', 'home', 'app'

    useEffect(() => {
        setMounted(true);
    }, []);

    // 📱 Smartphone App Simulator Component
    const MobileAppSimulator = () => {
        const [showVault, setShowVault] = useState(false);
        const [isLocked, setIsLocked] = useState(true);

        const currentHour = new Date().getHours().toString().padStart(2, '0');
        const currentMinute = new Date().getMinutes().toString().padStart(2, '0');

        const activeAuthNotifs = authNotifications.filter(n => !n.acknowledged);

        return (
            <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-700 transform ${showMobileSim ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0'}`}>
                {/* iPhone Prototype Frame */}
                <div className="w-[300px] h-[600px] bg-slate-900 rounded-[45px] border-[8px] border-slate-800 shadow-[0_45px_100px_rgba(0,0,0,0.5)] overflow-hidden relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                        <div className="w-10 h-1 rounded-full bg-slate-700" />
                    </div>

                    {/* Content Screen */}
                    <div className="w-full h-full bg-slate-100 relative overflow-hidden flex flex-col pt-10">
                        {/* Status Bar */}
                        <div className="px-6 py-2 flex justify-between items-center text-[10px] font-bold text-slate-800">
                            <span>{currentHour}:{currentMinute}</span>
                            <div className="flex items-center gap-1.5">
                                <Activity className="w-3 h-3" />
                                <div className="w-4.5 h-2 rounded-sm border border-slate-400 p-[1px]"><div className="w-full h-full bg-slate-800 rounded-sm" /></div>
                            </div>
                        </div>

                        {isLocked ? (
                            /* Lock Screen */
                            <div className="flex-1 flex flex-col items-center justify-between py-12 px-6">
                                <div className="text-center">
                                    <p className="text-4xl font-light text-slate-900">{currentHour}:{currentMinute}</p>
                                    <p className="text-sm font-medium text-slate-600 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                </div>

                                <div className="space-y-3 w-full">
                                    {/* Notifications on Lock Screen */}
                                    {notifications.slice(0, 2).map((n, i) => (
                                        <div key={i} className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-white flex items-start gap-3 animate-slide-up">
                                            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0">
                                                <Shield className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-900 uppercase">SecureCare+</p>
                                                <p className="text-[11px] text-slate-700 line-clamp-2">{n.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {activeAuthNotifs.length > 0 && (
                                        <div className="bg-gradient-to-r from-red-500 to-rose-600 p-3 rounded-2xl shadow-lg flex items-start gap-3 animate-pulse">
                                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                                                <Lock className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-white uppercase">Authenticator</p>
                                                <p className="text-[11px] text-white font-medium">New Secure Notification</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setIsLocked(false)}
                                    className="flex flex-col items-center gap-2 group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <KeyRound className="w-5 h-5 text-slate-700" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Face ID to Unlock</span>
                                </button>
                            </div>
                        ) : !showVault ? (
                            /* Home Screen */
                            <div className="flex-1 p-6">
                                <div className="grid grid-cols-4 gap-4">
                                    <div
                                        onClick={() => setShowVault(true)}
                                        className="flex flex-col items-center gap-1.5 cursor-pointer group"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all text-white relative">
                                            <Shield className="w-6 h-6" />
                                            {activeAuthNotifs.length > 0 && (
                                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-slate-100 flex items-center justify-center">
                                                    {activeAuthNotifs.length}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-600 truncate w-full text-center">SecureCare+</span>
                                    </div>
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="flex flex-col items-center gap-1.5 opacity-50">
                                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm" />
                                            <div className="w-8 h-1.5 rounded-full bg-slate-300" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* App View: Secure Vault */
                            <div className="flex-1 flex flex-col bg-slate-50">
                                <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200">
                                    <button onClick={() => setShowVault(false)} className="p-1 px-2 -ml-1 text-teal-600 font-bold text-[11px] flex items-center">
                                        <ArrowRight className="w-3 h-3 rotate-180 mr-1" /> Home
                                    </button>
                                    <h3 className="text-xs font-bold text-slate-900">Secure Vault</h3>
                                    <div className="w-10" />
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <Activity className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Health ID Verified</p>
                                                <p className="text-[9px] text-slate-400">{user?.userId}</p>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-indigo-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 w-3/4" />
                                        </div>
                                    </div>

                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Secure Notifications</h4>

                                    {activeAuthNotifs.length === 0 ? (
                                        <div className="text-center py-10">
                                            <div className="w-12 h-12 mx-auto mb-2 text-slate-200"><CheckCircle className="w-full h-full" /></div>
                                            <p className="text-[10px] text-slate-400">All clear</p>
                                        </div>
                                    ) : (
                                        activeAuthNotifs.map((n, i) => (
                                            <div key={i} className={`p-3 rounded-2xl border-l-4 ${n.severity === 'critical' ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'} animate-slide-in`}>
                                                <p className="text-[11px] font-bold text-slate-900">{n.title}</p>
                                                <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                                                <button
                                                    onClick={() => handleAcknowledgeNotif(n.id)}
                                                    className="w-full mt-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                                >
                                                    Acknowledge Securely
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Home Indicator */}
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-400/30 rounded-full" />
                    </div>
                </div>

                {/* Close/Minimize Button */}
                <button
                    onClick={() => setShowMobileSim(false)}
                    className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-slate-900 border-4 border-white text-white flex items-center justify-center shadow-lg hover:rotate-90 transition-all z-[110]"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        );
    };

    const handleAcknowledgeNotif = async (id) => {
        try {
            await gdprApi.acknowledgeAuthNotification(id);
            fetchNotifications(); // Refresh list
        } catch (e) { console.error('Acknowledge failed:', e); }
    };

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
        setDeleting(true);
        setMfaError('');
        try {
            const result = await gdprApi.initiateDeletion();
            if (result.mfaRequired) {
                setDeletionStep('verify');
                setShowMfaModal(true);
            }
            await fetchDeletionStatus();
        } catch (error) {
            const errData = error.response?.data;
            if (errData?.code === 'MFA_REQUIRED') {
                alert('⚠️ MFA Required!\n\nYou must enable Multi-Factor Authentication (MFA) via Google Authenticator before you can delete your account.\n\nGo to MFA Setup to enable it first.');
                navigate('/mfa-setup');
            } else if (errData?.code === 'EXISTING_REQUEST') {
                alert('You already have a pending deletion request.');
                await fetchDeletionStatus();
            } else {
                alert('Failed: ' + (errData?.error || error.message));
            }
        } finally {
            setDeleting(false);
        }
    };

    const handleMfaVerify = async () => {
        if (!mfaCode || mfaCode.length < 6) {
            setMfaError('Please enter a valid 6-digit code');
            return;
        }
        setMfaVerifying(true);
        setMfaError('');
        try {
            await gdprApi.verifyMFAForDeletion(mfaCode);
            setDeletionStep('confirmed');
            setShowMfaModal(false);
            setMfaCode('');
            await fetchDeletionStatus();
            await fetchNotifications();
        } catch (error) {
            setMfaError(error.response?.data?.error || 'Invalid code. Try again.');
        } finally {
            setMfaVerifying(false);
        }
    };

    const handleCancelDeletion = async () => {
        if (!confirm('Are you sure you want to cancel the deletion request?')) return;
        setCancelling(true);
        try {
            await gdprApi.cancelDeletion();
            setDeletionStatus(null);
            setDeletionStep(null);
            await fetchDeletionStatus();
        } catch (error) {
            alert('Failed to cancel: ' + (error.response?.data?.error || error.message));
        } finally {
            setCancelling(false);
        }
    };

    const fetchDeletionStatus = async () => {
        try {
            const status = await gdprApi.getDeletionStatus();
            setDeletionStatus(status);
        } catch (e) { console.error('Deletion status error:', e); }
    };

    const fetchNotifications = async () => {
        try {
            const [notifRes, authRes] = await Promise.all([
                gdprApi.getNotifications(),
                gdprApi.getAuthNotifications()
            ]);
            setNotifications(notifRes.notifications || []);
            setAuthNotifications(authRes.notifications || []);
        } catch (e) { console.error('Notifications error:', e); }
    };

    useEffect(() => {
        if (activeTab === 'privacy') {
            fetchDeletionStatus();
            fetchNotifications();
        }
    }, [activeTab]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'records', label: 'Records', icon: FileText },
        { id: 'consent', label: 'Consent', icon: Shield, badge: pendingConsents.length },
        { id: 'history', label: 'Access Log', icon: Eye },
        { id: 'privacy', label: 'Privacy', icon: Shield }
    ];

    const StatCard = ({ icon: Icon, label, value, gradient, delay }) => (
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
            {/* Decorative corner accent */}
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[80px] opacity-[0.04] bg-gradient-to-br ${gradient}`} />
        </div>
    );

    if (loading) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-sans transition-colors duration-500">
            <div className="text-center relative z-10 glass-card p-12">
                <div className="w-16 h-16 border-4 border-teal-200 dark:border-teal-700/50 border-t-teal-600 dark:border-t-teal-400 rounded-full animate-spin mx-auto" />
                <p className="text-slate-500 dark:text-slate-400 mt-6 font-medium">Loading your health data...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-500 text-slate-900 dark:text-white">
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
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => navigate(`/patient/dashboard?tab=${tab.id}`)}
                                className={`${activeTab === tab.id ? 'topnav-pill-active' : 'topnav-pill'} flex items-center gap-2 relative`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="hidden md:inline">{tab.label}</span>
                                {tab.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
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
                            onClick={() => navigate('/mfa-setup')}
                            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all duration-300 hover:scale-110"
                            title="MFA Security"
                        >
                            <KeyRound className="w-4.5 h-4.5" />
                        </button>
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
                                        <Sparkles className="w-5 h-5 text-teal-500 dark:text-teal-400" />
                                        <span className="text-sm font-medium text-teal-600 dark:text-teal-400">{getGreeting()}</span>
                                    </div>
                                    <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">
                                        Welcome back, <span className="text-gradient">{user?.firstName}</span>
                                    </h1>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-lg">
                                        Your health data is securely managed. Review your records, manage consent, and control your privacy — all in one place.
                                    </p>
                                </div>
                                {/* Decorative gradient orb */}
                                <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-gradient-to-br from-teal-400/10 to-cyan-400/10 blur-2xl" />
                                <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-400/8 to-teal-400/8 blur-xl" />
                            </div>

                            {/* Stats Grid */}
                            <div className="grid md:grid-cols-3 gap-6">
                                <StatCard icon={FileText} label="Total Records" value={records.length} gradient="from-blue-500 to-indigo-600" delay={200} />
                                <StatCard icon={Shield} label="Active Consents" value={activeConsents.length} gradient="from-emerald-500 to-green-600" delay={300} />
                                <StatCard icon={Bell} label="Pending Requests" value={pendingConsents.length} gradient="from-amber-500 to-orange-600" delay={400} />
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
                                                <MedicalCard record={record} />
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
                                            <MedicalCard record={record} />
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
                                                            <p className="text-sm text-slate-500">{consent.doctor?.specialty && `${consent.doctor.specialty} • `}Granted {new Date(consent.respondedAt).toLocaleDateString()}</p>
                                                            {consent.expiresAt && (
                                                                <p className={`text-xs mt-1 flex items-center gap-1 font-medium ${new Date(consent.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-amber-600' : 'text-slate-400'}`}>
                                                                    <Clock className="w-3 h-3" />
                                                                    Access Expires: {new Date(consent.expiresAt).toLocaleDateString()}
                                                                    {new Date(consent.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && ' (Soon)'}
                                                                </p>
                                                            )}
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
                    )}

                    {/* ─── Access History Tab ─── */}
                    {activeTab === 'history' && (
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
                    )}

                    {/* ─── Privacy & GDPR Tab ─── */}
                    {activeTab === 'privacy' && (
                        <div className="space-y-8 tab-content">
                            <div className="mb-2">
                                <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Data Privacy & Rights</h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your data portability and check compliance (GDPR & HIPAA)</p>
                            </div>

                            {/* ⚠ DELETION WARNING BANNER */}
                            {deletionStatus?.hasPendingDeletion && (
                                <div className="glass-card border-l-4 border-amber-500 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(239,68,68,0.06) 100%)' }}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-50/30 to-red-50/20 dark:from-amber-900/10 dark:to-red-900/10 pointer-events-none" />
                                    <div className="relative z-10">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse">
                                                <AlertTriangle className="w-7 h-7 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-300">⚠ Account Scheduled for Deletion in {deletionStatus.daysRemaining} day{deletionStatus.daysRemaining !== 1 ? 's' : ''}</h3>
                                                <p className="text-amber-800 dark:text-amber-400 text-sm mt-1">
                                                    Status: <span className="font-bold uppercase">{deletionStatus.status?.replace(/_/g, ' ')}</span> •
                                                    Scheduled: <span className="font-semibold">{new Date(deletionStatus.scheduledDeletionDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                </p>
                                                {deletionStatus.mfaVerified && (
                                                    <p className="text-emerald-700 dark:text-emerald-400 text-xs mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> MFA Verified</p>
                                                )}
                                                {deletionStatus.accountLocked && (
                                                    <p className="text-red-600 dark:text-red-400 text-xs mt-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Account Locked</p>
                                                )}
                                                <div className="flex gap-3 mt-4">
                                                    {deletionStatus.status === 'PENDING_MFA' && (
                                                        <button onClick={() => { setDeletionStep('verify'); setShowMfaModal(true); }} className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg text-sm">
                                                            <ShieldAlert className="w-4 h-4" /> Verify with Authenticator
                                                        </button>
                                                    )}
                                                    <button onClick={handleCancelDeletion} disabled={cancelling} className="flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm">
                                                        {cancelling ? <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <Unlock className="w-4 h-4" />}
                                                        Cancel Deletion
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Countdown bar */}
                                        <div className="mt-4 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full transition-all duration-1000" style={{ width: `${Math.max(5, ((7 - deletionStatus.daysRemaining) / 7) * 100)}%` }} />
                                        </div>
                                        <div className="flex justify-between mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            <span>Requested</span><span>Permanent Deletion</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 🔐 AUTHENTICATOR NOTIFICATIONS */}
                            {authNotifications.length > 0 && (
                                <div className="glass-card border-l-4 border-purple-500">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                                            <Smartphone className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Authenticator Notifications</h3>
                                        <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold">{authNotifications.length}</span>
                                        <button
                                            onClick={() => setShowMobileSim(true)}
                                            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold uppercase transition-transform hover:scale-105"
                                        >
                                            <Smartphone className="w-3 h-3" /> Open Mobile Companion
                                        </button>
                                    </div>
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {authNotifications.map((notif, idx) => (
                                            <div key={notif.id || idx} className={`p-3 rounded-xl border-l-3 ${notif.severity === 'critical' ? 'bg-red-50/60 dark:bg-red-900/10 border-red-400' : notif.severity === 'warning' ? 'bg-amber-50/60 dark:bg-amber-900/10 border-amber-400' : 'bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-400'} transition-all`}>
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{notif.title}</p>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{notif.message}</p>
                                                    </div>
                                                    {notif.requiresMFA && !notif.acknowledged && (
                                                        <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 text-[10px] font-bold flex-shrink-0">MFA Required</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Data Portability */}
                            <div className="glass-card">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                        <Download className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Data Portability (Right to Access)</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-5">
                                            Download a copy of all your personal data and medical records.
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

                            {/* ═══ RIGHT TO ERASURE — Multi-Layer Deletion ═══ */}
                            <div className="glass-card border-l-4 border-red-500 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-red-50/40 to-transparent dark:from-red-900/10 pointer-events-none" />
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                        <Trash2 className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Right to Erasure (Delete Account)</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-2">
                                            Permanently delete your account with a 7-day delayed deletion process.
                                        </p>
                                        {/* Requirements list */}
                                        <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Security Requirements:</p>
                                            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                                                <li className="flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" /> MFA must be enabled via Google Authenticator</li>
                                                <li className="flex items-center gap-2"><Smartphone className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" /> Deletion notification sent to your authenticator app</li>
                                                <li className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" /> 7-day cooling period before permanent deletion</li>
                                                <li className="flex items-center gap-2"><Bell className="w-3.5 h-3.5 text-red-500 flex-shrink-0" /> 24-hour final reminder before irreversible deletion</li>
                                                <li className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" /> Account immediately locked after MFA confirmation</li>
                                            </ul>
                                        </div>
                                        <p className="font-bold text-red-600 dark:text-red-400 text-xs mb-4">⚠ Warning: After 7 days, this action is irreversible. Medical records will be anonymized for compliance.</p>

                                        {!deletionStatus?.hasPendingDeletion ? (
                                            <button onClick={handleDeleteAccount} disabled={deleting} className="btn-danger flex items-center gap-2" id="delete-account-btn">
                                                {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                Request Account Deletion
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <span className="px-4 py-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-semibold flex items-center gap-2">
                                                    <Clock className="w-4 h-4" /> Deletion Pending — {deletionStatus.daysRemaining} day(s) remaining
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 🔔 IN-APP NOTIFICATION HISTORY */}
                            {notifications.length > 0 && (
                                <div className="glass-card">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
                                            <Bell className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Deletion Notifications</h3>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {notifications.map((n, idx) => (
                                            <div key={n.id || idx} className={`p-3 rounded-lg ${n.read ? 'bg-slate-50 dark:bg-slate-800/30' : 'bg-blue-50 dark:bg-blue-900/20 border-l-3 border-blue-400'} text-sm transition-all`}>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{n.message}</p>
                                                <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* 📱 MOBILE SIMULATOR 📱 */}
            <MobileAppSimulator />

            {/* ═══ MFA VERIFICATION MODAL ═══ */}
            {showMfaModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                    <div className="w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden" style={{ background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
                        {/* Header */}
                        <div className="p-6 pb-0">
                            <button onClick={() => { setShowMfaModal(false); setMfaCode(''); setMfaError(''); }} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                    <ShieldAlert className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">MFA Verification Required</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Confirm deletion with your authenticator</p>
                                </div>
                            </div>
                        </div>
                        {/* Body */}
                        <div className="p-6">
                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-5">
                                <p className="text-amber-800 dark:text-amber-300 text-sm font-medium flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                    Enter the 6-digit code from your Google Authenticator app to confirm account deletion.
                                </p>
                            </div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Authenticator Code</label>
                            <input type="text" value={mfaCode} onChange={(e) => { setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setMfaError(''); }} placeholder="000000" maxLength={6}
                                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                autoFocus id="mfa-deletion-code" />
                            {mfaError && (
                                <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> {mfaError}</p>
                            )}
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => { setShowMfaModal(false); setMfaCode(''); setMfaError(''); }} className="flex-1 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                                    Cancel
                                </button>
                                <button onClick={handleMfaVerify} disabled={mfaVerifying || mfaCode.length < 6} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" id="confirm-deletion-mfa-btn">
                                    {mfaVerifying ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><ShieldAlert className="w-4 h-4" /> Confirm Deletion</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDashboard;
