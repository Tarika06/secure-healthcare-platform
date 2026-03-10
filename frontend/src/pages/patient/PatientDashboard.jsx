import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    FileText, Shield, Bell, CheckCircle, XCircle, LayoutDashboard,
    Eye, Heart, Clock, Activity, Download, Trash2,
    ArrowRight, Sparkles, KeyRound, AlertTriangle,
    ShieldAlert, Smartphone, Lock, X, Calendar, ScanLine,
    Target, ClipboardList, Stethoscope, Droplet, Ruler, Pencil, Check
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import MedicalCard from '../../components/MedicalCard';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import consentApi from '../../api/consentApi';
import gdprApi from '../../api/gdprApi';
import PatientAppointmentsTab from '../../components/patient/PatientAppointmentsTab';
import AppointmentsWidget from '../../components/patient/AppointmentsWidget';

// Helper Components
const StatCard = ({ icon: Icon, label, value, colorType, delay, mounted }) => {
    const themes = {
        blue: {
            base: 'border-blue-100/50 dark:border-blue-900/20',
            iconBg: 'bg-blue-600/10 text-blue-600',
            accent: 'bg-blue-600'
        },
        teal: {
            base: 'border-teal-100/50 dark:border-teal-900/20',
            iconBg: 'bg-teal-600/10 text-teal-600',
            accent: 'bg-teal-600'
        },
        amber: {
            base: 'border-amber-100/50 dark:border-amber-900/20',
            iconBg: 'bg-amber-600/10 text-amber-600',
            accent: 'bg-amber-600'
        },
        violet: {
            base: 'border-violet-100/50 dark:border-violet-900/20',
            iconBg: 'bg-violet-600/10 text-violet-600',
            accent: 'bg-violet-600'
        }
    }[colorType] || themes.blue;

    return (
        <div
            className={`card-premium group ${themes.base} ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-2xl ${themes.iconBg} flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">
                    {value ?? '0'}
                </h3>
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {label}
                </p>
            </div>
            <div className={`absolute bottom-0 left-0 w-full h-1 ${themes.accent} opacity-20 group-hover:opacity-100 transition-opacity`}></div>
        </div>
    );
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

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
    const [downloading, setDownloading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletionStep, setDeletionStep] = useState(null);
    const [cancelling, setCancelling] = useState(false);

    // Reports Branch State
    const [healthReport, setHealthReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);

    // Deletion workflow state (Main Branch)
    const [deletionStatus, setDeletionStatus] = useState(null);
    const [showMfaModal, setShowMfaModal] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [mfaError, setMfaError] = useState('');
    const [mfaVerifying, setMfaVerifying] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [authNotifications, setAuthNotifications] = useState([]);
    const [showMobileSim, setShowMobileSim] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Patient Profile Card state
    const [profileFirstName, setProfileFirstName] = useState(user?.firstName || '');
    const [profileLastName, setProfileLastName] = useState(user?.lastName || '');
    const [profileEmail, setProfileEmail] = useState(user?.email || '');
    const [profileBloodType, setProfileBloodType] = useState('');
    const [profileHeight, setProfileHeight] = useState('');
    const [editingProfile, setEditingProfile] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    const isHealthFlowTheme = false; // Forced to false so everyone sees the new animated background

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchRecords = useCallback(async () => {
        try {
            const response = await apiClient.get('/records/my-records');
            setRecords(response.data.records || []);
        } catch (error) { console.error('Error fetching records:', error); }
    }, []);

    const fetchConsents = useCallback(async () => {
        try {
            const [pending, active] = await Promise.all([consentApi.getPendingConsents(), consentApi.getActiveConsents()]);
            setPendingConsents(pending.consents || []);
            setActiveConsents(active.consents || []);
        } catch (error) { console.error('Error fetching consents:', error); }
    }, []);

    const fetchAccessHistory = useCallback(async () => {
        try {
            const response = await apiClient.get('/patient/access-history');
            setAccessHistory(response.data.accessHistory || []);
        } catch (error) { console.error('Error fetching access history:', error); }
    }, []);

    const fetchDeletionStatus = useCallback(async () => {
        try {
            const status = await gdprApi.getDeletionStatus();
            setDeletionStatus(status);
        } catch (e) { console.error('Deletion status error:', e); }
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const [notifRes, authRes] = await Promise.all([
                gdprApi.getNotifications(),
                gdprApi.getAuthNotifications()
            ]);
            setNotifications(notifRes.notifications || []);
            setAuthNotifications(authRes.notifications || []);
        } catch (e) { console.error('Notifications error:', e); }
    }, []);

    const fetchHealthReport = useCallback(async () => {
        setReportLoading(true);
        try {
            const response = await apiClient.get('/patient/health-report');
            setHealthReport(response.data.report);
        } catch (error) { console.error('Error fetching health report:', error); }
        finally { setReportLoading(false); }
    }, []);

    // Fetch profile for blood type & height
    const fetchProfile = useCallback(async () => {
        try {
            const response = await apiClient.get('/user/profile');
            setProfileBloodType(response.data.bloodType || '');
            setProfileHeight(response.data.height || '');
            setProfileFirstName(response.data.firstName || user?.firstName || '');
            setProfileLastName(response.data.lastName || user?.lastName || '');
            setProfileEmail(response.data.email || user?.email || '');
        } catch (error) { console.error('Error fetching profile:', error); }
    }, [user]);

    // Save profile (blood type & height + basic info)
    const saveProfile = async () => {
        setSavingProfile(true);
        try {
            await apiClient.put('/user/profile', {
                firstName: profileFirstName,
                lastName: profileLastName,
                email: profileEmail,
                bloodType: profileBloodType,
                height: profileHeight ? Number(profileHeight) : null
            });
            setEditingProfile(false);
            window.location.reload(); // Refresh the page to reload the auth token/context with new name
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to update profile');
        } finally { setSavingProfile(false); }
    };

    useEffect(() => {
        Promise.all([fetchRecords(), fetchConsents(), fetchNotifications(), fetchProfile()]).finally(() => setLoading(false));
    }, [fetchRecords, fetchConsents, fetchNotifications, fetchProfile]);

    useEffect(() => {
        if (activeTab === 'history') fetchAccessHistory();
        if (activeTab === 'privacy') {
            fetchDeletionStatus();
            fetchNotifications();
        }
        if (activeTab === 'report' && !healthReport) fetchHealthReport();
    }, [activeTab, fetchAccessHistory, fetchDeletionStatus, fetchNotifications, healthReport, fetchHealthReport]);

    const handleGrantConsent = async (consentId) => {
        try { await consentApi.grantConsent(consentId); await fetchConsents(); }
        catch { alert('Failed to grant consent'); }
    };

    const handleDenyConsent = async (consentId) => {
        try { await consentApi.denyConsent(consentId); await fetchConsents(); }
        catch { alert('Failed to deny consent'); }
    };

    const handleRevokeConsent = async (consentId) => {
        if (!confirm('Revoke this consent? Doctor will lose access.')) return;
        try { await consentApi.revokeConsent(consentId); await fetchConsents(); }
        catch { alert('Failed to revoke consent'); }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleDownloadData = async (format) => {
        setDownloading(true);
        try {
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
            alert('Failed to download data.');
        } finally { setDownloading(false); }
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
                alert('MFA Required! Enable Multi-Factor Authentication first.');
                navigate('/mfa-setup');
            } else {
                alert('Failed: ' + (errData?.error || error.message));
            }
        } finally { setDeleting(false); }
    };

    const handleMfaVerify = async () => {
        if (!mfaCode || mfaCode.length < 6) {
            setMfaError('Enter a valid 6-digit code');
            return;
        }
        setMfaVerifying(true);
        try {
            await gdprApi.verifyMFAForDeletion(mfaCode);
            setDeletionStep('confirmed');
            setShowMfaModal(false);
            setMfaCode('');
            await fetchDeletionStatus();
            await fetchNotifications();
        } catch (error) {
            setMfaError(error.response?.data?.error || 'Invalid code');
        } finally { setMfaVerifying(false); }
    };

    const handleCancelDeletion = async () => {
        if (!confirm('Cancel deletion request?')) return;
        setCancelling(true);
        try {
            await gdprApi.cancelDeletion();
            setDeletionStatus(null);
            setDeletionStep(null);
            await fetchDeletionStatus();
        } catch (error) {
            alert('Failed to cancel: ' + (error.response?.data?.error || error.message));
        } finally { setCancelling(false); }
    };

    const handleAcknowledgeNotif = async (id) => {
        try {
            await gdprApi.acknowledgeAuthNotification(id);
            fetchNotifications();
        } catch (e) { console.error('Acknowledge failed:', e); }
    };

    const MobileAppSimulator = () => {
        const [showVault, setShowVault] = useState(false);
        const [isLocked, setIsLocked] = useState(true);
        const currentHour = new Date().getHours().toString().padStart(2, '0');
        const currentMinute = new Date().getMinutes().toString().padStart(2, '0');
        const activeAuthNotifs = authNotifications.filter(n => !n.acknowledged);

        return (
            <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-700 transform ${showMobileSim ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0'}`}>
                <div className="w-[300px] h-[600px] bg-slate-900 rounded-[45px] border-[8px] border-slate-800 shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-700" /><div className="w-10 h-1 rounded-full bg-slate-700" /></div>
                    <div className="w-full h-full bg-slate-100 relative overflow-hidden flex flex-col pt-10">
                        <div className="px-6 py-2 flex justify-between items-center text-[10px] font-bold text-slate-800"><span>{currentHour}:{currentMinute}</span><div className="flex items-center gap-1.5"><Activity className="w-3 h-3" /><div className="w-4.5 h-2 border border-slate-400 p-[1px]"><div className="w-full h-full bg-slate-800" /></div></div></div>
                        {isLocked ? (
                            <div className="flex-1 flex flex-col items-center justify-between py-12 px-6">
                                <div className="text-center"><p className="text-4xl font-light text-slate-900">{currentHour}:{currentMinute}</p><p className="text-sm font-medium text-slate-600 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p></div>
                                <div className="space-y-3 w-full">
                                    {notifications.slice(0, 2).map((n, i) => (
                                        <div key={i} className="bg-white/80 p-3 rounded-2xl shadow-sm border border-white flex items-start gap-3"><div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0"><Shield className="w-4 h-4 text-white" /></div><div><p className="text-[10px] font-bold text-slate-900">SecureCare+</p><p className="text-[11px] text-slate-700 line-clamp-2">{n.message}</p></div></div>
                                    ))}
                                    {activeAuthNotifs.length > 0 && (
                                        <div className="bg-gradient-to-r from-red-500 to-rose-600 p-3 rounded-2xl shadow-lg flex items-start gap-3 animate-pulse"><div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0"><Lock className="w-4 h-4 text-white" /></div><div><p className="text-[10px] font-bold text-white">Authenticator</p><p className="text-[11px] text-white">New Verification Request</p></div></div>
                                    )}
                                </div>
                                <button onClick={() => setIsLocked(false)} className="flex flex-col items-center gap-2 outline-none"><div className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center"><KeyRound className="w-5 h-5 text-slate-700" /></div><span className="text-[10px] font-bold text-slate-500 uppercase">Face ID to Unlock</span></button>
                            </div>
                        ) : !showVault ? (
                            <div className="flex-1 p-6"><div className="grid grid-cols-4 gap-4"><div onClick={() => setShowVault(true)} className="flex flex-col items-center gap-1.5 cursor-pointer relative"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-indigo-600 flex items-center justify-center shadow-lg text-white"><Shield className="w-6 h-6" />{activeAuthNotifs.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-slate-100 flex items-center justify-center">{activeAuthNotifs.length}</span>}</div><span className="text-[9px] font-bold text-slate-600 text-center">SecureCare+</span></div></div></div>
                        ) : (
                            <div className="flex-1 flex flex-col bg-slate-50">
                                <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200"><button onClick={() => setShowVault(false)} className="text-teal-600 font-bold text-[11px] flex items-center"><ArrowRight className="w-3 h-3 rotate-180 mr-1" /> Back</button><h3 className="text-xs font-bold text-slate-900">Secure Vault</h3><div className="w-10" /></div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                                        <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Activity className="w-4 h-4" /></div><div><p className="text-[10px] font-bold text-slate-900 uppercase">Health ID Verified</p><p className="text-[9px] text-slate-400">{user?.userId}</p></div></div>
                                        <div className="h-2 w-full bg-indigo-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 w-3/4" /></div>
                                    </div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Notifications</h4>
                                    {activeAuthNotifs.length === 0 ? <p className="text-center py-10 text-[10px] text-slate-400">All clear</p> : activeAuthNotifs.map((n, i) => (
                                        <div key={i} className={`p-3 rounded-2xl border-l-4 ${n.severity === 'critical' ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'}`}>
                                            <p className="text-[11px] font-bold">{n.title}</p><p className="text-[10px] text-slate-600 mt-1">{n.message}</p>
                                            <button onClick={() => handleAcknowledgeNotif(n.id)} className="w-full mt-3 py-1.5 bg-white border rounded-lg text-[9px] font-bold">Acknowledge Securely</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-400/30 rounded-full" />
                    </div>
                </div>
                <button onClick={() => setShowMobileSim(false)} className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-slate-900 border-4 border-white text-white flex items-center justify-center shadow-lg"><X className="w-5 h-5" /></button>
            </div>
        );
    };

    if (loading) return (
        <div className={`flex min-h-screen items-center justify-center ${isHealthFlowTheme ? 'health-flow-bg' : 'bg-slate-50'}`}>
            <div className="text-center"><div className="w-16 h-16 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin mx-auto" /><p className="text-slate-500 mt-4">Syncing healthcare journey...</p></div>
        </div>
    );

    return (
        <div className={`flex h-screen overflow-hidden ${isHealthFlowTheme ? 'health-flow-bg bg-[#f8f9fa] text-slate-900' : 'patient-dashboard-bg font-sans text-slate-900'} transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <Sidebar
                role="PATIENT"
                onLogout={handleLogout}
                pendingConsents={pendingConsents.length}
                user={user}
                activeItem={activeTab}
                onItemClick={(id) => navigate(`/patient/dashboard?tab=${id}`)}
                items={[
                    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                    { id: 'appointments', label: 'Appointments', icon: Calendar },
                    { id: 'records', label: 'Records', icon: FileText },
                    { id: 'report', label: 'My Report', icon: ClipboardList },
                    { id: 'consent', label: 'Consent', icon: Shield, badge: pendingConsents.length },
                    { id: 'history', label: 'Access Log', icon: Eye },
                    { id: 'privacy', label: 'Privacy', icon: Shield }
                ]}
            />

            <main className="flex-1 overflow-y-auto relative">
                <div className="max-w-[1600px] mx-auto w-full p-8">
                    {/* Header — Compact Dashboard Hero */}
                    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-[2.5rem] px-10 py-10 mb-10 shadow-2xl relative overflow-hidden flex items-center justify-between animate-fade-in border border-white/10 group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] group-hover:scale-150 transition-transform duration-[5s]"></div>
                        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px]"></div>

                        <div className="relative z-10 max-w-2xl">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-indigo-300" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200/60">{getGreeting()}</span>
                            </div>
                            <h1 className="text-4xl font-extrabold text-white tracking-tight m-0">
                                Welcome back, <span className="text-indigo-300">{user.firstName}</span>
                            </h1>
                            <p className="text-indigo-200/50 text-base font-medium mt-2 max-w-md">Your health journey is secured and monitored with diagnostic precision.</p>
                        </div>

                        <div className="relative z-10 flex flex-col items-end gap-6">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 leading-none">Identity Node</p>
                                <p className="text-sm font-black text-white leading-none font-mono tracking-tighter shadow-sm">SC-NODE-{user.userId?.slice(-6) || 'UNKNWN'}</p>
                            </div>
                            <div className="relative group/avatar">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-3xl blur opacity-30 group-hover/avatar:opacity-60 transition duration-1000"></div>
                                <div className="relative w-16 h-16 rounded-[20px] bg-slate-900 border border-white/10 flex items-center justify-center text-white font-black text-2xl shadow-2xl transform active:scale-95 transition-all">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Logic */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Stats Summary — 4 column grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard icon={FileText} label="Total Records" value={records.length} colorType="blue" delay={100} mounted={mounted} />
                                <StatCard icon={Shield} label="Active Consents" value={activeConsents.length} colorType="teal" delay={200} mounted={mounted} />
                                <StatCard icon={Bell} label="Pending Requests" value={pendingConsents.length} colorType="amber" delay={300} mounted={mounted} />
                                <StatCard icon={Activity} label="Access Events" value={accessHistory.length} colorType="violet" delay={400} mounted={mounted} />
                            </div>

                            {/* Pending Consent — Modern Action Card */}
                            {pendingConsents.length > 0 && (
                                <div className="bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-800/30 rounded-xl p-5 animate-fade-in flex items-center justify-between gap-4 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shrink-0">
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200" style={{ fontFamily: "'DM Sans', sans-serif" }}>Pending Consent Request</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{pendingConsents.length} provider{pendingConsents.length > 1 ? 's' : ''} waiting for your approval to access records.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => navigate('/patient/dashboard?tab=consent')} className="whitespace-nowrap px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                                        Review
                                    </button>
                                </div>
                            )}

                            {/* Two-Column Dashboard Layout (8/4 split) */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* LEFT COLUMN — Primary Content (8/12) */}
                                <div className="lg:col-span-8 flex flex-col gap-6">
                                    {/* Recent Records */}
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>Recent Records</h3>
                                            <button onClick={() => navigate('/patient/dashboard?tab=records')} className="text-teal-600 dark:text-teal-400 text-xs font-semibold hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 transition-colors group">
                                                View All <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                            </button>
                                        </div>
                                        <div className="p-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {records.length === 0 ? (
                                                    <div className="col-span-full border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center py-12 flex flex-col items-center justify-center">
                                                        <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
                                                        <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">No medical records found</p>
                                                    </div>
                                                ) : (
                                                    records.slice(0, 4).map(r => <MedicalCard key={r._id} record={r} />)
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Activity Timeline */}
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>Activity Timeline</h3>
                                        </div>
                                        <div className="p-5">
                                            <div className="space-y-0">
                                                {(() => {
                                                    const timelineItems = [
                                                        ...records.slice(0, 3).map(r => ({
                                                            type: 'record',
                                                            icon: FileText,
                                                            text: `${r.type?.replace(/_/g, ' ') || 'Record'} uploaded`,
                                                            detail: r.diagnosis || r.reason || 'Clinical documentation',
                                                            time: r.createdAt || r.date,
                                                            color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                        })),
                                                        ...activeConsents.slice(0, 2).map(c => ({
                                                            type: 'consent',
                                                            icon: Shield,
                                                            text: `Consent granted to Dr. ${c.doctor?.lastName || 'Provider'}`,
                                                            detail: c.purpose || 'Medical records access',
                                                            time: c.respondedAt || c.requestedAt,
                                                            color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                                        })),
                                                        ...accessHistory.slice(0, 2).map(log => ({
                                                            type: 'access',
                                                            icon: Eye,
                                                            text: `Records accessed by ${log.accessedBy?.name || log.accessedBy?.userId || 'Provider'}`,
                                                            detail: `${log.accessedBy?.role || 'Healthcare'} • Audit verified`,
                                                            time: log.accessedAt,
                                                            color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20'
                                                        }))
                                                    ].filter(item => item.time)
                                                        .sort((a, b) => new Date(b.time) - new Date(a.time))
                                                        .slice(0, 5);

                                                    if (timelineItems.length === 0) {
                                                        return (
                                                            <div className="text-center py-10">
                                                                <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                                                                <p className="text-xs text-slate-400">No recent activity</p>
                                                            </div>
                                                        );
                                                    }

                                                    return timelineItems.map((item, i) => (
                                                        <div key={i} className="flex gap-3 group">
                                                            <div className="flex flex-col items-center">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                                                                    <item.icon className="w-3.5 h-3.5" />
                                                                </div>
                                                                {i < timelineItems.length - 1 && <div className="w-px flex-1 bg-slate-100 dark:bg-slate-800 my-1" />}
                                                            </div>
                                                            <div className={`flex-1 ${i < timelineItems.length - 1 ? 'pb-4' : 'pb-0'}`}>
                                                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug">{item.text}</p>
                                                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{item.detail}</p>
                                                                <p className="text-[10px] text-slate-400/70 mt-1 font-medium">
                                                                    {new Date(item.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN — Secondary Info (4/12) */}
                                <div className="lg:col-span-4 flex flex-col gap-6">
                                    {/* Security Snapshot */}
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>Security Snapshot</h3>
                                        </div>
                                        <div className="p-5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                    <Lock className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-white text-xs">Account Protected</p>
                                                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Secured with E2EE</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                                Your medical history is encrypted with hardware-bound keys. Only authorized providers can access decrypted data.
                                            </p>
                                            <button onClick={() => setShowMobileSim(true)} className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-2">
                                                <Smartphone className="w-3.5 h-3.5" />
                                                MFA Authenticator
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>Quick Actions</h3>
                                        </div>
                                        <div className="p-4 space-y-1.5">
                                            <button onClick={() => navigate('/patient/dashboard?tab=records')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
                                                    <FileText className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">View Records</p>
                                                    <p className="text-[10px] text-slate-400">Browse medical history</p>
                                                </div>
                                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                            </button>
                                            <button onClick={() => navigate('/patient/dashboard?tab=consent')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group">
                                                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shrink-0">
                                                    <Shield className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Manage Consent</p>
                                                    <p className="text-[10px] text-slate-400">Control data access</p>
                                                </div>
                                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                            </button>
                                            <button onClick={() => navigate('/patient/dashboard?tab=privacy')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group">
                                                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-500 flex items-center justify-center shrink-0">
                                                    <Lock className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Privacy Center</p>
                                                    <p className="text-[10px] text-slate-400">GDPR data rights</p>
                                                </div>
                                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Full Width Calendar Widget */}
                            <div className="w-full">
                                <AppointmentsWidget />
                            </div>
                        </div>
                    )}

                    {activeTab === 'appointments' && (
                        <div className="animate-fade-in">
                            <PatientAppointmentsTab />
                        </div>
                    )}

                    {activeTab === 'records' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white">My Medical Records</h2>
                                    <p className="text-slate-500 font-medium">Chronological view of your clinical documentation.</p>
                                </div>
                                <div className="p-2 bg-slate-100 rounded-xl flex items-center gap-2"><ScanLine className="w-5 h-5 text-slate-400" /><span className="text-xs font-bold text-slate-500 mr-2">HIPAA COMPLIANT</span></div>
                            </div>
                            <div className="grid gap-4">{records.length === 0 ? <div className="glass-card text-center py-32 text-slate-400">No medical records found.</div> : records.map(r => <MedicalCard key={r._id} record={r} />)}</div>
                        </div>
                    )}

                    {activeTab === 'consent' && (
                        <div className="animate-fade-in space-y-12">
                            <div>
                                <h2 className="text-2xl font-black mb-8 flex items-center gap-3"><Bell className="w-7 h-7 text-amber-500" /> Pending Approval</h2>
                                {pendingConsents.length === 0 ? <div className="glass-card text-center py-16 text-slate-400">No pending access requests</div> : <div className="grid gap-6">{pendingConsents.map(c => (
                                    <div key={c._id} className="glass-card flex items-center justify-between p-6 border-l-4 border-amber-400"><div className="flex items-center gap-5"><div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">{c.doctor?.firstName?.[0]}</div><div><p className="text-xl font-black text-slate-900 dark:text-white">Dr. {c.doctor?.firstName} {c.doctor?.lastName}</p><div className="flex items-center gap-2 mt-1"><span className="text-xs font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md uppercase">{c.doctor?.specialty}</span><span className="text-xs text-slate-500">• Requested {new Date(c.requestedAt).toLocaleDateString()}</span></div>
                                        {c.purpose && <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-violet-600 bg-violet-50 w-fit px-2.5 py-1 rounded-full"><Target className="w-3.5 h-3.5" /> Purpose: {c.purpose}</div>}
                                    </div></div><div className="flex gap-4"><button onClick={() => handleGrantConsent(c._id)} className="btn-primary py-3 px-8 shadow-lg shadow-primary-500/20">Grant Access</button><button onClick={() => handleDenyConsent(c._id)} className="btn-danger-outline py-3 px-8">Deny</button></div></div>
                                ))}</div>}
                            </div>
                            <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
                                <h2 className="text-2xl font-black mb-8 flex items-center gap-3"><CheckCircle className="w-7 h-7 text-emerald-500" /> Authorized Doctors</h2>
                                {activeConsents.length === 0 ? <div className="glass-card text-center py-16 text-slate-400">No active authorizations</div> : <div className="grid gap-6">{activeConsents.map(c => (
                                    <div key={c._id} className="glass-card flex items-center justify-between p-6 border-l-4 border-emerald-400"><div className="flex items-center gap-5"><div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">{c.doctor?.firstName?.[0]}</div><div><p className="text-xl font-black text-slate-900 dark:text-white">Dr. {c.doctor?.firstName} {c.doctor?.lastName}</p><p className="text-sm text-slate-500 mt-1 font-medium">Access granted on {new Date(c.respondedAt).toLocaleDateString()}</p>
                                        {c.purpose && <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-violet-600 bg-violet-50 w-fit px-2.5 py-1 rounded-full"><Target className="w-3.5 h-3.5" /> Purpose: {c.purpose}</div>}
                                    </div></div><button onClick={() => handleRevokeConsent(c._id)} className="text-red-500 font-black hover:underline px-4 py-2 hover:bg-red-50 rounded-xl transition-colors">Revoke Access</button></div>
                                ))}</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="mb-8">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white">Data Access History</h2>
                                <p className="text-slate-500 font-medium">HIPAA required audit trail of all clinical record access.</p>
                            </div>
                            <div className="grid gap-4">{accessHistory.length === 0 ? <div className="glass-card text-center py-32 text-slate-200"><Eye className="w-20 h-20 mx-auto mb-4" /><p className="text-slate-500 font-medium">No one has accessed your records yet.</p></div> : accessHistory.map((log, i) => (
                                <div key={i} className="glass-card flex items-center justify-between p-6 hover:translate-x-1 transition-transform cursor-pointer"><div className="flex items-center gap-5"><div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400"><Eye className="w-7 h-7" /></div><div><p className="font-black text-slate-900 dark:text-white text-lg">{log.accessedBy?.name || log.accessedBy?.userId}</p><p className="text-xs font-black text-slate-400 uppercase tracking-widest">{log.accessedBy?.role} • AUDIT VERIFIED</p></div></div><div className="text-right font-mono text-sm"><p className="font-black text-slate-700 dark:text-slate-300">{new Date(log.accessedAt).toLocaleDateString()}</p><p className="text-xs text-slate-500 font-bold">{new Date(log.accessedAt).toLocaleTimeString()}</p></div></div>
                            ))}</div>
                        </div>
                    )}

                    {activeTab === 'report' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white">Personal Health Report</h2>
                                    <p className="text-slate-500 font-medium">Data-driven insights from across your clinical records.</p>
                                </div>
                                <button onClick={fetchHealthReport} disabled={reportLoading} className="btn-secondary flex items-center gap-2 py-3 px-6 shadow-sm">
                                    {reportLoading ? <div className="w-5 h-5 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" /> : <Activity className="w-5 h-5" />}
                                    Refresh Intel
                                </button>
                            </div>

                            {reportLoading ? (
                                <div className="flex items-center justify-center py-40">
                                    <div className="w-16 h-16 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin" />
                                </div>
                            ) : healthReport ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <StatCard icon={FileText} label="Total Records" value={healthReport.summary.totalRecords} gradient="from-blue-500 to-indigo-600" delay={100} />
                                        <StatCard icon={Stethoscope} label="Providers" value={healthReport.summary.totalDoctors} gradient="from-teal-500 to-emerald-600" delay={200} />
                                        <StatCard icon={Shield} label="Active Consents" value={healthReport.summary.activeConsents} gradient="from-emerald-500 to-green-600" delay={300} />
                                        <StatCard icon={Heart} label="Care Notes" value={healthReport.summary.totalCareNotes} gradient="from-rose-500 to-pink-600" delay={400} />
                                    </div>

                                    <div className="grid grid-cols-12 gap-8">
                                        <div className="col-span-12 lg:col-span-6 space-y-6">
                                            <div className="glass-card">
                                                <div className="flex items-center gap-3 mb-8"><div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg"><FileText className="w-5 h-5" /></div><h3 className="text-xl font-black text-slate-900 dark:text-white">Records by Type</h3></div>
                                                <div className="space-y-6">
                                                    {Object.entries(healthReport.recordsByType).map(([type, count]) => {
                                                        const maxCount = Math.max(...Object.values(healthReport.recordsByType), 1);
                                                        const pct = (count / maxCount) * 100;
                                                        const colors = {
                                                            LAB_RESULT: 'from-amber-400 to-orange-500',
                                                            PRESCRIPTION: 'from-blue-400 to-indigo-500',
                                                            DIAGNOSIS: 'from-red-400 to-rose-500',
                                                            IMAGING: 'from-purple-400 to-violet-500',
                                                            VITALS: 'from-green-400 to-emerald-500',
                                                            GENERAL: 'from-slate-400 to-gray-500'
                                                        };
                                                        return (
                                                            <div key={type}>
                                                                <div className="flex justify-between mb-2"><span className="text-sm font-black text-slate-700 uppercase tracking-widest">{type.replace(/_/g, ' ')}</span><span className="text-sm font-black text-slate-400">{count}</span></div>
                                                                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${colors[type] || 'from-slate-400 to-gray-500'} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} /></div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-span-12 lg:col-span-6 space-y-6">
                                            <div className="glass-card">
                                                <div className="flex items-center gap-3 mb-8"><div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center text-white shadow-lg"><Target className="w-5 h-5" /></div><h3 className="text-xl font-black text-slate-900 dark:text-white">Records by Purpose</h3></div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {Object.entries(healthReport.recordsByPurpose).map(([purpose, count]) => (
                                                        <div key={purpose} className="p-5 rounded-2xl bg-violet-50 border border-violet-100 group hover:bg-violet-100 transition-colors">
                                                            <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest mb-1">{purpose}</p>
                                                            <p className="text-3xl font-black text-violet-900">{count}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="glass-card border-l-4 border-teal-500 bg-teal-50/30">
                                        <div className="flex items-start gap-4">
                                            <Shield className="w-8 h-8 text-teal-600 flex-shrink-0" />
                                            <div>
                                                <p className="font-black text-teal-900 text-lg">Privacy & Compliance Intel</p>
                                                <p className="text-teal-700 text-sm mt-1 leading-relaxed">{healthReport.complianceNote}</p>
                                                {healthReport.summary.dateRange.oldest && (
                                                    <p className="text-teal-600 text-xs font-bold mt-3 uppercase tracking-widest">
                                                        Analyzed: {new Date(healthReport.summary.dateRange.oldest).toLocaleDateString()} — {new Date(healthReport.summary.dateRange.newest).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="glass-card text-center py-32">
                                    <ClipboardList className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                                    <h3 className="text-2xl font-black text-slate-800 mb-2">No Intel Available</h3>
                                    <p className="text-slate-500 font-medium max-w-md mx-auto">Your personal health report will populate automatically as clinicians add records and data to your secure profile.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="animate-fade-in space-y-10">
                            <div className="mb-6">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Privacy Control Center</h2>
                                <p className="text-slate-500 font-medium text-lg">Exercise your rights under GDPR Articles 15, 17, and 20.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="glass-card border-l-4 border-primary-500 group relative overflow-hidden flex flex-col min-h-[320px] p-8">
                                    <div className="absolute -bottom-6 -right-6 text-primary-900 opacity-[0.03] group-hover:scale-110 group-hover:opacity-[0.06] transition-all duration-700 pointer-events-none">
                                        <Download className="w-56 h-56" strokeWidth={1} />
                                    </div>
                                    <div className="relative z-10 flex flex-col flex-1">
                                        <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-6 shadow-sm border border-primary-100">
                                            <Download className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Data Portability</h3>
                                        <p className="text-slate-500 font-medium mb-8 leading-relaxed max-w-sm">Request a complete copy of all your medical data and personal information in a structured, machine-readable format.</p>
                                        <div className="mt-auto flex flex-col sm:flex-row gap-4">
                                            <button onClick={() => handleDownloadData('pdf')} disabled={downloading} className="btn-primary py-3.5 px-6 shadow-lg shadow-primary-500/20 flex flex-1 items-center justify-center gap-2 font-bold transition-transform active:scale-95">
                                                {downloading ? <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" /> : <FileText className="w-5 h-5" />}
                                                Export PDF
                                            </button>
                                            <button onClick={() => handleDownloadData('json')} disabled={downloading} className="btn-secondary py-3.5 px-6 flex flex-1 items-center justify-center gap-2 font-bold transition-transform active:scale-95">
                                                {downloading ? <div className="w-5 h-5 border-3 border-primary-400 border-t-transparent rounded-full animate-spin" /> : <ScanLine className="w-5 h-5" />}
                                                JSON Archive
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-card border-l-4 border-red-500 group relative overflow-hidden flex flex-col min-h-[320px] p-8">
                                    <div className="absolute -bottom-6 -right-6 text-red-900 opacity-[0.03] group-hover:scale-110 group-hover:opacity-[0.06] transition-all duration-700 pointer-events-none">
                                        <Trash2 className="w-56 h-56" strokeWidth={1} />
                                    </div>
                                    <div className="relative z-10 flex flex-col flex-1">
                                        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-6 shadow-sm border border-red-100">
                                            <Trash2 className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Right to Erasure</h3>
                                        <p className="text-slate-500 font-medium mb-8 leading-relaxed max-w-sm">Permanently delete your account and all associated health records. Process includes a 7-day security cooling period.</p>
                                        <div className="mt-auto w-full sm:w-auto">
                                            <button onClick={handleDeleteAccount} disabled={deleting} className="btn-danger w-full sm:w-auto py-3.5 px-8 shadow-lg shadow-red-500/20 font-bold transition-transform active:scale-95">
                                                {deleting ? 'Initiating...' : 'Initiate Deletion'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {deletionStatus?.hasPendingDeletion && (
                                <div className="p-8 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-2 border-red-200 dark:border-red-900 rounded-[2.5rem] animate-pulse relative overflow-hidden">
                                    <div className="absolute -right-10 -bottom-10 opacity-10"><AlertTriangle className="w-48 h-48 text-red-900" /></div>
                                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-6 text-center md:text-left">
                                            <div className="w-16 h-16 rounded-3xl bg-red-500 flex items-center justify-center text-white shadow-xl flex-shrink-0 animate-bounce"><AlertTriangle className="w-10 h-10" /></div>
                                            <div>
                                                <p className="text-2xl font-black text-red-900 dark:text-red-200 leading-tight">Account Scheduled for Purge</p>
                                                <p className="text-red-700 font-bold mt-1 uppercase tracking-widest text-xs">
                                                    {deletionStatus.daysRemaining} days remaining in cooling period (GDPR Safeload)
                                                    {deletionStep && ` • Stage: ${deletionStep}`}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={handleCancelDeletion} disabled={cancelling} className="btn-primary py-4 px-10 whitespace-nowrap shadow-xl">
                                            {cancelling ? 'Stopping...' : 'Stop Deletion Request'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="glass-card bg-slate-50 border-slate-200">
                                <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-primary-600" /> Security Log Notifications</h4>
                                <div className="space-y-3">
                                    {notifications.length === 0 ? <p className="text-sm text-slate-400 italic">No recent privacy notifications.</p> : notifications.map((n, i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"><div className={`w-2 h-2 rounded-full mt-2 ${n.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-primary-500'}`} /><div><p className="text-sm font-bold text-slate-800">{n.message}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(n.timestamp).toLocaleString()}</p></div></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <MobileAppSimulator />

            {/* MFA Verification Modal */}
            {showMfaModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 border border-white/20 transform transition-all">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 rounded-3xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mx-auto mb-6 shadow-sm"><ShieldAlert className="w-12 h-12 text-indigo-600" /></div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">Verify Identity</h3>
                            <p className="text-slate-500 font-medium text-sm mt-3">Confirm this sensitive action by entering the 6-digit code from your linked authenticator device.</p>
                        </div>
                        <div className="relative mb-8">
                            <input
                                type="text"
                                value={mfaCode}
                                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000 000"
                                className="w-full text-center text-5xl font-black tracking-[0.2em] py-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[1.5rem] focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                        {mfaError && <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 justify-center font-bold text-sm border border-red-100"><XCircle className="w-5 h-5" /> {mfaError}</div>}
                        <div className="flex gap-4">
                            <button onClick={() => setShowMfaModal(false)} className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all">Cancel</button>
                            <button onClick={handleMfaVerify} disabled={mfaVerifying || mfaCode.length < 6} className="btn-primary flex-1 py-4 text-lg shadow-xl shadow-primary-500/20">
                                {mfaVerifying ? 'Verifying...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDashboard;
