import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, Users, FileText, BarChart3, Search, AlertTriangle,
    TrendingUp, Activity, Database, Clock, CheckCircle, XCircle,
    Cpu, AlertCircle, Trash2, Smartphone, MailCheck, Lock, Calendar,
    PieChart, Target, Sparkles
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import AlertService from '../../api/AlertService';
import gdprApi from '../../api/gdprApi';
import AdminAppointmentsTab from '../../components/admin/AdminAppointmentsTab';

// Helper Components
const StatCard = ({ icon: Icon, label, value, colorType, delay, mounted }) => {
    const themes = {
        purple: {
            base: 'border-purple-100/50 dark:border-purple-900/20',
            iconBg: 'bg-purple-600/10 text-purple-600',
            accent: 'bg-purple-600'
        },
        blue: {
            base: 'border-blue-100/50 dark:border-blue-900/20',
            iconBg: 'bg-blue-600/10 text-blue-600',
            accent: 'bg-blue-600'
        },
        emerald: {
            base: 'border-emerald-100/50 dark:border-emerald-900/20',
            iconBg: 'bg-emerald-600/10 text-emerald-600',
            accent: 'bg-emerald-600'
        },
        amber: {
            base: 'border-amber-100/50 dark:border-amber-900/20',
            iconBg: 'bg-amber-600/10 text-amber-600',
            accent: 'bg-amber-600'
        }
    }[colorType] || themes.blue;

    return (
        <div
            className={`card-premium group ${themes.base} ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl ${themes.iconBg} flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">
                    {value ?? '0'}
                </h3>
                <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    {label}
                    <span className={`w-1 h-1 rounded-full ${themes.accent}`}></span>
                </p>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 dark:bg-slate-800/10 rounded-bl-[4rem] -mr-12 -mt-12 group-hover:mr-0 group-hover:mt-0 transition-all duration-700"></div>
        </div>
    );
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [hotRecords, setHotRecords] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState(null);
    const [pendingDeletions, setPendingDeletions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [archivedRecords, setArchivedRecords] = useState([]);
    const [collaborations, setCollaborations] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [accessSummary, setAccessSummary] = useState(null);
    const [summaryTimeRange, setSummaryTimeRange] = useState(168);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/users');
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAuditLogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/audit-logs?limit=100');
            setAuditLogs(response.data.logs || []);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/mgmt/analysis/trends');
            setStats(response.data.stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await AlertService.getAlerts();
            setAlerts(data.alerts || []);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPendingDeletions = useCallback(async () => {
        setLoading(true);
        try {
            const r = await gdprApi.getPendingDeletions();
            setPendingDeletions(r.pendingDeletions || []);
        } catch (e) {
            console.error('Error fetching pending deletions:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchArchivedRecords = useCallback(async () => {
        setLoading(true);
        try {
            const r = await apiClient.get('/records/admin/archived');
            setArchivedRecords(r.data.records || []);
        } catch (e) {
            console.error('Error fetching archived records:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchHotRecords = useCallback(async () => {
        setLoading(true);
        try {
            const r = await apiClient.get('/records/admin/hot-storage');
            setHotRecords(r.data.records || []);
        } catch (e) {
            console.error('Error fetching hot records:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCollaborations = useCallback(async () => {
        setLoading(true);
        try {
            const r = await apiClient.get('/collaboration/admin/list');
            setCollaborations(r.data.collaborations || []);
        } catch (e) {
            console.error('Error fetching collaborations:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAccessSummary = useCallback(async () => {
        setLoading(true);
        try {
            const r = await apiClient.get(`/admin/access-summary?timeRange=${summaryTimeRange}`);
            setAccessSummary(r.data.report);
        } catch (e) {
            console.error('Error fetching access summary:', e);
        } finally {
            setLoading(false);
        }
    }, [summaryTimeRange]);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        else if (activeTab === 'audit') fetchAuditLogs();
        else if (activeTab === 'alerts') fetchAlerts();
        else if (activeTab === 'overview') fetchStats();
        else if (activeTab === 'summary') fetchAccessSummary();
        else if (activeTab === 'hot-storage') fetchHotRecords();
        else if (activeTab === 'deletions') fetchPendingDeletions();
        else if (activeTab === 'archive') fetchArchivedRecords();
        else if (activeTab === 'collaboration') fetchCollaborations();
    }, [activeTab, fetchUsers, fetchAuditLogs, fetchAlerts, fetchStats, fetchAccessSummary, fetchHotRecords, fetchPendingDeletions, fetchArchivedRecords, fetchCollaborations]);

    const handleRestoreRecord = async (archiveId) => {
        if (!window.confirm("Restore this record to the active database?")) return;
        setLoading(true);
        try {
            await apiClient.post(`/records/admin/restore/${archiveId}`);
            alert("Record restored successfully!");
            fetchArchivedRecords();
        } catch (e) {
            console.error('Restoration failed:', e);
            alert('Failed to restore record.');
        } finally {
            setLoading(false);
        }
    };

    const handleAIAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const result = await AlertService.analyzeLogs();
            alert(result.message);
            fetchAlerts();
        } catch (error) {
            console.error('AI Analysis failed:', error);
            alert('AI Analysis failed. Please try again later.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleUpdateAlertStatus = async (id, status) => {
        try { await AlertService.updateAlertStatus(id, status); fetchAlerts(); }
        catch (e) { console.error('Status update failed:', e); }
    };

    const handleBlockIP = async (ip, alertId) => {
        if (!window.confirm(`Are you sure you want to block IP: ${ip}?`)) return;
        try {
            const r = await AlertService.blockIP(ip, alertId);
            alert(r.message);
            fetchAlerts();
        } catch (e) {
            console.error('IP Block failed:', e);
            const errorMsg = e.response?.data?.message || 'Failed to block IP.';
            alert(errorMsg);
        }
    };

    const extractIP = (text) => {
        const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
        const match = text.match(ipRegex);
        return match ? match[0] : null;
    };

    const handleExportCSV = useCallback(() => {
        if (!auditLogs.length) return;
        const headers = ['Timestamp', 'User ID', 'Action', 'Resource', 'Outcome', 'IP Address'];
        const csvContent = [
            headers.join(','),
            ...auditLogs.map(log => [
                new Date(log.timestamp).toISOString(),
                log.userId,
                log.action,
                log.resource,
                log.outcome,
                log.ipAddress || 'internal'
            ].join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }, [auditLogs]);

    const handleLogout = () => { logout(); navigate('/login'); };

    const filteredUsers = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'summary', label: 'Access Summary', icon: PieChart },
        { id: 'appointments', label: 'Global Schedule', icon: Calendar },
        { id: 'hot-storage', label: 'Hot Storage', icon: Activity },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'collaboration', label: 'Consultations', icon: MailCheck },
        { id: 'alerts', label: 'Security Alerts', icon: Shield },
        { id: 'audit', label: 'Audit Logs', icon: FileText },
        { id: 'deletions', label: 'Pending Deletions', icon: Trash2 },
        { id: 'archive', label: 'Cold Storage', icon: Database }
    ];

    const getRoleBadgeColor = (role) => {
        const colors = {
            ADMIN: 'bg-purple-100 text-purple-700 ring-1 ring-purple-200',
            DOCTOR: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
            NURSE: 'bg-green-100 text-green-700 ring-1 ring-green-200',
            LAB_TECHNICIAN: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
            PATIENT: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
        };
        return colors[role] || 'bg-slate-100 text-slate-700';
    };

    const getSeverityConfig = (severity) => {
        const map = {
            CRITICAL: { border: 'border-red-500', bg: 'bg-red-50 text-red-600', badge: 'bg-red-100 text-red-700' },
            HIGH: { border: 'border-orange-500', bg: 'bg-orange-50 text-orange-600', badge: 'bg-orange-100 text-orange-700' },
            MEDIUM: { border: 'border-amber-400', bg: 'bg-amber-50 text-amber-600', badge: 'bg-amber-100 text-amber-700' },
            LOW: { border: 'border-blue-400', bg: 'bg-blue-50 text-blue-600', badge: 'bg-blue-100 text-blue-700' }
        };
        return map[severity] || map.LOW;
    };

    const ROLE_COLORS = {
        ADMIN: 'from-purple-500 to-violet-600',
        DOCTOR: 'from-blue-500 to-indigo-600',
        NURSE: 'from-green-500 to-emerald-600',
        LAB_TECH: 'from-amber-500 to-orange-600',
        PATIENT: 'from-teal-500 to-cyan-600',
        SYSTEM: 'from-slate-500 to-gray-600'
    };

    const ROLE_BG = {
        ADMIN: 'bg-purple-100 text-purple-700',
        DOCTOR: 'bg-blue-100 text-blue-700',
        NURSE: 'bg-green-100 text-green-700',
        LAB_TECH: 'bg-amber-100 text-amber-700',
        PATIENT: 'bg-teal-100 text-teal-700',
        SYSTEM: 'bg-slate-100 text-slate-700'
    };



    return (
        <div className="flex h-screen overflow-hidden dashboard-glass-bg">
            <Sidebar
                items={sidebarItems}
                activeItem={activeTab}
                onItemClick={(id) => setActiveTab(id)}
                user={user}
                onLogout={handleLogout}
            />

            <main className="flex-1 overflow-y-auto relative">
                <div className="max-w-[1600px] mx-auto w-full p-8">

                    {/* Header — Compact Dashboard Hero */}
                    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] px-10 py-10 mb-10 shadow-2xl relative overflow-hidden flex items-center justify-between animate-fade-in border border-white/10 group">
                        <div className="absolute top-0 left-0 w-full h-full shimmer-effect opacity-10 pointer-events-none"></div>
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] group-hover:scale-110 transition-transform duration-[10s]"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-4 h-4 text-indigo-400" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300/60">Administrator Station</span>
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-white m-0">
                                Welcome, <span className="text-indigo-400">{user?.firstName || 'Admin'}</span>
                            </h1>
                            <p className="text-indigo-200/50 text-base font-medium mt-2 max-w-lg">System status: Optimal security perimeter active.</p>
                        </div>

                        <div className="flex items-center gap-8 relative z-10">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 leading-none">Security Clearance</p>
                                <p className="text-sm font-black text-white leading-none font-mono tracking-tighter shadow-sm">LVL-4-AUTH-{user?.userId?.slice(-4) || 'SYS'}</p>
                            </div>
                            <div className="relative group/avatar">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-25 group-hover/avatar:opacity-60 transition duration-1000"></div>
                                <div className="relative w-16 h-16 rounded-[20px] bg-slate-900 border border-white/10 flex items-center justify-center text-white font-black text-2xl shadow-2xl transform group-hover/avatar:scale-105 transition-all">
                                    {user?.firstName?.[0] || 'A'}{user?.lastName?.[0] || 'D'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="animate-fade-in space-y-6">
                            {/* Stats — 4 column grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard icon={Users} label="Total Patients" value={stats?.totalPatients} colorType="purple" delay={100} mounted={mounted} />
                                <StatCard icon={Activity} label="Total Doctors" value={stats?.totalDoctors} colorType="blue" delay={200} mounted={mounted} />
                                <StatCard icon={FileText} label="Medical Records" value={stats?.totalRecords} colorType="emerald" delay={300} mounted={mounted} />
                                <StatCard icon={TrendingUp} label="Records (7 days)" value={stats?.recentRecordsLast7Days} colorType="amber" delay={400} mounted={mounted} />
                            </div>

                            {/* Two-column layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* LEFT — Records by Type (8/12) */}
                                <div className="lg:col-span-8">
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100 to-teal-100 flex items-center justify-center">
                                                <Database className="w-4 h-4 text-primary-600" />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>Records by Type</h3>
                                        </div>
                                        <div className="p-5">
                                            {stats?.recordsByType ? (
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {stats.recordsByType.map((item, idx) => (
                                                        <div key={idx} className="group p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all">
                                                            <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.count}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] mt-1">{item._id || 'Unknown'}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p className="text-slate-400 text-sm">No data available</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT — Admin Access Level (4/12) */}
                                <div className="lg:col-span-4">
                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>Admin Access Level</h3>
                                        </div>
                                        <div className="p-5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                                                    <Shield className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-white text-xs">Restricted Access</p>
                                                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Privacy Protected</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                                Medical record content is encrypted and not directly viewable by administrators to ensure patient privacy.
                                            </p>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Encryption</span>
                                                    </div>
                                                    <span className="text-[10px] text-emerald-600 font-bold">AES-256</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">HIPAA</span>
                                                    </div>
                                                    <span className="text-[10px] text-blue-600 font-bold uppercase">Compliant</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                                                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Audit Trail</span>
                                                    </div>
                                                    <span className="text-[10px] text-violet-600 font-bold uppercase">Active</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'summary' && (
                        <div className="tab-content space-y-6 animate-fade-in">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/25">
                                        <PieChart className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-heading font-bold text-slate-900">Data Access Summary</h2>
                                        <p className="text-xs text-slate-500 mt-0.5">HIPAA §164.312(b) — Audit Controls | GDPR Article 30</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {[{ h: 24, label: '24h' }, { h: 72, label: '3 days' }, { h: 168, label: '7 days' }, { h: 720, label: '30 days' }].map(r => (
                                        <button key={r.h} onClick={() => setSummaryTimeRange(r.h)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${summaryTimeRange === r.h
                                                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md'
                                                : 'bg-white/80 text-slate-600 hover:bg-violet-50 border border-slate-200'
                                                }`}>{r.label}</button>
                                    ))}
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-32">
                                    <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                                </div>
                            ) : accessSummary ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <StatCard icon={Activity} label="Total Access Events" value={accessSummary.totals.totalEvents} gradient="from-violet-500 to-purple-600" delay={0} />
                                        <StatCard icon={XCircle} label="Denied Events" value={accessSummary.totals.totalDenied} gradient="from-red-500 to-rose-600" delay={80} />
                                        <StatCard icon={AlertTriangle} label="Denied Rate" value={`${accessSummary.totals.deniedPercentage}%`} gradient="from-amber-500 to-orange-600" delay={160} />
                                    </div>

                                    {accessSummary.thresholdAlerts.length > 0 && (
                                        <div className="glass-card border-l-4 border-red-500 bg-gradient-to-r from-red-50/60 to-orange-50/40">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md">
                                                    <AlertTriangle className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-heading font-bold text-red-900">Threshold Alerts ({accessSummary.thresholdAlerts.length})</h3>
                                                    <p className="text-xs text-red-700">Unusual access patterns detected</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {accessSummary.thresholdAlerts.map((alert, idx) => (
                                                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl ${alert.severity === 'HIGH' ? 'bg-red-100/60' : 'bg-amber-100/60'}`}>
                                                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alert.severity === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                                        <div>
                                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${alert.severity === 'HIGH' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>{alert.severity}</span>
                                                            <p className="text-sm font-medium text-slate-800 mt-1">{alert.message}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="glass-card">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md">
                                                <Users className="w-5 h-5 text-white" />
                                            </div>
                                            <h3 className="text-lg font-heading font-bold text-slate-900">Access by Role</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {accessSummary.accessByRole.map((role, idx) => {
                                                const maxCount = Math.max(...accessSummary.accessByRole.map(r => r.totalAccess), 1);
                                                const pct = (role.totalAccess / maxCount) * 100;
                                                return (
                                                    <div key={idx} className="group">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ROLE_BG[role._id] || 'bg-slate-100 text-slate-700'}`}>{role._id}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs">
                                                                <span className="font-bold text-slate-700">{role.totalAccess}</span>
                                                                <span className="text-green-600">✓ {role.successCount}</span>
                                                                {role.deniedCount > 0 && <span className="text-red-500">✗ {role.deniedCount}</span>}
                                                                {role.failureCount > 0 && <span className="text-amber-500">! {role.failureCount}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full bg-gradient-to-r ${ROLE_COLORS[role._id] || 'from-slate-400 to-slate-500'} transition-all duration-700 group-hover:shadow-md`}
                                                                style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="glass-card">
                                            <div className="flex items-center gap-3 mb-5">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md">
                                                    <Target className="w-5 h-5 text-white" />
                                                </div>
                                                <h3 className="text-lg font-heading font-bold text-slate-900">Access by Action</h3>
                                            </div>
                                            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-2">
                                                {accessSummary.accessByAction.map((action, idx) => (
                                                    <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                                                        <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{action._id}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">{action.count}</span>
                                                            {action.deniedCount > 0 && (
                                                                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">✗ {action.deniedCount}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="glass-card">
                                            <div className="flex items-center gap-3 mb-5">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                                                    <TrendingUp className="w-5 h-5 text-white" />
                                                </div>
                                                <h3 className="text-lg font-heading font-bold text-slate-900">Most Active Users</h3>
                                            </div>
                                            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-2">
                                                {accessSummary.topActiveUsers.map((u, idx) => (
                                                    <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center text-white ${idx < 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-slate-300'}`}>
                                                                {idx + 1}
                                                            </span>
                                                            <span className="font-mono text-sm text-teal-600 font-medium">{u._id}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-slate-700">{u.accessCount}</span>
                                                            {u.deniedCount > 0 && (
                                                                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">✗ {u.deniedCount}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {accessSummary.deniedAccess.length > 0 && (
                                        <div className="glass-card">
                                            <div className="flex items-center gap-3 mb-5">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-md">
                                                    <XCircle className="w-5 h-5 text-white" />
                                                </div>
                                                <h3 className="text-lg font-heading font-bold text-slate-900">Denied Access Events</h3>
                                            </div>
                                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                                <table className="w-full">
                                                    <thead style={{ background: 'rgba(248,250,252,0.95)' }}>
                                                        <tr>
                                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">User</th>
                                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Action</th>
                                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Count</th>
                                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Last Occurrence</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {accessSummary.deniedAccess.map((d, idx) => (
                                                            <tr key={idx} className="hover:bg-red-50/40 transition-colors">
                                                                <td className="py-3 px-4 font-mono text-sm text-teal-600">{d._id.userId}</td>
                                                                <td className="py-3 px-4 text-sm font-medium text-slate-700">{d._id.action}</td>
                                                                <td className="py-3 px-4">
                                                                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">{d.count}</span>
                                                                </td>
                                                                <td className="py-3 px-4 text-sm text-slate-500">{new Date(d.lastOccurrence).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="glass-card text-center py-16">
                                    <PieChart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500">No data available for the selected time range.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'appointments' && (
                        <div className="animate-fade-in">
                            <AdminAppointmentsTab />
                        </div>
                    )}

                    {activeTab === 'hot-storage' && (
                        <div className="animate-fade-in"><div className="glass-card"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md"><Activity className="w-5 h-5 text-white" /></div><h2 className="text-xl font-bold text-slate-900">Hot Storage (Active Records)</h2></div>
                            {loading ? <div className="flex items-center justify-center py-24"><div className="w-10 h-10 border-3 border-orange-200 border-t-orange-600 rounded-full animate-spin" /></div> : hotRecords.length === 0 ? <p className="text-center py-16 text-slate-500">No active records found</p> :
                                <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr><th className="px-4 py-3 font-bold text-slate-500">Patient ID</th><th className="px-4 py-3 font-bold text-slate-500">Title</th><th className="px-4 py-3 font-bold text-slate-500">Created At</th><th className="px-4 py-3 font-bold text-slate-500 text-right">Status</th></tr></thead><tbody className="divide-y">{hotRecords.map(rec => (
                                    <tr key={rec._id} className="hover:bg-slate-50/60"><td className="px-4 py-3 font-mono text-orange-600">{rec.patientId}</td><td className="px-4 py-3 font-medium text-slate-800">{rec.title}</td><td className="px-4 py-3 text-slate-500">{new Date(rec.createdAt).toLocaleDateString()}</td><td className="px-4 py-3 text-right"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">ACTIVE</span></td></tr>
                                ))}</tbody></table></div>}
                        </div></div>
                    )}

                    {activeTab === 'users' && (
                        <div className="animate-fade-in"><div className="glass-card"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-teal-100 flex items-center justify-center"><Users className="w-5 h-5 text-primary-600" /></div><h2 className="text-xl font-bold text-slate-900">User Management</h2></div><div className="relative w-full md:w-72"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field pl-11" /></div></div>
                            {loading ? <div className="flex items-center justify-center py-24"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div> :
                                <div className="overflow-x-auto rounded-xl border"><table className="w-full"><thead className="sticky top-0 bg-slate-50 z-10"><tr className="bg-slate-50"><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">User ID</th><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Name</th><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Email</th><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Role</th><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Status</th></tr></thead><tbody className="divide-y">{filteredUsers.map(u => (
                                    <tr key={u.userId} className="table-row-hover"><td className="py-4 px-4 font-mono text-sm text-primary-600">{u.userId}</td><td className="py-4 px-4"><div className="flex items-center gap-2"><div className={`h-2.5 w-2.5 rounded-full ${u.isOnline ? 'bg-green-500 shadow-sm' : 'bg-slate-300'}`} /><span className="font-medium">{u.firstName} {u.lastName}</span></div></td><td className="py-4 px-4 text-slate-500">{u.email}</td><td className="py-4 px-4"><span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleBadgeColor(u.role)}`}>{u.role}</span></td><td className="py-4 px-4"><span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{u.status}</span></td></tr>
                                ))}</tbody></table></div>}
                        </div></div>
                    )}

                    {activeTab === 'alerts' && (
                        <div className="animate-fade-in"><div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div><h2 className="text-xl font-bold text-slate-900">Security Alerts</h2></div><button onClick={handleAIAnalyze} disabled={isAnalyzing} className="btn-primary flex items-center gap-2 px-4 py-2"><Cpu className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />{isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}</button></div>
                            {alerts.length === 0 ? <div className="text-center py-12"><Shield className="h-12 w-12 text-slate-200 mx-auto mb-4" /><p className="text-slate-500 font-medium">No security alerts found</p></div> :
                                <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">{alerts.map(alert => (
                                    <div key={alert._id} className={`p-5 rounded-xl border-l-4 bg-white shadow-sm hover:shadow-md transition-all ${getSeverityConfig(alert.severity).border}`}>
                                        <div className="flex justify-between items-start"><div className="flex gap-4"><div className="p-2.5 rounded-lg h-12 w-12 flex items-center justify-center bg-slate-50"><AlertCircle className="h-6 w-6 text-slate-600" /></div><div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1"><h4 className="font-bold text-slate-900 text-lg">{alert.type.replace(/_/g, ' ')}</h4><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${getSeverityConfig(alert.severity).badge}`}>{alert.severity}</span></div>
                                            <p className="text-slate-600 text-sm mb-3">{alert.description}</p>
                                            <div className="flex items-center gap-4 text-xs text-slate-400 mb-3"><span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(alert.timestamp).toLocaleString()}</span></div>
                                            {alert.recommendation && <div className="p-3 bg-slate-50 rounded-lg flex gap-3"><Cpu className="w-4 h-4 text-primary-600" /><p className="text-slate-600 text-sm italic">{alert.recommendation}</p></div>}
                                        </div></div><div className="flex gap-2">
                                                {alert.status === 'OPEN' && (<><button onClick={() => extractIP(alert.description) && handleBlockIP(extractIP(alert.description), alert._id)} className="btn-secondary py-1 px-3 text-[10px]">BLOCK</button><button onClick={() => handleUpdateAlertStatus(alert._id, 'RESOLVED')} className="text-green-600"><CheckCircle className="h-5 w-5" /></button><button onClick={() => handleUpdateAlertStatus(alert._id, 'DISMISSED')} className="text-slate-400"><XCircle className="h-5 w-5" /></button></>)}
                                                {alert.status !== 'OPEN' && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-100 rounded">{alert.status}</span>}
                                            </div></div>
                                    </div>
                                ))}</div>}
                        </div>
                    )}

                    {activeTab === 'audit' && (
                        <div className="animate-fade-in"><div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div><h2 className="text-xl font-bold text-slate-900">Audit Logs</h2></div><button onClick={handleExportCSV} className="btn-outline flex items-center gap-2 py-2 px-4"><FileText className="w-4 h-4" />Export CSV</button></div>
                            {loading ? <div className="glass-card flex items-center justify-center py-32"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div> :
                                <div className="overflow-x-auto rounded-xl border"><table className="w-full"><thead className="sticky top-0 bg-slate-50 z-10"><tr><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Timestamp</th><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">User</th><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Action</th><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">IP Address</th><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Outcome</th></tr></thead><tbody className="divide-y">{auditLogs.map((log, idx) => (
                                    <tr key={idx} className="table-row-hover"><td className="py-4 px-4 text-sm text-slate-500"><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" />{new Date(log.timestamp).toLocaleString()}</div></td><td className="py-4 px-4 font-mono text-sm text-primary-600">{log.userId}</td><td className="py-4 px-4 font-medium">{log.action}</td><td className="py-4 px-4 font-mono text-sm">{log.ipAddress || 'internal'}</td><td className="py-4 px-4"><span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${log.outcome === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{log.outcome === 'SUCCESS' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{log.outcome}</span></td></tr>
                                ))}</tbody></table></div>}
                        </div>
                    )}

                    {activeTab === 'deletions' && (
                        <div className="animate-fade-in space-y-8"><div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md"><Trash2 className="w-5 h-5 text-white" /></div><h2 className="text-xl font-bold text-slate-900">Pending Deletions</h2></div><span className="px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> 7-Day Window</span></div>
                            <div className="glass-card overflow-hidden">{loading ? <div className="flex flex-col items-center justify-center py-32"><div className="w-10 h-10 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" /></div> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b"><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User / Email</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Deletion Date</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">MFA Status</th></tr></thead><tbody className="divide-y">{pendingDeletions.length > 0 ? pendingDeletions.map((req, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/60 transition-colors"><td className="px-6 py-4"><div className="font-bold text-slate-800">{req.userEmail}</div><div className="text-[10px] text-slate-500 font-mono">{req.userId}</div></td><td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${req.status === 'MFA_VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{req.status.replace('_', ' ')}</span></td><td className="px-6 py-4"><div className="text-sm font-bold text-red-600">{new Date(req.scheduledDeletionDate).toLocaleDateString()}</div><div className="text-[10px] text-slate-400">In {req.daysRemaining} days</div></td><td className="px-6 py-4">{req.mfaVerified ? <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold"><CheckCircle className="w-3.5 h-3.5" /> SECURE</div> : <div className="flex items-center gap-1 text-amber-600 text-xs font-bold"><Smartphone className="w-3.5 h-3.5" /> PENDING</div>}</td></tr>
                            )) : <tr><td colSpan="4" className="px-6 py-12 text-center"><p className="text-slate-500 font-medium">No pending deletion requests</p></td></tr>}</tbody></table></div>}</div>
                        </div>
                    )}

                    {activeTab === 'collaboration' && (
                        <div className="animate-fade-in"><div className="glass-card"><div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md"><MailCheck className="w-5 h-5 text-white" /></div><h2 className="text-xl font-bold text-slate-900">Peer Consultations</h2></div><div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-700"><Shield className="w-3.5 h-3.5" /> Protected</div></div>
                            {loading ? <div className="flex flex-col items-center justify-center py-32"><div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : collaborations.length === 0 ? <p className="text-center py-16 text-slate-500">No active consultations found</p> :
                                <div className="overflow-x-auto rounded-xl border transition-all"><table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr><th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Consulting Doctors</th><th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Patient ID</th><th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status</th><th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Requested On</th></tr></thead><tbody className="divide-y">{collaborations.map(collab => (
                                    <tr key={collab._id} className="hover:bg-slate-50/60 transition-colors"><td className="px-4 py-4"><div className="flex flex-col gap-0.5"><span className="text-xs font-bold text-slate-700">From: {collab.requestingDoctorId}</span><span className="text-xs font-bold text-indigo-600">To: {collab.consultingDoctorId}</span></div></td><td className="px-4 py-4 font-mono text-xs text-slate-500">{collab.patientId}</td><td className="px-4 py-4"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${collab.status === 'ACCEPTED' ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'}`}>{collab.status}</span></td><td className="px-4 py-4 text-xs text-slate-400">{new Date(collab.createdAt).toLocaleDateString()}</td></tr>
                                ))}</tbody></table></div>}
                        </div></div>
                    )}

                    {activeTab === 'archive' && (
                        <div className="animate-fade-in"><div className="glass-card"><div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md"><Database className="w-5 h-5 text-white" /></div><h2 className="text-xl font-bold text-slate-900">Cold Storage Archival</h2></div></div>
                            {loading ? <div className="flex flex-col items-center justify-center py-32"><div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div> : archivedRecords.length === 0 ? <p className="text-center py-16 text-slate-500">No records in cold storage</p> :
                                <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr><th className="px-4 py-3 font-bold text-slate-500">Patient ID</th><th className="px-4 py-3 font-bold text-slate-500">Title</th><th className="px-4 py-3 font-bold text-slate-500">Archived Date</th><th className="px-4 py-3 font-bold text-slate-500 text-right">Action</th></tr></thead><tbody className="divide-y">{archivedRecords.map(rec => (
                                    <tr key={rec._id} className="hover:bg-slate-50/60"><td className="px-4 py-3 font-mono text-indigo-600">{rec.patientId}</td><td className="px-4 py-3 font-medium text-slate-800">{rec.title}</td><td className="px-4 py-3 text-slate-500">{new Date(rec.archivedAt).toLocaleDateString()}</td><td className="px-4 py-3 text-right"><button onClick={() => handleRestoreRecord(rec._id)} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">RESTORE</button></td></tr>
                                ))}</tbody></table></div>}
                        </div></div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
