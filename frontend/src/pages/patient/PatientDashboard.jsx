import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Shield, Bell, CheckCircle, XCircle, LayoutDashboard, Eye, Heart, Clock, TrendingUp, Activity, User, Plus } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import MedicalCard from '../../components/MedicalCard';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import consentApi from '../../api/consentApi';
import gdprApi from '../../api/gdprApi';

const StatCounter = ({ end, duration = 2000 }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const totalSteps = duration / 16;
        const increment = end / totalSteps;
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [end, duration]);
    return <span>{count}</span>;
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

    const tabs = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'records', label: 'My Records', icon: FileText },
        { id: 'consent', label: 'Consent Manager', icon: Shield, badge: pendingConsents.length },
        { id: 'history', label: 'Access History', icon: Eye },
        { id: 'privacy', label: 'Privacy & GDPR', icon: Shield }
    ];

    const isHealthFlowTheme = user?.userId === 'P001';

    if (loading) return (
        <div className={`flex min-h-screen ${isHealthFlowTheme ? 'health-flow-bg flex-col items-center justify-center' : 'bg-slate-50'}`}>
            {!isHealthFlowTheme && <Sidebar role="PATIENT" onLogout={handleLogout} pendingConsents={pendingConsents.length} />}
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className={`w-16 h-16 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin mx-auto`} />
                    <p className={`text-slate-500 mt-4`}>Syncing health flow...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`flex min-h-screen ${isHealthFlowTheme ? 'health-flow-bg health-flow-theme' : 'dashboard-glass-bg'}`}>
            {isHealthFlowTheme && <div className="medical-waveform" />}

            <Sidebar role="PATIENT" onLogout={handleLogout} pendingConsents={pendingConsents.length} />

            <div className={`flex-1 overflow-y-auto relative ${isHealthFlowTheme ? 'hf-noise' : ''}`}>
                <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">

                    {/* Standard Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className={`text-3xl font-black tracking-tight ${isHealthFlowTheme ? 'text-slate-900' : 'text-slate-900 dark:text-white'}`}>
                                Patient Dashboard
                            </h1>
                            <p className={`${isHealthFlowTheme ? 'hf-body' : 'text-slate-500 dark:text-slate-400 font-medium'}`}>
                                Manage your healthcare journey with SecureCare.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-3 p-2 pr-4 rounded-2xl border ${isHealthFlowTheme ? 'bg-white/40 border-white/60' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Authenticated</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-none">{user.userId}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="animate-fade-in">
                            {isHealthFlowTheme ? (
                                <div className="grid grid-cols-12 gap-8 mb-12">
                                    {/* Lab Card */}
                                    <div className="col-span-12 lg:col-span-7">
                                        <h3 className="hf-label mb-4">LATEST LAB ANALYSIS</h3>
                                        <div className="health-flow-card hf-accent-blue overflow-hidden group !bg-white/70">
                                            <div className="stat-bubble-float bg-blue-500/10 text-blue-600">
                                                <TrendingUp className="w-6 h-6" />
                                            </div>
                                            <div className="flex items-start gap-8">
                                                <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-110">
                                                    <Activity className="w-10 h-10" />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-lg uppercase tracking-tight mb-4 inline-block">Featured Insight</span>
                                                    <h4 className="text-4xl font-black text-slate-900 tracking-tight mb-1">Test result</h4>
                                                    <p className="text-xl font-medium text-slate-500 mb-8">All good</p>

                                                    <div className="flex items-center gap-10">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Status</span>
                                                            <span className="text-lg font-black text-emerald-600">Normal</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Reliability</span>
                                                            <span className="text-lg font-black text-slate-900">99.2%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Profile Card */}
                                    <div className="col-span-12 lg:col-span-5">
                                        <div className="health-flow-card bg-[#0D8A72] !text-white border-0 shadow-2xl h-full flex flex-col justify-between">
                                            <div className="flex items-center gap-6 mb-10">
                                                <div className="w-20 h-20 rounded-[2.5rem] bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl font-black">
                                                    {user.firstName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="text-3xl font-black tracking-tight leading-none">{user.firstName} {user.lastName}</h3>
                                                    <p className="text-emerald-100/70 text-base font-bold mt-1">{user.email}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-5 bg-white/10 rounded-3xl border border-white/10">
                                                    <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-2">Blood Type</p>
                                                    <p className="text-2xl font-black tracking-tight leading-tight">O-<br />Positive</p>
                                                </div>
                                                <div className="p-5 bg-white/10 rounded-3xl border border-white/10">
                                                    <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-2">Height</p>
                                                    <p className="text-2xl font-black tracking-tight leading-tight">182 cm</p>
                                                </div>
                                                <div className="p-5 bg-white/10 rounded-3xl border border-white/10 col-span-2 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Current Weight</p>
                                                        <p className="text-xl font-black">74.5 kg</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Status</p>
                                                        <p className="text-sm font-bold opacity-80">Synced</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-12 gap-5 mb-8">
                                    <div className={`col-span-12 lg:col-span-5 stat-card-glass group transition-all duration-700 relative overflow-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                        style={{ transitionDelay: '100ms' }}>
                                        <div className="space-y-4 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-16 rounded-2xl icon-container-blue flex items-center justify-center">
                                                    <FileText className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Records</p>
                                                    <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                                                        {records.length}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">Your medical history</p>
                                        </div>
                                    </div>
                                    <div className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-4">
                                        <div className={`stat-card-glass relative overflow-hidden transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
                                            <div className="w-12 h-12 rounded-xl icon-container-green flex items-center justify-center mb-4">
                                                <Shield className="w-6 h-6" />
                                            </div>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Consents</p>
                                            <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">{activeConsents.length}</p>
                                        </div>
                                        <div className={`stat-card-glass relative overflow-hidden transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '250ms' }}>
                                            <div className="w-12 h-12 rounded-xl icon-container-amber flex items-center justify-center mb-4">
                                                <Bell className="w-6 h-6" />
                                            </div>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Requests</p>
                                            <p className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">{pendingConsents.length}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {pendingConsents.length > 0 && (
                                <div className="mb-8">
                                    <div className={`p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-l-4 border-amber-400 rounded-2xl flex flex-col md:flex-row items-center gap-4 transition-all duration-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{ transitionDelay: '350ms' }}>
                                        <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                                            <Bell className="w-7 h-7 text-amber-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-amber-900 dark:text-amber-200 text-lg">{pendingConsents.length} pending consent request{pendingConsents.length > 1 ? 's' : ''}</p>
                                            <p className="text-amber-700 dark:text-amber-300 text-sm">Healthcare providers are waiting for your approval.</p>
                                        </div>
                                        <button onClick={() => navigate('/patient/dashboard?tab=consent')} className="btn-primary">Review Now</button>
                                    </div>
                                </div>
                            )}

                            <div className="mt-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className={`${isHealthFlowTheme ? 'hf-label' : 'text-2xl font-bold text-slate-900 dark:text-white'}`}>
                                        {isHealthFlowTheme ? 'RECENT OBSERVATIONS' : 'Recent Records'}
                                    </h3>
                                    <button onClick={() => navigate('/patient/dashboard?tab=records')} className={`${isHealthFlowTheme ? 'text-[10px] font-black text-primary-600 uppercase tracking-widest' : 'text-primary-600 font-semibold text-sm'}`}>
                                        {isHealthFlowTheme ? 'EXPLORE ALL RECORDS' : 'View All →'}
                                    </button>
                                </div>
                                {records.length === 0 ? (
                                    <div className="card text-center py-20 bg-white/50 backdrop-blur-sm border-dashed">
                                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-bold">No Records Yet</h3>
                                        <p className="text-slate-500">Your history will appear here once recorded.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        {records.slice(0, 3).map((record, idx) => (
                                            <div key={record._id} className="transition-all duration-300" style={{ animationDelay: `${500 + idx * 100}ms` }}>
                                                <MedicalCard record={record} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Records Tab */}
                    {activeTab === 'records' && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-bold mb-6">My Medical Records</h2>
                            {records.length === 0 ? (
                                <div className="card py-20 text-center">No records found.</div>
                            ) : (
                                <div className="grid gap-4">
                                    {records.map(r => <MedicalCard key={r._id} record={r} />)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Consent Tab */}
                    {activeTab === 'consent' && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h2 className="text-2xl font-bold mb-6">Pending Requests</h2>
                                {pendingConsents.length === 0 ? (
                                    <div className="card py-12 text-center text-slate-500 text-sm">No pending requests</div>
                                ) : (
                                    <div className="grid gap-4">
                                        {pendingConsents.map(c => (
                                            <div key={c._id} className="card flex items-center justify-between p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                                                        {c.doctor?.firstName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">Dr. {c.doctor?.firstName} {c.doctor?.lastName}</p>
                                                        <p className="text-sm text-slate-500">{c.doctor?.specialty}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleGrantConsent(c._id)} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold">Grant</button>
                                                    <button onClick={() => handleDenyConsent(c._id)} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold">Deny</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-6">Active Consents</h2>
                                {activeConsents.length === 0 ? (
                                    <div className="card py-12 text-center text-slate-500 text-sm">No active consents</div>
                                ) : (
                                    <div className="grid gap-4">
                                        {activeConsents.map(c => (
                                            <div key={c._id} className="card flex items-center justify-between p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xl">
                                                        {c.doctor?.firstName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">Dr. {c.doctor?.firstName} {c.doctor?.lastName}</p>
                                                        <p className="text-sm text-slate-500">Granted {new Date(c.respondedAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRevokeConsent(c._id)} className="text-red-600 text-sm font-bold hover:underline">Revoke Access</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-bold mb-6">Access History</h2>
                            {accessHistory.length === 0 ? (
                                <div className="card py-20 text-center">No access history found.</div>
                            ) : (
                                <div className="grid gap-4">
                                    {accessHistory.map((log, i) => (
                                        <div key={i} className="card p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                    <Eye className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold">{log.accessedBy?.userId}</p>
                                                    <p className="text-sm text-slate-500">{log.accessedBy?.role}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold">{new Date(log.accessedAt).toLocaleDateString()}</p>
                                                <p className="text-xs text-slate-500">{new Date(log.accessedAt).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Privacy Tab */}
                    {activeTab === 'privacy' && (
                        <div className="space-y-8 animate-fade-in">
                            <h2 className="text-2xl font-bold mb-6">Privacy & Rights</h2>
                            <div className="card p-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold mb-2">Data Portability</h3>
                                        <p className="text-slate-500 text-sm mb-6">Download your complete medical history and personal data in PDF or JSON format.</p>
                                        <div className="flex gap-4">
                                            <button onClick={() => handleDownloadData('pdf')} className="btn-primary">Download PDF</button>
                                            <button onClick={() => handleDownloadData('json')} className="btn-secondary">Export JSON</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="card p-8 border-red-200 bg-red-50/20">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold mb-2">Right to Erasure</h3>
                                        <p className="text-slate-500 text-sm mb-4">Request permanent deletion of your account and data.</p>
                                        <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">Delete Account</button>
                                    </div>
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
