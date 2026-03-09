import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    FileText, Shield, Bell, CheckCircle, XCircle, LayoutDashboard,
    Eye, Heart, Clock, Activity, User, Download, Trash2,
    ArrowRight, Sun, Moon, Sparkles, KeyRound, AlertTriangle,
    ShieldAlert, Smartphone, Lock, Unlock, X, TrendingUp, Calendar, ScanLine, XCircle as XCircleIcon
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import MedicalCard from '../../components/MedicalCard';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import consentApi from '../../api/consentApi';
import gdprApi from '../../api/gdprApi';
import PatientAppointmentsTab from '../../components/patient/PatientAppointmentsTab';

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
    const [deleting, setDeleting] = useState(false);

    // Deletion workflow state
    const [deletionStatus, setDeletionStatus] = useState(null);
    const [showMfaModal, setShowMfaModal] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [mfaError, setMfaError] = useState('');
    const [mfaVerifying, setMfaVerifying] = useState(false);
    const [deletionStep, setDeletionStep] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [authNotifications, setAuthNotifications] = useState([]);
    const [cancelling, setCancelling] = useState(false);
    const [showMobileSim, setShowMobileSim] = useState(false);

    const isDark = document.documentElement.classList.contains('dark');

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

    useEffect(() => {
        Promise.all([fetchRecords(), fetchConsents()]).finally(() => setLoading(false));
    }, [fetchRecords, fetchConsents]);

    useEffect(() => {
        if (activeTab === 'history') fetchAccessHistory();
        if (activeTab === 'privacy') {
            fetchDeletionStatus();
            fetchNotifications();
        }
    }, [activeTab, fetchAccessHistory, fetchDeletionStatus, fetchNotifications]);

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

    const isHealthFlowTheme = user?.userId === 'P001';

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
        { id: 'records', label: 'Records', icon: FileText },
        { id: 'consent', label: 'Consent', icon: Shield, badge: pendingConsents.length },
        { id: 'history', label: 'Access Log', icon: Eye },
        { id: 'privacy', label: 'Privacy', icon: Shield }
    ];

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
        <div className={`flex min-h-screen ${isHealthFlowTheme ? 'health-flow-bg flex-col items-center justify-center' : 'bg-slate-50'}`}>
            <div className="text-center"><div className="w-16 h-16 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin mx-auto" /><p className="text-slate-500 mt-4">Syncing healthcare journey...</p></div>
        </div>
    );

    return (
        <div className={`flex min-h-screen ${isHealthFlowTheme ? 'health-flow-bg' : 'bg-slate-50 dark:bg-slate-950'} transition-colors duration-500`}>
            <Sidebar role="PATIENT" onLogout={handleLogout} pendingConsents={pendingConsents.length} user={user} />

            <div className="flex-1 overflow-y-auto relative">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Patient Portal</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Hello, {user.firstName}. Welcome back.</p>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold">{user.firstName?.[0]}{user.lastName?.[0]}</div>
                            <div className="hidden sm:block"><p className="text-xs font-black text-slate-400 uppercase leading-none mb-1">Authenticated</p><p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">{user.userId}</p></div>
                        </div>
                    </div>

                    {/* Stats Summary (Overview Tab Only) */}
                    {activeTab === 'overview' && (
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <div className="glass-card flex items-center gap-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10"><div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20"><FileText className="w-6 h-6" /></div><div><p className="text-xs font-bold text-slate-500 uppercase">Records</p><p className="text-2xl font-black text-slate-900 dark:text-white">{records.length}</p></div></div>
                            <div className="glass-card flex items-center gap-4 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10"><div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"><Shield className="w-6 h-6" /></div><div><p className="text-xs font-bold text-slate-500 uppercase">Consents</p><p className="text-2xl font-black text-slate-900 dark:text-white">{activeConsents.length}</p></div></div>
                            <div className="glass-card flex items-center gap-4 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10"><div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20"><Clock className="w-6 h-6" /></div><div><p className="text-xs font-bold text-slate-500 uppercase">Pending</p><p className="text-2xl font-black text-slate-900 dark:text-white">{pendingConsents.length}</p></div></div>
                        </div>
                    )}

                    {/* Content Logic */}
                    {activeTab === 'overview' && (
                        <div className="animate-fade-in space-y-8">
                            {pendingConsents.length > 0 && (
                                <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl flex items-center justify-between">
                                    <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-800 flex items-center justify-center"><Bell className="w-7 h-7 text-amber-600" /></div><div><p className="font-bold text-amber-900 dark:text-amber-200">Pending Consent Requests</p><p className="text-sm text-amber-700">Healthcare providers are requesting access to your records.</p></div></div>
                                    <button onClick={() => navigate('/patient/dashboard?tab=consent')} className="btn-primary py-2.5 px-6">Review</button>
                                </div>
                            )}
                            <div>
                                <div className="flex items-center justify-between mb-6"><h3 className="text-2xl font-black text-slate-900 dark:text-white">Recent Activity</h3><button onClick={() => navigate('/patient/dashboard?tab=records')} className="text-blue-600 font-bold hover:underline">View All</button></div>
                                <div className="grid gap-4">{records.length === 0 ? <div className="glass-card text-center py-16"><FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">No medical records on file.</p></div> : records.slice(0, 3).map(r => <MedicalCard key={r._id} record={r} />)}</div>
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
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">My Medical Records</h2>
                            <div className="grid gap-4">{records.map(r => <MedicalCard key={r._id} record={r} />)}</div>
                        </div>
                    )}

                    {activeTab === 'consent' && (
                        <div className="animate-fade-in space-y-10">
                            <div>
                                <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><Bell className="w-6 h-6 text-amber-500" /> Pending Approval</h2>
                                {pendingConsents.length === 0 ? <div className="glass-card text-center py-12 text-slate-500">No pending access requests</div> : <div className="grid gap-4">{pendingConsents.map(c => (
                                    <div key={c._id} className="glass-card flex items-center justify-between p-6"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center text-white font-bold text-2xl">{c.doctor?.firstName?.[0]}</div><div><p className="text-lg font-black text-slate-900 dark:text-white">Dr. {c.doctor?.firstName} {c.doctor?.lastName}</p><p className="text-sm text-slate-500 font-bold uppercase">{c.doctor?.specialty}</p></div></div><div className="flex gap-2"><button onClick={() => handleGrantConsent(c._id)} className="btn-primary py-2.5 px-6">Approve</button><button onClick={() => handleDenyConsent(c._id)} className="btn-danger py-2.5 px-6">Deny</button></div></div>
                                ))}</div>}
                            </div>
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <h2 className="text-2xl font-black mb-6 flex items-center gap-3"><CheckCircle className="w-6 h-6 text-emerald-500" /> Authorized Doctors</h2>
                                {activeConsents.length === 0 ? <div className="glass-card text-center py-12 text-slate-500">No active authorizations</div> : <div className="grid gap-4">{activeConsents.map(c => (
                                    <div key={c._id} className="glass-card flex items-center justify-between p-6"><div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-bold text-2xl">{c.doctor?.firstName?.[0]}</div><div><p className="text-lg font-black text-slate-900 dark:text-white">Dr. {c.doctor?.firstName} {c.doctor?.lastName}</p><p className="text-sm text-slate-500">Authorized since {new Date(c.respondedAt).toLocaleDateString()}</p></div></div><button onClick={() => handleRevokeConsent(c._id)} className="text-red-500 font-bold hover:underline">Revoke Access</button></div>
                                ))}</div>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="animate-fade-in space-y-6">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Data Access History</h2>
                            <div className="grid gap-4">{accessHistory.length === 0 ? <div className="glass-card text-center py-20 text-slate-400">No one has accessed your data recently.</div> : accessHistory.map((log, i) => (
                                <div key={i} className="glass-card flex items-center justify-between p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"><Eye className="w-6 h-6" /></div><div><p className="font-black text-slate-900 dark:text-white">{log.accessedBy?.userId} ({log.accessedBy?.role})</p><p className="text-sm text-slate-500">Audit logged via HIPAA compliance engine</p></div></div><div className="text-right font-mono text-sm"><p className="font-bold text-slate-700 dark:text-slate-300">{new Date(log.accessedAt).toLocaleDateString()}</p><p className="text-xs text-slate-500">{new Date(log.accessedAt).toLocaleTimeString()}</p></div></div>
                            ))}</div>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="animate-fade-in space-y-8">
                            <div className="mb-4">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Privacy Control Center</h2>
                                <p className="text-slate-500 font-medium">Manage your right to access and erasure (GDPR/HIPAA Compliance)</p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="glass-card border-l-4 border-blue-500"><div className="flex items-start gap-4"><div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 animate-pulse"><Download className="w-8 h-8" /></div><div><h3 className="text-lg font-black text-slate-900 dark:text-white">Data Portability</h3><p className="text-sm text-slate-500 mt-1 mb-6">Request a complete copy of all your medical data and personal information in PDF or JSON format.</p><div className="flex gap-4"><button onClick={() => handleDownloadData('pdf')} className="btn-primary py-2.5 px-6">Export PDF</button><button onClick={() => handleDownloadData('json')} className="btn-secondary py-2.5 px-6">JSON Archive</button></div></div></div></div>
                                <div className="glass-card border-l-4 border-red-500"><div className="flex items-start gap-4"><div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0"><Trash2 className="w-8 h-8" /></div><div><h3 className="text-lg font-black text-slate-900 dark:text-white">Right to Erasure</h3><p className="text-sm text-slate-500 mt-1 mb-6">Permanently delete your account and associated records. This process follows a 7-day security cooling period.</p><button onClick={handleDeleteAccount} className="btn-danger py-2.5 px-6">Initiate Deletion</button></div></div></div>
                            </div>
                            {deletionStatus?.hasPendingDeletion && (
                                <div className="p-6 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900 rounded-3xl animate-pulse"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><AlertTriangle className="w-8 h-8 text-red-600" /><div><p className="font-black text-red-900 dark:text-red-200">Account Scheduled for Deletion</p><p className="text-sm text-red-700">{deletionStatus.daysRemaining} days remaining in cooling period.</p></div></div><button onClick={handleCancelDeletion} className="btn-primary py-2 px-6">Cancel Deletion</button></div></div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <MobileAppSimulator />

            {/* MFA Verification Modal */}
            {showMfaModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
                    <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 border border-white/20">
                        <div className="text-center mb-8"><div className="w-16 h-16 rounded-3xl bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mx-auto mb-4"><ShieldAlert className="w-10 h-10 text-indigo-600" /></div><h3 className="text-2xl font-black text-slate-900 dark:text-white">Identity Verification</h3><p className="text-slate-500 text-sm mt-2">Enter the code from your Authenticator app to confirm this sensitive action.</p></div>
                        <input type="text" value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000 000" className="w-full text-center text-4xl font-black tracking-[0.2em] py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[1.5rem] mb-8 focus:border-blue-500 outline-none transition-all" />
                        {mfaError && <p className="text-red-500 text-center text-sm font-bold mb-6 flex items-center justify-center gap-2"><XCircleIcon className="w-4 h-4" /> {mfaError}</p>}
                        <div className="flex gap-4"><button onClick={() => setShowMfaModal(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-100 rounded-3xl transition-all">Cancel</button><button onClick={handleMfaVerify} disabled={mfaVerifying || mfaCode.length < 6} className="btn-primary flex-1 py-4">{mfaVerifying ? 'Verifying...' : 'Verify & Continue'}</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDashboard;
