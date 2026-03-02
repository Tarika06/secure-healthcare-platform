import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, FileText, BarChart3, Search, AlertTriangle, TrendingUp, Activity, Database, Clock, CheckCircle, XCircle, Cpu, AlertCircle, Ban, Download, PieChart, Target } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import AlertService from '../../api/AlertService';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [mounted, setMounted] = useState(false);
    const [accessSummary, setAccessSummary] = useState(null);
    const [summaryTimeRange, setSummaryTimeRange] = useState(168);

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        else if (activeTab === 'audit') fetchAuditLogs();
        else if (activeTab === 'alerts') fetchAlerts();
        else if (activeTab === 'overview') fetchStats();
        else if (activeTab === 'summary') fetchAccessSummary();
    }, [activeTab]);

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

    const fetchAccessSummary = async () => {
        setLoading(true);
        try { const r = await apiClient.get(`/admin/access-summary?timeRange=${summaryTimeRange}`); setAccessSummary(r.data.report); }
        catch (e) { console.error('Error fetching access summary:', e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (activeTab === 'summary') fetchAccessSummary();
    }, [summaryTimeRange]);

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
        try { const r = await AlertService.blockIP(ip, alertId); alert(r.message); fetchAlerts(); }
        catch (e) { console.error('IP Block failed:', e); alert('Failed to block IP.'); }
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
        { id: 'summary', label: 'Access Summary', icon: PieChart },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'alerts', label: 'Security Alerts', icon: Shield },
        { id: 'audit', label: 'Audit Logs', icon: FileText }
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
        <div className="flex h-screen overflow-hidden aurora-bg-admin">
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
                <div className="sticky top-0 z-20 px-6 py-3" style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
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

                    {/* ═══ Access Summary Tab ═══ */}
                    {activeTab === 'summary' && (
                        <div className="tab-content space-y-6">
                            {/* Header + Time Range Selector */}
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
                                <div className="flex items-center justify-center py-24">
                                    <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                                </div>
                            ) : accessSummary ? (
                                <>
                                    {/* Summary Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <StatCard icon={Activity} label="Total Access Events" value={accessSummary.totals.totalEvents} gradient="from-violet-500 to-purple-600" delay={0} />
                                        <StatCard icon={XCircle} label="Denied Events" value={accessSummary.totals.totalDenied} gradient="from-red-500 to-rose-600" delay={80} />
                                        <StatCard icon={AlertTriangle} label="Denied Rate" value={`${accessSummary.totals.deniedPercentage}%`} gradient="from-amber-500 to-orange-600" delay={160} />
                                    </div>

                                    {/* Threshold Alerts */}
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

                                    {/* Access by Role Chart */}
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
                                        {/* Access by Action */}
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

                                        {/* Top Active Users */}
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

                                    {/* Denied Access Events */}
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

                    {/* ═══ Users Tab ═══ */}
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
                                            <thead className="sticky top-0 z-10" style={{ background: 'rgba(248,250,252,0.95)', backdropFilter: 'blur(8px)' }}>
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
                                            <thead className="sticky top-0 z-10" style={{ background: 'rgba(248,250,252,0.95)', backdropFilter: 'blur(8px)' }}>
                                                <tr>
                                                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                                                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                                                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                                                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resource</th>
                                                    <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Outcome</th>
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
                                                        <td className="py-3.5 px-4 font-mono text-sm text-teal-600">{log.userId}</td>
                                                        <td className="py-3.5 px-4 font-medium text-slate-800 text-sm">{log.action}</td>
                                                        <td className="py-3.5 px-4 text-sm text-slate-500 max-w-xs truncate">{log.resource}</td>
                                                        <td className="py-3.5 px-4">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${log.outcome === 'SUCCESS'
                                                                ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
                                                                : log.outcome === 'DENIED'
                                                                    ? 'bg-red-100 text-red-700 ring-1 ring-red-200'
                                                                    : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
                                                                }`}>
                                                                {log.outcome === 'SUCCESS' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                                {log.outcome}
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
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
