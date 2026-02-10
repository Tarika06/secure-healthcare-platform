import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Shield, Bell, CheckCircle, XCircle, LayoutDashboard, Eye, Heart, Clock, TrendingUp, Activity, User } from 'lucide-react';
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
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
                </div>
            </div>
        </div>
    );

    const tabs = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'records', label: 'My Records', icon: FileText },
        { id: 'consent', label: 'Consent Manager', icon: Shield, badge: pendingConsents.length },
        { id: 'history', label: 'Access History', icon: Eye },
        { id: 'privacy', label: 'Privacy & GDPR', icon: Shield }
    ];

    if (loading) return (
        <div className="flex min-h-screen">
            <Sidebar role="PATIENT" onLogout={handleLogout} pendingConsents={pendingConsents.length} />
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
                    <p className="text-slate-500 dark:text-slate-400 mt-4">Loading your health data...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen dashboard-glass-bg">
            <Sidebar role="PATIENT" onLogout={handleLogout} pendingConsents={pendingConsents.length} />

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-6 py-8">

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="animate-fade-in">
                            {/* Asymmetric Stats - Feature + Supports */}
                            <div className="grid grid-cols-12 gap-5 mb-6">
                                {/* Primary Stat - Wider with Hover Background */}
                                <div className={`col-span-12 lg:col-span-5 stat-card-glass group transition-all duration-700 relative overflow-hidden ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                    style={{ transitionDelay: '100ms' }}>
                                    {/* Hover Background Image - Slide + Fade (No dark mode inversion) */}
                                    <img
                                        src="https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=800"
                                        alt=""
                                        className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-700 ease-out opacity-0 translate-x-12 group-hover:opacity-90 group-hover:translate-x-0 !z-0"
                                    />
                                    {/* Overlay to ensure text contrast */}
                                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none !z-[5]" />

                                    {/* Content - Always visible and readable */}
                                    <div className="space-y-4 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-16 rounded-2xl icon-container-blue flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6">
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

                                {/* Stats Pair - Staggered */}
                                <div className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-4">
                                    <div key={`stat-consent-${activeConsents.length}`} className={`stat-card-glass group transition-all duration-700 relative overflow-hidden group-hover:bg-transparent ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                        style={{ transitionDelay: '200ms' }}>
                                        {/* Hover Background Image - Active Consents (Verified/Shield Concept) */}
                                        <>
                                            <img
                                                src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                                alt=""
                                                className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-700 ease-out opacity-[0.08] group-hover:opacity-[0.45] group-hover:scale-110 !z-0"
                                                style={{ mixBlendMode: 'normal', isolation: 'isolate' }}
                                            />
                                            <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 group-hover:bg-white/10 dark:group-hover:bg-slate-900/10 transition-colors duration-500 !z-[1]" />
                                        </>

                                        <div className="space-y-2 relative z-10">
                                            <div className="w-12 h-12 rounded-xl icon-container-green flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-rotate-3">
                                                <Shield className="w-6 h-6" />
                                            </div>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Consents</p>
                                            <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                                                {activeConsents.length}
                                            </p>
                                        </div>
                                    </div>
                                    <div key={`stat-pending-${pendingConsents.length}`} className={`stat-card-glass group transition-all duration-700 relative overflow-hidden group-hover:bg-transparent ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                        style={{ transitionDelay: '250ms' }}>
                                        {/* Hover Background Image - Pending Requests (Original Restored) */}
                                        <>
                                            <img
                                                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&v=2"
                                                alt=""
                                                className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-700 ease-out opacity-[0.10] group-hover:opacity-[0.40] group-hover:scale-110 !z-0"
                                                style={{ mixBlendMode: 'normal', isolation: 'isolate' }}
                                            />
                                            <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 group-hover:bg-white/20 dark:group-hover:bg-slate-900/20 transition-colors duration-500 !z-[1]" />
                                        </>

                                        <div className="space-y-2 relative z-10">
                                            <div className="w-12 h-12 rounded-xl icon-container-amber flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
                                                <Bell className="w-6 h-6" />
                                            </div>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Requests</p>
                                            <p className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                                                {pendingConsents.length}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Conditional Alert - Full Width when present */}
                            {pendingConsents.length > 0 && (
                                <div className="grid grid-cols-12 gap-5 mb-7">
                                    <div className={`col-span-12 lg:col-span-10 lg:col-start-2 p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-l-4 border-amber-400 rounded-2xl transition-all duration-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                                        style={{ transitionDelay: '350ms' }}>
                                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                                                <Bell className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-amber-900 dark:text-amber-200 text-lg">
                                                    {pendingConsents.length} pending consent request{pendingConsents.length > 1 ? 's' : ''}
                                                </p>
                                                <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                                                    Healthcare providers are waiting for your approval to access your records
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => navigate('/patient/dashboard?tab=consent')}
                                                className="btn-primary whitespace-nowrap hover:scale-105 transition-transform">
                                                Review Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recent Records - Offset Layout */}
                            <div className="grid grid-cols-12 gap-5">
                                <div className={`col-span-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                    style={{ transitionDelay: '400ms' }}>
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Recent Records</h3>
                                        {records.length > 0 && (
                                            <button
                                                onClick={() => navigate('/patient/dashboard?tab=records')}
                                                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-semibold text-sm flex items-center gap-1 transition-all hover:gap-2">
                                                View All <span>→</span>
                                            </button>
                                        )}
                                    </div>

                                    {records.length === 0 ? (
                                        <div className="card text-center py-20">
                                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <FileText className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Records Yet</h3>
                                            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                                Your medical records will appear here once created by your healthcare provider.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-5">
                                            {records.slice(0, 3).map((record, idx) => (
                                                <div
                                                    key={record._id}
                                                    className="transition-all duration-300"
                                                    style={{ animationDelay: `${500 + idx * 100}ms` }}>
                                                    <MedicalCard record={record} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Records Tab */}
                    {activeTab === 'records' && (
                        <div className={`animate-fade-in transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Medical Records</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">{records.length} total records</p>
                                </div>
                            </div>

                            {records.length === 0 ? (
                                <div className="card text-center py-16">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                                        <FileText className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Records Yet</h3>
                                    <p className="text-slate-500 dark:text-slate-400">Your records will appear here once created.</p>
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
                        <div className={`space-y-8 animate-fade-in transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                            {/* Pending Requests */}
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                                        <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pending Requests</h2>
                                    {pendingConsents.length > 0 && (
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">{pendingConsents.length}</span>
                                    )}
                                </div>

                                {pendingConsents.length === 0 ? (
                                    <div className="card text-center py-12">
                                        <p className="text-slate-500 dark:text-slate-400">No pending consent requests</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {pendingConsents.map((consent, idx) => (
                                            <div key={consent._id} className="card hover:shadow-xl transition-all duration-300 border-l-4 border-amber-400 relative overflow-hidden group hover:bg-transparent" style={{ animationDelay: `${idx * 100}ms` }}>
                                                {/* Hover Background Image - Pending Request (Original Restored) */}
                                                <>
                                                    <img
                                                        src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&v=2"
                                                        alt=""
                                                        className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-700 ease-out opacity-[0.10] group-hover:opacity-[0.40] group-hover:scale-110 !z-0"
                                                        style={{ mixBlendMode: 'normal', isolation: 'isolate' }}
                                                    />
                                                    <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 group-hover:bg-white/20 dark:group-hover:bg-slate-900/20 transition-colors duration-500 !z-[1]" />
                                                </>

                                                <div className="flex items-start justify-between relative z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                            {consent.doctor?.firstName?.charAt(0)}{consent.doctor?.lastName?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dr. {consent.doctor?.firstName} {consent.doctor?.lastName}</h3>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400">{consent.doctor?.specialty}</p>
                                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
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
                                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Active Consents</h2>
                                </div>

                                {activeConsents.length === 0 ? (
                                    <div className="card text-center py-12">
                                        <p className="text-slate-500 dark:text-slate-400">No active consents</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {activeConsents.map((consent, idx) => (
                                            <div key={`consent-list-${consent._id}-${idx}`} className="card hover:shadow-xl transition-all duration-300 border-l-4 border-green-400 relative overflow-hidden group hover:bg-transparent" style={{ animationDelay: `${idx * 100}ms` }}>
                                                {/* Hover Background Image - Active Consent (Verified/Shield Concept) */}
                                                <>
                                                    <img
                                                        src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                                        alt=""
                                                        className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-700 ease-out opacity-[0.08] group-hover:opacity-[0.45] group-hover:scale-110 !z-0"
                                                        style={{ mixBlendMode: 'normal', isolation: 'isolate' }}
                                                    />
                                                    <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 group-hover:bg-white/10 dark:group-hover:bg-slate-900/10 transition-colors duration-500 !z-[1]" />
                                                </>

                                                <div className="flex items-center justify-between relative z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                            {consent.doctor?.firstName?.charAt(0)}{consent.doctor?.lastName?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dr. {consent.doctor?.firstName} {consent.doctor?.lastName}</h3>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400">{consent.doctor?.specialty && `${consent.doctor.specialty} • `}Granted {new Date(consent.respondedAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleRevokeConsent(consent._id)} className="btn-danger z-20 relative">
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
                        <div className={`animate-fade-in transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Access History</h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">Track who has accessed your medical records (GDPR compliance)</p>
                            </div>

                            {accessHistory.length === 0 ? (
                                <div className="card text-center py-16">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <Eye className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Access History</h3>
                                    <p className="text-slate-500 dark:text-slate-400">When healthcare providers view your records, it will be logged here.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {accessHistory.map((log, idx) => (
                                        <div key={idx} className="card hover:shadow-xl transition-all duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-teal-100 dark:from-primary-900/40 dark:to-teal-900/40 flex items-center justify-center">
                                                        <Eye className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white">{log.accessedBy?.name || log.accessedBy?.userId}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">{log.accessedBy?.role}{log.accessedBy?.specialty && ` • ${log.accessedBy.specialty}`}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-slate-900 dark:text-white">{new Date(log.accessedAt).toLocaleDateString()}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(log.accessedAt).toLocaleTimeString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Privacy & GDPR Tab */}
                    {activeTab === 'privacy' && (
                        <div className={`space-y-8 animate-fade-in transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Data Privacy & Rights</h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your data portability and check compliance (GDPR & HIPAA)</p>
                            </div>

                            {/* Data Portability */}
                            <div className="card">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Data Portability (Right to Access)</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">
                                            Download a copy of all your personal data and medical records stored in our system.
                                            You can choose between a machine-readable JSON format or a readable PDF report.
                                        </p>
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={() => handleDownloadData('json')}
                                                disabled={downloading}
                                                className="btn-secondary flex items-center gap-2"
                                            >
                                                {downloading ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <FileText className="w-4 h-4" />}
                                                Export as JSON
                                            </button>
                                            <button
                                                onClick={() => handleDownloadData('pdf')}
                                                disabled={downloading}
                                                className="btn-primary flex items-center gap-2"
                                            >
                                                {downloading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FileText className="w-4 h-4" />}
                                                Export as PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right to Erasure */}
                            <div className="card border-l-4 border-red-500 bg-red-50/30">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                                        <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Right to Erasure (Delete Account)</h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">
                                            Permanently delete your account and anonymize your medical records.
                                            <span className="font-bold text-red-600 dark:text-red-400 block mt-1">Warning: This action is irreversible.</span>
                                        </p>
                                        <button
                                            onClick={handleDeleteAccount}
                                            disabled={deleting}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20"
                                        >
                                            {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
                                            Delete My Account
                                        </button>
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
