import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, FileText, BarChart3, Search, AlertTriangle, TrendingUp, Activity, Database, Clock, CheckCircle, XCircle, Cpu, AlertCircle, Ban, Download, Trash2, Smartphone, MailCheck } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import AlertService from '../../api/AlertService';
import gdprApi from '../../api/gdprApi';
import { Lock } from 'lucide-react';

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

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        else if (activeTab === 'audit') fetchAuditLogs();
        else if (activeTab === 'alerts') fetchAlerts();
        else if (activeTab === 'overview') fetchStats();
        else if (activeTab === 'hot-storage') fetchHotRecords();
        else if (activeTab === 'deletions') fetchPendingDeletions();
        else if (activeTab === 'archive') fetchArchivedRecords();
        else if (activeTab === 'collaboration') fetchCollaborations();
    }, [activeTab]);

    const fetchPendingDeletions = async () => {
        setLoading(true);
        try {
            const r = await gdprApi.getPendingDeletions();
            setPendingDeletions(r.pendingDeletions || []);
        } catch (e) {
            console.error('Error fetching pending deletions:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try { const r = await apiClient.get('/admin/users'); setUsers(r.data.users || []); }
        catch (e) { console.error('Error fetching users:', e); }
        finally { setLoading(false); }
    };

    const fetchAuditLogs = async () => {
        setLoading(true);
        try { const r = await apiClient.get('/admin/audit-logs?limit=100'); setAuditLogs(r.data.logs || []); }
        catch (e) { console.error('Error fetching audit logs:', e); }
        finally { setLoading(false); }
    };

    const fetchArchivedRecords = async () => {
        setLoading(true);
        try {
            const r = await apiClient.get('/records/admin/archived');
            setArchivedRecords(r.data.records || []);
        } catch (e) {
            console.error('Error fetching archived records:', e);
        } finally {
            setLoading(false);
        }
    };

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

    const fetchStats = async () => {
        setLoading(true);
        try { const r = await apiClient.get('/mgmt/analysis/trends'); setStats(r.data.stats); }
        catch (e) { console.error('Error fetching stats:', e); }
        finally { setLoading(false); }
    };

    const fetchAlerts = async () => {
        setLoading(true);
        try { const d = await AlertService.getAlerts(); setAlerts(d.alerts || []); }
        catch (e) { console.error('Error fetching alerts:', e); }
        finally { setLoading(false); }
    };

    const fetchHotRecords = async () => {
        setLoading(true);
        try {
            const r = await apiClient.get('/records/admin/hot-storage');
            setHotRecords(r.data.records || []);
        } catch (e) {
            console.error('Error fetching hot records:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchCollaborations = async () => {
        setLoading(true);
        try {
            const r = await apiClient.get('/collaboration/admin/list');
            setCollaborations(r.data.collaborations || []);
        } catch (e) {
            console.error('Error fetching collaborations:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAIAnalyze = async () => {
        setIsAnalyzing(true);
        try { const r = await AlertService.analyzeLogs(); alert(r.message); fetchAlerts(); }
        catch (e) { console.error('AI Analysis failed:', e); alert('AI Analysis failed. Please try again later.'); }
        finally { setIsAnalyzing(false); }
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
            if (activeTab === 'alerts') fetchAlerts();
        } catch (e) {
            console.error('IP Block failed:', e);
            const errorMsg = e.response?.data?.message || 'Failed to block IP.';
            alert(errorMsg);
        }
    };

    const extractIP = (text) => {
        const match = text.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
        return match ? match[0] : null;
    };

    const handleExportCSV = () => {
        if (!auditLogs.length) return;
        const headers = ['Timestamp', 'User ID', 'Action', 'Resource', 'Outcome', 'IP Address'];
        const csvContent = [
            headers.join(','),
            ...auditLogs.map(log => [
                new Date(log.timestamp).toISOString(), log.userId, log.action, log.resource, log.outcome, log.ipAddress || 'internal'
            ].join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click(); window.URL.revokeObjectURL(url);
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const filteredUsers = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'hot-storage', label: 'Hot Storage', icon: Activity },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'collaboration', label: 'Consultations', icon: MailCheck },
        { id: 'alerts', label: 'Security Alerts', icon: Shield },
        { id: 'audit', label: 'Audit Logs', icon: FileText },
        { id: 'deletions', label: 'Pending Deletions', icon: Trash2 },
        { id: 'archive', label: 'Cold Storage', icon: Database }
    ];

    const getRoleBadge = (role) => {
        const map = {
            ADMIN: 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 ring-1 ring-purple-200',
            DOCTOR: 'bg-gradient-to-r from-blue-100 to-sky-100 text-blue-700 ring-1 ring-blue-200',
            NURSE: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 ring-1 ring-green-200',
            LAB_TECHNICIAN: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 ring-1 ring-amber-200',
            PATIENT: 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 ring-1 ring-slate-200'
        };
        return map[role] || map.PATIENT;
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

    const StatCard = ({ icon: Icon, label, value, gradient, delay }) => (
        <div className={`glass-card group stagger-item hover:-translate-y-1 hover:shadow-glass-hover`}
            style={{ animationDelay: `${delay}ms` }}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className={`text-3xl font-heading font-bold mt-2 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                        {value ?? '—'}
                    </p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white transition-colors duration-500">
            <Sidebar
                role="ADMIN"
                items={sidebarItems}
                activeItem={activeTab}
                onItemClick={setActiveTab}
                user={user}
                onLogout={handleLogout}
            />

            <div className="flex-1 overflow-y-auto relative z-10">
                {/* Sticky Header */}
                <div className="sticky top-0 z-20 px-6 py-3 bg-slate-900/85 backdrop-blur-md border-b border-white/10">
                    <div className="flex items-center gap-3 max-w-[1600px] mx-auto">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-heading font-bold text-white">Admin Control Center</h1>
                            <p className="text-xs text-slate-400">{user?.firstName} {user?.lastName}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30">
                            <Shield className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-xs font-semibold text-indigo-300">Administrator</span>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-8 max-w-[1600px] mx-auto">

                    {/* ═══ Overview Tab ═══ */}
                    {activeTab === 'overview' && (
                        <div className="tab-content space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                <StatCard icon={Users} label="Total Patients" value={stats?.totalPatients} gradient="from-teal-500 to-emerald-500" delay={0} />
                                <StatCard icon={Activity} label="Total Doctors" value={stats?.totalDoctors} gradient="from-blue-500 to-indigo-500" delay={80} />
                                <StatCard icon={FileText} label="Medical Records" value={stats?.totalRecords} gradient="from-green-500 to-emerald-600" delay={160} />
                                <StatCard icon={TrendingUp} label="Records (7 days)" value={stats?.recentRecordsLast7Days} gradient="from-amber-500 to-orange-500" delay={240} />
                            </div>

                            {/* Records by Type */}
                            <div className="glass-card stagger-item" style={{ animationDelay: '320ms' }}>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-md">
                                        <Database className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-heading font-bold text-slate-900">Records by Type</h3>
                                </div>
                                {stats?.recordsByType ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {stats.recordsByType.map((item, idx) => (
                                            <div key={idx} className="glass-card-l3 p-4 hover:-translate-y-0.5 hover:shadow-md transition-all">
                                                <p className="text-2xl font-heading font-bold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">{item.count}</p>
                                                <p className="text-sm text-slate-500 mt-1">{item._id || 'Unknown'}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-sm">No data available</p>
                                )}
                            </div>

                            {/* Admin Notice */}
                            <div className="glass-card border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/60 to-blue-50/40">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                        <Shield className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-indigo-900 text-sm">Admin Access Level</p>
                                        <p className="text-indigo-700 text-xs mt-1">
                                            You can view system statistics and audit logs. Medical record content is encrypted and not directly viewable by administrators.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ Hot Storage Tab ═══ */}
                    {activeTab === 'hot-storage' && (
                        <div className="tab-content">
                            <div className="glass-card">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md">
                                            <Activity className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Hot Storage (Active Records)</h2>
                                            <p className="text-sm text-slate-500">Metadata of records currently in the primary production database</p>
                                        </div>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-10 h-10 border-3 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
                                    </div>
                                ) : hotRecords.length === 0 ? (
                                    <div className="text-center py-16">
                                        <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-500">No active records found</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50/95 dark:bg-slate-900/95 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Patient ID</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Title</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Created At</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {hotRecords.map((rec) => (
                                                    <tr key={rec._id} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="px-4 py-3 font-mono text-orange-600">{rec.patientId}</td>
                                                        <td className="px-4 py-3 font-medium text-slate-800">{rec.title}</td>
                                                        <td className="px-4 py-3 text-slate-500">{new Date(rec.createdAt).toLocaleDateString()}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">ACTIVE</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="tab-content">
                            <div className="glass-card">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-md">
                                            <Users className="w-5 h-5 text-white" />
                                        </div>
                                        <h2 className="text-xl font-heading font-bold text-slate-900">User Management</h2>
                                    </div>
                                    <div className="relative w-full md:w-72">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all" />
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-10 h-10 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto rounded-xl border border-slate-200">
                                        <table className="w-full">
                                            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm dark:bg-slate-900/95">
                                                <tr>
                                                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User ID</th>
                                                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                                                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                                                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                                                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredUsers.map((u) => (
                                                    <tr key={u.userId} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="py-3.5 px-4 font-mono text-sm text-teal-600">{u.userId}</td>
                                                        <td className="py-3.5 px-4">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${u.isOnline ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-slate-300'}`} />
                                                                <span className="font-medium text-slate-800 text-sm">{u.firstName} {u.lastName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-slate-500 text-sm">{u.email}</td>
                                                        <td className="py-3.5 px-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getRoleBadge(u.role)}`}>{u.role}</span>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.status === 'ACTIVE'
                                                                ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
                                                                : 'bg-red-100 text-red-700 ring-1 ring-red-200'
                                                                }`}>
                                                                {u.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                                {u.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══ Alerts Tab ═══ */}
                    {activeTab === 'alerts' && (
                        <div className="tab-content">
                            <div className="glass-card">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-md">
                                            <AlertTriangle className="w-5 h-5 text-white" />
                                        </div>
                                        <h2 className="text-xl font-heading font-bold text-slate-900">Security Alerts</h2>
                                    </div>
                                    <button onClick={handleAIAnalyze} disabled={isAnalyzing}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${isAnalyzing
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/25'
                                            }`}>
                                        <Cpu className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                        {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
                                    </button>
                                </div>

                                {alerts.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                                            <Shield className="h-8 w-8 text-emerald-400 animate-float" />
                                        </div>
                                        <p className="text-slate-600 font-semibold">No security alerts found</p>
                                        <p className="text-sm text-slate-400">System is secure. Run AI analysis to check for hidden threats.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                        {alerts.map(a => {
                                            const sc = getSeverityConfig(a.severity);
                                            return (
                                                <div key={a._id} className={`glass-card border-l-4 ${sc.border} hover:shadow-glass-hover transition-all`}>
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex gap-4">
                                                            <div className={`p-2.5 rounded-xl h-11 w-11 flex items-center justify-center flex-shrink-0 ${sc.bg}`}>
                                                                <AlertCircle className="h-5 w-5" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-1">
                                                                    <h4 className="font-bold text-slate-900">{a.type.replace(/_/g, ' ')}</h4>
                                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${sc.badge}`}>{a.severity}</span>
                                                                </div>
                                                                <p className="text-slate-600 text-sm leading-relaxed mb-3">{a.description}</p>
                                                                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                                                                    <Clock className="w-3 h-3" />{new Date(a.timestamp).toLocaleString()}
                                                                </div>
                                                                {a.recommendation && (
                                                                    <div className="p-3 glass-card-l3 flex gap-3">
                                                                        <Cpu className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                                                        <div>
                                                                            <strong className="text-slate-700 text-xs font-semibold">AI Recommendation</strong>
                                                                            <p className="text-slate-600 text-sm italic mt-0.5">{a.recommendation}</p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 flex-shrink-0">
                                                            {a.status === 'OPEN' ? (
                                                                <>
                                                                    {extractIP(a.description) && (
                                                                        <button onClick={() => handleBlockIP(extractIP(a.description), a._id)}
                                                                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg hover:bg-black transition-colors">
                                                                            <Ban className="h-3 w-3" />BLOCK
                                                                        </button>
                                                                    )}
                                                                    <button onClick={() => handleUpdateAlertStatus(a._id, 'RESOLVED')} className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Resolve">
                                                                        <CheckCircle className="h-5 w-5" />
                                                                    </button>
                                                                    <button onClick={() => handleUpdateAlertStatus(a._id, 'DISMISSED')} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors" title="Dismiss">
                                                                        <XCircle className="h-5 w-5" />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-100 rounded">{a.status}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══ Audit Tab ═══ */}
                    {activeTab === 'audit' && (
                        <div className="tab-content">
                            <div className="glass-card min-h-[500px]">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                                            <Clock className="w-5 h-5 text-white" />
                                        </div>
                                        <h2 className="text-xl font-heading font-bold text-slate-900">Audit Logs</h2>
                                    </div>
                                    <button onClick={handleExportCSV}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                                        <Download className="w-4 h-4" /> Export CSV
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center h-[400px]">
                                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto rounded-xl border border-slate-200">
                                        <table className="w-full">
                                            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm dark:bg-slate-900/95">
                                                <tr>
                                                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                                                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                                                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                                                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">IP Address</th>
                                                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Outcome</th>
                                                    <th className="text-right py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {auditLogs.map((log, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="py-3.5 px-4 text-sm text-slate-500">
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                                {new Date(log.timestamp).toLocaleString()}
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4 font-mono text-sm text-teal-600">
                                                            <div>{log.userId}</div>
                                                            {log.targetUserId && <div className="text-[10px] text-slate-400">Target: {log.targetUserId}</div>}
                                                        </td>
                                                        <td className="py-3.5 px-4 font-medium text-slate-800 text-sm">
                                                            {log.action}
                                                            <div className="text-[10px] text-slate-400 font-normal truncate max-w-[150px]">{log.resource}</div>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-sm text-slate-600 font-mono">
                                                            {log.ipAddress || 'internal'}
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${log.outcome === 'SUCCESS'
                                                                ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
                                                                : (log.outcome === 'DENIED' || log.outcome === 'FAILURE')
                                                                    ? 'bg-red-100 text-red-700 ring-1 ring-red-200'
                                                                    : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
                                                                }`}>
                                                                {log.outcome === 'SUCCESS' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                                {log.outcome}
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right">
                                                            {log.ipAddress && log.ipAddress !== '::1' && log.ipAddress !== '127.0.0.1' && (
                                                                <button
                                                                    onClick={() => handleBlockIP(log.ipAddress)}
                                                                    className="text-[10px] font-bold text-red-600 hover:text-red-700 px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-all uppercase tracking-tighter"
                                                                >
                                                                    Block IP
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ─── Pending Deletions Tab ─── */}
                    {activeTab === 'deletions' && (
                        <div className="tab-content space-y-8">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md">
                                        <Trash2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Pending Deletions</h2>
                                        <p className="text-sm text-slate-500">Monitoring GDPR Right to Erasure / Delayed Deletion status</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold flex items-center gap-1">
                                        <AlertTriangle className="w-3.5 h-3.5" /> 7-Day Delayed Window Active
                                    </span>
                                </div>
                            </div>

                            <div className="glass-card overflow-hidden">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-10 h-10 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User / Email</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Requested</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Deletion Date</th>
                                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">MFA Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {pendingDeletions.length > 0 ? pendingDeletions.map((req, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-800 dark:text-white">{req.userEmail}</div>
                                                            <div className="text-[10px] text-slate-500 font-mono">{req.userId}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${req.status === 'MFA_VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                                                                req.status === 'PENDING_MFA' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {req.status.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-500">
                                                            {new Date(req.requestedAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-bold text-red-600">
                                                                {new Date(req.scheduledDeletionDate).toLocaleDateString()}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400">In {req.daysRemaining} days</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {req.mfaVerified ? (
                                                                <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                                                                    <CheckCircle className="w-3.5 h-3.5" /> SECURE
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1 text-amber-600 text-xs font-bold">
                                                                    <Smartphone className="w-3.5 h-3.5" /> PENDING
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-6 py-12 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <Shield className="w-12 h-12 text-slate-200 mb-2" />
                                                                <p className="text-slate-500 font-medium">No pending deletion requests</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="glass-card p-5 border-l-4 border-emerald-500">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><Shield className="w-4 h-4" /></div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase">GDPR Compliance</h4>
                                    </div>
                                    <p className="text-xl font-bold dark:text-white">Right to Erasure</p>
                                    <p className="text-xs text-slate-500 mt-2">All records are anonymized upon completion, preserving audit trails for HIPAA.</p>
                                </div>
                                <div className="glass-card p-5 border-l-4 border-purple-500">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600"><Lock className="w-4 h-4" /></div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase">Authentication</h4>
                                    </div>
                                    <p className="text-xl font-bold dark:text-white">MFA-Mandatory</p>
                                    <p className="text-xs text-slate-500 mt-2">Every deletion request requires a second-layer confirmation via Google Authenticator.</p>
                                </div>
                                <div className="glass-card p-5 border-l-4 border-amber-500">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-amber-50 text-amber-600"><Clock className="w-4 h-4" /></div>
                                        <h4 className="text-xs font-bold text-slate-500 uppercase">Retention Window</h4>
                                    </div>
                                    <p className="text-xl font-bold dark:text-white">7-Day Cooling Period</p>
                                    <p className="text-xs text-slate-500 mt-2">Users can cancel their request within 7 days by logging into their account.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ Collaboration Monitoring Tab ═══ */}
                    {activeTab === 'collaboration' && (
                        <div className="tab-content">
                            <div className="glass-card">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                            <MailCheck className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-heading font-bold text-slate-900">Peer Consultations</h2>
                                            <p className="text-sm text-slate-500">Monitoring all doctor-to-doctor clinical data sharing activities</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                                        <Shield className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-[10px] font-bold text-emerald-700">Messages E2EE Protected</span>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                                    </div>
                                ) : collaborations.length === 0 ? (
                                    <div className="text-center py-16">
                                        <MailCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-500">No active consultations found in the system</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50/95 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Consulting Doctors</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Patient ID</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Scope</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Requested On</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {collaborations.map((collab) => (
                                                    <tr key={collab._id} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="px-4 py-4">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-xs font-bold text-slate-700">From: {collab.requestingDoctorId}</span>
                                                                <span className="text-xs font-bold text-indigo-600">To: {collab.consultingDoctorId}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 font-mono text-xs text-slate-500">{collab.patientId}</td>
                                                        <td className="px-4 py-4">
                                                            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-[10px] font-medium text-slate-600 uppercase tracking-tighter">
                                                                {collab.accessScope}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${collab.status === 'ACCEPTED' ? 'bg-green-100 text-green-700 ring-1 ring-green-200' :
                                                                collab.status === 'PENDING' ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' :
                                                                    'bg-slate-100 text-slate-400 ring-1 ring-slate-200'
                                                                }`}>
                                                                {collab.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-xs text-slate-400">
                                                            {new Date(collab.createdAt).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div className="mt-6 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-3">
                                    <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-blue-800 leading-relaxed italic">
                                        <strong>Privacy Enforcement:</strong> Administrators have visibility into collaboration metadata (who is consulting on whom) to maintain a complete audit trail. However, clinical message content is end-to-end encrypted and remains restricted to the involved medical professionals only.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ Archive Tab ═══ */}
                    {activeTab === 'archive' && (
                        <div className="tab-content">
                            <div className="glass-card">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
                                            <Database className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Cold Storage Archival</h2>
                                            <p className="text-sm text-slate-500">Records inactive for 2+ years moved for HIPAA compliance & performance</p>
                                        </div>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                    </div>
                                ) : archivedRecords.length === 0 ? (
                                    <div className="text-center py-16">
                                        <Database className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-500">No records in cold storage</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50/95 dark:bg-slate-900/95 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Patient ID</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Title</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Archived Date</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {archivedRecords.map((rec) => (
                                                    <tr key={rec._id} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="px-4 py-3 font-mono text-indigo-600">{rec.patientId}</td>
                                                        <td className="px-4 py-3 font-medium text-slate-800">{rec.title}</td>
                                                        <td className="px-4 py-3 text-slate-500">{new Date(rec.archivedAt).toLocaleDateString()}</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                onClick={() => handleRestoreRecord(rec._id)}
                                                                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                                                            >
                                                                RESTORE TO HOT STORAGE
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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

export default AdminDashboard;
