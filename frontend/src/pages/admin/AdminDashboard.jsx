import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, FileText, BarChart3, Search, AlertTriangle, TrendingUp, Activity, Database, Clock, CheckCircle, XCircle, Cpu, AlertCircle, Ban } from 'lucide-react';
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

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        else if (activeTab === 'audit') fetchAuditLogs();
        else if (activeTab === 'alerts') fetchAlerts();
        else if (activeTab === 'overview') fetchStats();
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/users');
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/audit-logs?limit=100');
            setAuditLogs(response.data.logs || []);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/mgmt/analysis/trends');
            setStats(response.data.stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const data = await AlertService.getAlerts();
            setAlerts(data.alerts || []);
        } catch (error) {
            console.error('Error fetching alerts:', error);
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
        try {
            await AlertService.updateAlertStatus(id, status);
            fetchAlerts();
        } catch (error) {
            console.error('Status update failed:', error);
        }
    };

    const handleBlockIP = async (ip, alertId) => {
        if (!window.confirm(`Are you sure you want to block IP: ${ip}? This will immediately stop all access from this address.`)) return;
        try {
            const result = await AlertService.blockIP(ip, alertId);
            alert(result.message);
            fetchAlerts();
        } catch (error) {
            console.error('IP Block failed:', error);
            alert('Failed to block IP.');
        }
    };

    const extractIP = (text) => {
        const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
        const match = text.match(ipRegex);
        return match ? match[0] : null;
    };

    const handleExportCSV = () => {
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
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const filteredUsers = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'alerts', label: 'Security Alerts', icon: Shield },
        { id: 'audit', label: 'Audit Logs', icon: FileText }
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

    const StatCard = ({ icon: Icon, label, value, color, delay }) => (
        <div
            className={`stat-card-glass group transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className={`text-4xl font-bold mt-2 bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                        {value ?? '—'}
                    </p>
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${color.includes('primary') ? 'icon-container-primary' :
                    color.includes('blue') ? 'icon-container-blue' :
                        color.includes('green') ? 'icon-container-green' :
                            'icon-container-amber'
                    }`}>
                    <Icon className="w-7 h-7" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden dashboard-glass-bg">
            <div className="flex">
                <Sidebar
                    items={sidebarItems}
                    activeItem={activeTab}
                    onItemClick={setActiveTab}
                    user={user}
                    onLogout={handleLogout}
                />

                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-[1600px] mx-auto w-full">
                        {/* Header */}
                        <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                                    <Shield className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                                    <p className="text-slate-500">Welcome back, <span className="text-purple-600 font-medium">{user?.firstName} {user?.lastName}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard
                                        icon={Users}
                                        label="Total Patients"
                                        value={stats?.totalPatients}
                                        color="from-primary-600 to-teal-500"
                                        delay={100}
                                    />
                                    <StatCard
                                        icon={Activity}
                                        label="Total Doctors"
                                        value={stats?.totalDoctors}
                                        color="from-blue-600 to-indigo-500"
                                        delay={200}
                                    />
                                    <StatCard
                                        icon={FileText}
                                        label="Medical Records"
                                        value={stats?.totalRecords}
                                        color="from-green-600 to-emerald-500"
                                        delay={300}
                                    />
                                    <StatCard
                                        icon={TrendingUp}
                                        label="Records (7 days)"
                                        value={stats?.recentRecordsLast7Days}
                                        color="from-amber-500 to-orange-500"
                                        delay={400}
                                    />
                                </div>

                                {/* Records by Type */}
                                <div className={`card transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-teal-100 flex items-center justify-center">
                                            <Database className="w-5 h-5 text-primary-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">Records by Type</h3>
                                    </div>
                                    {stats?.recordsByType ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {stats.recordsByType.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                                                    style={{ animationDelay: `${600 + idx * 100}ms` }}
                                                >
                                                    <p className="text-2xl font-bold text-gradient">{item.count}</p>
                                                    <p className="text-sm text-slate-500 mt-1">{item._id || 'Unknown'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-400">No data available</p>
                                    )}
                                </div>

                                {/* Admin Notice */}
                                <div className={`p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl transition-all duration-700 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <Shield className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-blue-900">Admin Access Level</p>
                                            <p className="text-blue-700 text-sm mt-1">
                                                You can view system statistics and audit logs. Medical record content is encrypted and not directly viewable by administrators to ensure patient privacy.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Users Tab */}
                        {activeTab === 'users' && (
                            <div className={`card transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-teal-100 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-primary-600" />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900">User Management</h2>
                                    </div>
                                    <div className="relative w-full md:w-72">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="input-field pl-11"
                                        />
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto rounded-xl border border-slate-200 custom-scrollbar">
                                        <table className="w-full">
                                            <thead className="sticky top-0 bg-slate-50 z-10">
                                                <tr className="bg-slate-50">
                                                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">User ID</th>
                                                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Name</th>
                                                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Email</th>
                                                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Role</th>
                                                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredUsers.map((u, idx) => (
                                                    <tr
                                                        key={u.userId}
                                                        className="table-row-hover"
                                                        style={{ animationDelay: `${idx * 50}ms` }}
                                                    >
                                                        <td className="py-4 px-4 font-mono text-sm text-primary-600">{u.userId}</td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`h-2.5 w-2.5 rounded-full ${u.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}`} title={u.isOnline ? "Online" : "Offline"} />
                                                                <span className="font-medium text-slate-800">{u.firstName} {u.lastName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-slate-500">{u.email}</td>
                                                        <td className="py-4 px-4">
                                                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getRoleBadgeColor(u.role)}`}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${u.status === 'ACTIVE'
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
                        )}

                        {/* Alerts Tab */}
                        {activeTab === 'alerts' && (
                            <div className={`card transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
                                            <AlertTriangle className="w-5 h-5 text-red-600" />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900">Security Alerts</h2>
                                    </div>
                                    <button
                                        onClick={handleAIAnalyze}
                                        disabled={isAnalyzing}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${isAnalyzing
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md'
                                            }`}
                                    >
                                        <Cpu className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                        {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
                                    </button>
                                </div>

                                {alerts.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Shield className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-500 font-medium">No security alerts found</p>
                                        <p className="text-sm text-slate-400">System is secure. Run AI analysis to check for hidden threats.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                                        {alerts.map(alert => (
                                            <div key={alert._id} className={`p-5 rounded-xl border-l-4 bg-white shadow-sm hover:shadow-md transition-all duration-300 ${alert.severity === 'CRITICAL' ? 'border-red-500' :
                                                alert.severity === 'HIGH' ? 'border-orange-500' :
                                                    alert.severity === 'MEDIUM' ? 'border-amber-400' : 'border-blue-400'
                                                }`}>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-4">
                                                        <div className={`p-2.5 rounded-lg h-12 w-12 flex items-center justify-center ${alert.severity === 'CRITICAL' ? 'bg-red-50 text-red-600' :
                                                            alert.severity === 'HIGH' ? 'bg-orange-50 text-orange-600' :
                                                                alert.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                                            }`}>
                                                            <AlertCircle className="h-6 w-6" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h4 className="font-bold text-slate-900 text-lg">{alert.type.replace(/_/g, ' ')}</h4>
                                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                                                    alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                                                        alert.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                                                    }`}>
                                                                    {alert.severity}
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-600 text-sm leading-relaxed mb-3">{alert.description}</p>

                                                            <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {new Date(alert.timestamp).toLocaleString()}
                                                                </span>
                                                            </div>

                                                            {alert.recommendation && (
                                                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex gap-3">
                                                                    <div className="mt-0.5">
                                                                        <Cpu className="w-4 h-4 text-primary-600" />
                                                                    </div>
                                                                    <div>
                                                                        <strong className="block text-slate-700 text-xs font-semibold mb-0.5">AI Recommendation</strong>
                                                                        <p className="text-slate-600 text-sm italic">{alert.recommendation}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {alert.status === 'OPEN' && (
                                                            <>
                                                                {extractIP(alert.description) && (
                                                                    <button
                                                                        onClick={() => handleBlockIP(extractIP(alert.description), alert._id)}
                                                                        className="flex items-center gap-1 px-3 py-1 bg-slate-900 text-white text-[10px] font-bold rounded hover:bg-black transition-colors"
                                                                        title="Block IP Address"
                                                                    >
                                                                        <Ban className="h-3 w-3" />
                                                                        BLOCK
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleUpdateAlertStatus(alert._id, 'RESOLVED')}
                                                                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                                                    title="Resolve"
                                                                >
                                                                    <CheckCircle className="h-5 w-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateAlertStatus(alert._id, 'DISMISSED')}
                                                                    className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
                                                                    title="Dismiss"
                                                                >
                                                                    <XCircle className="h-5 w-5" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {alert.status !== 'OPEN' && (
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-100 rounded">
                                                                {alert.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Audit Tab */}
                        {activeTab === 'audit' && (
                            <div className={`card min-h-[500px] transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                                            <Clock className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900">Audit Logs</h2>
                                    </div>
                                    <button
                                        onClick={handleExportCSV}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Export CSV
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center h-[400px]">
                                        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto rounded-xl border border-slate-200 custom-scrollbar">
                                        <table className="w-full">
                                            <thead className="sticky top-0 bg-slate-50 z-10">
                                                <tr>
                                                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600 shadow-sm">Timestamp</th>
                                                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600 shadow-sm">User</th>
                                                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600 shadow-sm">Action</th>
                                                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600 shadow-sm">Resource</th>
                                                    <th className="text-left py-4 px-4 text-sm font-semibold text-slate-600 shadow-sm">Outcome</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {auditLogs.map((log, idx) => (
                                                    <tr key={idx} className="table-row-hover">
                                                        <td className="py-4 px-4 text-sm text-slate-500">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-4 h-4 text-slate-400" />
                                                                {new Date(log.timestamp).toLocaleString()}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 font-mono text-sm text-primary-600">{log.userId}</td>
                                                        <td className="py-4 px-4 font-medium text-slate-800">{log.action}</td>
                                                        <td className="py-4 px-4 text-sm text-slate-500 max-w-xs truncate">{log.resource}</td>
                                                        <td className="py-4 px-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${log.outcome === 'SUCCESS'
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
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
