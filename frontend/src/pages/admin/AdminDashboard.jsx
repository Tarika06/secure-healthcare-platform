import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, Users, FileText, BarChart3, Search, AlertTriangle,
    TrendingUp, Activity, Database, Clock, CheckCircle, XCircle,
    Cpu, AlertCircle, Ban, Download, Trash2, Smartphone, MailCheck, Lock, Calendar
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import AlertService from '../../api/AlertService';
import gdprApi from '../../api/gdprApi';
import AdminAppointmentsTab from '../../components/admin/AdminAppointmentsTab';

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

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        else if (activeTab === 'audit') fetchAuditLogs();
        else if (activeTab === 'alerts') fetchAlerts();
        else if (activeTab === 'overview') fetchStats();
        else if (activeTab === 'hot-storage') fetchHotRecords();
        else if (activeTab === 'deletions') fetchPendingDeletions();
        else if (activeTab === 'archive') fetchArchivedRecords();
        else if (activeTab === 'collaboration') fetchCollaborations();
        else if (activeTab === 'appointments') { /* Handled by child component */ }
    }, [activeTab, fetchUsers, fetchAuditLogs, fetchAlerts, fetchStats, fetchHotRecords, fetchPendingDeletions, fetchArchivedRecords, fetchCollaborations]);

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

    return (
        <div className="flex h-screen overflow-hidden dashboard-glass-bg">
            <Sidebar
                items={sidebarItems}
                activeItem={activeTab}
                onItemClick={(id) => setActiveTab(id)}
                user={user}
                onLogout={handleLogout}
            />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto w-full">
                    {activeTab === 'overview' && (
                        <div className="animate-fade-in">
                            <div className="grid grid-cols-12 gap-4 mb-5">
                                <div className={`col-span-12 lg:col-span-7 stat-card-glass group transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>
                                    <div className="flex items-start justify-between h-full">
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Patients</p>
                                            <p className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-teal-500 bg-clip-text text-transparent">{stats?.totalPatients ?? '—'}</p>
                                            <p className="text-sm text-slate-600">Active in system</p>
                                        </div>
                                        <div className="w-20 h-20 rounded-2xl icon-container-primary flex items-center justify-center"><Users className="w-10 h-10" /></div>
                                    </div>
                                </div>
                                <div className="col-span-12 lg:col-span-5 grid grid-cols-1 gap-4">
                                    <div className={`stat-card-glass group transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
                                        <div className="flex items-center justify-between">
                                            <div><p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Doctors</p><p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent mt-2">{stats?.totalDoctors ?? '—'}</p></div>
                                            <div className="w-14 h-14 rounded-xl icon-container-blue flex items-center justify-center"><Activity className="w-7 h-7" /></div>
                                        </div>
                                    </div>
                                    <div className={`stat-card-glass group transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '250ms' }}>
                                        <div className="flex items-center justify-between">
                                            <div><p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Medical Records</p><p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent mt-2">{stats?.totalRecords ?? '—'}</p></div>
                                            <div className="w-14 h-14 rounded-xl icon-container-green flex items-center justify-center"><FileText className="w-7 h-7" /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-12 gap-4 mb-8">
                                <div className="col-span-12 lg:col-span-5 lg:col-start-8">
                                    <div className={`stat-card-glass group transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '300ms' }}>
                                        <div className="flex items-center justify-between">
                                            <div><p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Records (7 days)</p><p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mt-2">{stats?.recentRecordsLast7Days ?? '—'}</p></div>
                                            <div className="w-14 h-14 rounded-xl icon-container-amber flex items-center justify-center"><TrendingUp className="w-7 h-7" /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-12 gap-6 mb-7">
                                <div className={`col-span-12 lg:col-span-8 card transition-all duration-700 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`} style={{ transitionDelay: '400ms' }}>
                                    <div className="flex items-center gap-3 mb-6"><div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-100 to-teal-100 flex items-center justify-center"><Database className="w-6 h-6 text-primary-600" /></div><h3 className="text-lg font-bold text-slate-900">Records by Type</h3></div>
                                    {stats?.recordsByType ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {stats.recordsByType.map((item, idx) => (
                                                <div key={idx} className="group p-5 rounded-xl bg-gradient-to-br from-slate-50 to-white border hover:shadow-lg transition-all"><p className="text-3xl font-bold text-gradient">{item.count}</p><p className="text-sm text-slate-500 mt-2">{item._id || 'Unknown'}</p></div>
                                            ))}
                                        </div>
                                    ) : <p className="text-slate-400">No data available</p>}
                                </div>
                                <div className={`col-span-12 lg:col-span-4 p-6 bg-blue-50 border border-blue-200 rounded-2xl transition-all duration-700 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`} style={{ transitionDelay: '450ms' }}>
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4"><Shield className="w-6 h-6 text-blue-600" /></div>
                                    <p className="font-bold text-blue-900 mb-2">Admin Access Level</p>
                                    <p className="text-blue-700 text-sm leading-relaxed">Medical record content is encrypted and not directly viewable by administrators to ensure patient privacy.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appointments' && (
                        <div className="animate-fade-in">
                            <AdminAppointmentsTab />
                        </div>
                    )}

                    {activeTab === 'hot-storage' && (
                        <div className="animate-fade-in"><div className="glass-card"><div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md"><Activity className="w-5 h-5 text-white" /></div><h2 className="text-xl font-bold text-slate-900">Hot Storage (Active Records)</h2></div>
                            {loading ? <div className="flex justify-center py-12"><div className="w-10 h-10 border-3 border-orange-200 border-t-orange-600 rounded-full animate-spin" /></div> : hotRecords.length === 0 ? <p className="text-center py-16 text-slate-500">No active records found</p> :
                                <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr><th className="px-4 py-3 font-bold text-slate-500">Patient ID</th><th className="px-4 py-3 font-bold text-slate-500">Title</th><th className="px-4 py-3 font-bold text-slate-500">Created At</th><th className="px-4 py-3 font-bold text-slate-500 text-right">Status</th></tr></thead><tbody className="divide-y">{hotRecords.map(rec => (
                                    <tr key={rec._id} className="hover:bg-slate-50/60"><td className="px-4 py-3 font-mono text-orange-600">{rec.patientId}</td><td className="px-4 py-3 font-medium text-slate-800">{rec.title}</td><td className="px-4 py-3 text-slate-500">{new Date(rec.createdAt).toLocaleDateString()}</td><td className="px-4 py-3 text-right"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">ACTIVE</span></td></tr>
                                ))}</tbody></table></div>}
                        </div></div>
                    )}

                    {activeTab === 'users' && (
                        <div className="animate-fade-in"><div className="glass-card"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-teal-100 flex items-center justify-center"><Users className="w-5 h-5 text-primary-600" /></div><h2 className="text-xl font-bold text-slate-900">User Management</h2></div><div className="relative w-full md:w-72"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-field pl-11" /></div></div>
                            {loading ? <div className="flex justify-center py-12"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div> :
                                <div className="overflow-x-auto rounded-xl border"><table className="w-full"><thead className="sticky top-0 bg-slate-50 z-10"><tr className="bg-slate-50"><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">User ID</th><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Name</th><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Email</th><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Role</th><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Status</th></tr></thead><tbody className="divide-y">{filteredUsers.map(u => (
                                    <tr key={u.userId} className="table-row-hover"><td className="py-4 px-4 font-mono text-sm text-primary-600">{u.userId}</td><td className="py-4 px-4"><div className="flex items-center gap-2"><div className={`h-2.5 w-2.5 rounded-full ${u.isOnline ? 'bg-green-500 shadow-sm' : 'bg-slate-300'}`} /><span className="font-medium">{u.firstName} {u.lastName}</span></div></td><td className="py-4 px-4 text-slate-500">{u.email}</td><td className="py-4 px-4"><span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleBadgeColor(u.role)}`}>{u.role}</span></td><td className="py-4 px-4"><span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{u.status}</span></td></tr>
                                ))}</tbody></table></div>}
                        </div></div>
                    )}

                    {activeTab === 'alerts' && (
                        <div className="animate-fade-in"><div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div><h2 className="text-xl font-bold text-slate-900">Security Alerts</h2></div><button onClick={handleAIAnalyze} disabled={isAnalyzing} className="btn-primary flex items-center gap-2 px-4 py-2"><Cpu className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />{isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}</button></div>
                            {alerts.length === 0 ? <div className="text-center py-12"><Shield className="h-12 w-12 text-slate-200 mx-auto mb-4" /><p className="text-slate-500 font-medium">No security alerts found</p></div> :
                                <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">{alerts.map(alert => (
                                    <div key={alert._id} className={`p-5 rounded-xl border-l-4 bg-white shadow-sm hover:shadow-md transition-all ${alert.severity === 'CRITICAL' ? 'border-red-500' : alert.severity === 'HIGH' ? 'border-orange-500' : 'border-amber-400'}`}>
                                        <div className="flex justify-between items-start"><div className="flex gap-4"><div className="p-2.5 rounded-lg h-12 w-12 flex items-center justify-center bg-slate-50"><AlertCircle className="h-6 w-6 text-slate-600" /></div><div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1"><h4 className="font-bold text-slate-900 text-lg">{alert.type.replace(/_/g, ' ')}</h4><span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide bg-slate-100">{alert.severity}</span></div>
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
                            {loading ? <div className="flex justify-center py-12"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div> :
                                <div className="overflow-x-auto rounded-xl border"><table className="w-full"><thead className="sticky top-0 bg-slate-50 z-10"><tr><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Timestamp</th><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">User</th><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Action</th><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">IP Address</th><th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Outcome</th></tr></thead><tbody className="divide-y">{auditLogs.map((log, idx) => (
                                    <tr key={idx} className="table-row-hover"><td className="py-4 px-4 text-sm text-slate-500"><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" />{new Date(log.timestamp).toLocaleString()}</div></td><td className="py-4 px-4 font-mono text-sm text-primary-600">{log.userId}</td><td className="py-4 px-4 font-medium">{log.action}</td><td className="py-4 px-4 font-mono text-sm">{log.ipAddress || 'internal'}</td><td className="py-4 px-4"><span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${log.outcome === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{log.outcome === 'SUCCESS' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{log.outcome}</span></td></tr>
                                ))}</tbody></table></div>}
                        </div>
                    )}

                    {activeTab === 'deletions' && (
                        <div className="animate-fade-in space-y-8"><div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md"><Trash2 className="w-5 h-5 text-white" /></div><h2 className="text-xl font-bold text-slate-900">Pending Deletions</h2></div><span className="px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> 7-Day Window</span></div>
                            <div className="glass-card overflow-hidden">{loading ? <div className="flex justify-center py-12"><div className="w-10 h-10 border-3 border-red-200 border-t-red-600 rounded-full animate-spin" /></div> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b"><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User / Email</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Deletion Date</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">MFA Status</th></tr></thead><tbody className="divide-y">{pendingDeletions.length > 0 ? pendingDeletions.map((req, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/60 transition-colors"><td className="px-6 py-4"><div className="font-bold text-slate-800">{req.userEmail}</div><div className="text-[10px] text-slate-500 font-mono">{req.userId}</div></td><td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${req.status === 'MFA_VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{req.status.replace('_', ' ')}</span></td><td className="px-6 py-4"><div className="text-sm font-bold text-red-600">{new Date(req.scheduledDeletionDate).toLocaleDateString()}</div><div className="text-[10px] text-slate-400">In {req.daysRemaining} days</div></td><td className="px-6 py-4">{req.mfaVerified ? <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold"><CheckCircle className="w-3.5 h-3.5" /> SECURE</div> : <div className="flex items-center gap-1 text-amber-600 text-xs font-bold"><Smartphone className="w-3.5 h-3.5" /> PENDING</div>}</td></tr>
                            )) : <tr><td colSpan="4" className="px-6 py-12 text-center"><p className="text-slate-500 font-medium">No pending deletion requests</p></td></tr>}</tbody></table></div>}</div>
                        </div>
                    )}

                    {activeTab === 'collaboration' && (
                        <div className="animate-fade-in"><div className="glass-card"><div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md"><MailCheck className="w-5 h-5 text-white" /></div><h2 className="text-xl font-bold text-slate-900">Peer Consultations</h2></div><div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-700"><Shield className="w-3.5 h-3.5" /> Protected</div></div>
                            {loading ? <div className="flex justify-center py-12"><div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div> : collaborations.length === 0 ? <p className="text-center py-16 text-slate-500">No active consultations found</p> :
                                <div className="overflow-x-auto rounded-xl border transition-all"><table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr><th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Consulting Doctors</th><th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Patient ID</th><th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status</th><th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Requested On</th></tr></thead><tbody className="divide-y">{collaborations.map(collab => (
                                    <tr key={collab._id} className="hover:bg-slate-50/60 transition-colors"><td className="px-4 py-4"><div className="flex flex-col gap-0.5"><span className="text-xs font-bold text-slate-700">From: {collab.requestingDoctorId}</span><span className="text-xs font-bold text-indigo-600">To: {collab.consultingDoctorId}</span></div></td><td className="px-4 py-4 font-mono text-xs text-slate-500">{collab.patientId}</td><td className="px-4 py-4"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${collab.status === 'ACCEPTED' ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'}`}>{collab.status}</span></td><td className="px-4 py-4 text-xs text-slate-400">{new Date(collab.createdAt).toLocaleDateString()}</td></tr>
                                ))}</tbody></table></div>}
                        </div></div>
                    )}

                    {activeTab === 'archive' && (
                        <div className="animate-fade-in"><div className="glass-card"><div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md"><Database className="w-5 h-5 text-white" /></div><h2 className="text-xl font-bold text-slate-900">Cold Storage Archival</h2></div></div>
                            {loading ? <div className="flex justify-center py-12"><div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div> : archivedRecords.length === 0 ? <p className="text-center py-16 text-slate-500">No records in cold storage</p> :
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
