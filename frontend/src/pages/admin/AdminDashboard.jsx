import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, FileText, BarChart3, Search, AlertTriangle, Cpu, CheckCircle, XCircle, AlertCircle, Ban } from 'lucide-react';
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

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

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
            ADMIN: 'bg-purple-100 text-purple-700',
            DOCTOR: 'bg-blue-100 text-blue-700',
            NURSE: 'bg-green-100 text-green-700',
            LAB_TECHNICIAN: 'bg-amber-100 text-amber-700',
            PATIENT: 'bg-slate-100 text-slate-700'
        };
        return colors[role] || 'bg-slate-100 text-slate-700';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-50">
            <div className="flex">
                <Sidebar
                    items={sidebarItems}
                    activeItem={activeTab}
                    onItemClick={setActiveTab}
                    user={user}
                    onLogout={handleLogout}
                />

                <main className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="h-8 w-8 text-primary-600" />
                            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                        </div>
                        <p className="text-slate-600 mb-8">System administration and audit oversight</p>

                        {activeTab === 'overview' && (
                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                    {stats && (
                                        <>
                                            <div className="card text-center">
                                                <p className="text-3xl font-bold text-primary-600">{stats.totalPatients}</p>
                                                <p className="text-slate-600">Total Patients</p>
                                            </div>
                                            <div className="card text-center">
                                                <p className="text-3xl font-bold text-blue-600">{stats.totalDoctors}</p>
                                                <p className="text-slate-600">Total Doctors</p>
                                            </div>
                                            <div className="card text-center">
                                                <p className="text-3xl font-bold text-green-600">{stats.totalRecords}</p>
                                                <p className="text-slate-600">Medical Records</p>
                                            </div>
                                            <div className="card text-center">
                                                <p className="text-3xl font-bold text-amber-600">{stats.recentRecordsLast7Days}</p>
                                                <p className="text-slate-600">Records (7 days)</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="card">
                                    <h3 className="font-semibold text-slate-900 mb-4">Records by Type</h3>
                                    {stats?.recordsByType && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {stats.recordsByType.map((item, idx) => (
                                                <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                                                    <p className="text-lg font-semibold">{item.count}</p>
                                                    <p className="text-sm text-slate-600">{item._id || 'Unknown'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="card">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold text-slate-900">User Management</h2>
                                    <div className="relative w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="input-field pl-10"
                                        />
                                    </div>
                                </div>

                                {loading ? (
                                    <p>Loading...</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">User ID</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Name</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Email</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Role</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredUsers.map(u => (
                                                    <tr key={u.userId} className="border-b border-slate-100 hover:bg-slate-50">
                                                        <td className="py-3 px-4 font-mono text-sm">{u.userId}</td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`h-2.5 w-2.5 rounded-full ${u.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-300'}`} title={u.isOnline ? "Online" : "Offline"} />
                                                                <span>{u.firstName} {u.lastName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-600">{u.email}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                }`}>
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

                        {activeTab === 'alerts' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold text-slate-900">AI-Assisted Security Alerts</h2>
                                    <button
                                        onClick={handleAIAnalyze}
                                        disabled={isAnalyzing}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${isAnalyzing
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg hover:shadow-primary-200 hover:-translate-y-0.5'
                                            }`}
                                    >
                                        <Cpu className={`h-5 w-5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                        {isAnalyzing ? 'Analyzing Logs...' : 'Analyze Logs with AI'}
                                    </button>
                                </div>

                                {alerts.length === 0 ? (
                                    <div className="card text-center py-12">
                                        <Shield className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-500 font-medium">No security alerts found.</p>
                                        <p className="text-sm text-slate-400">Run AI analysis to check for suspicious activity.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {alerts.map(alert => (
                                            <div key={alert._id} className={`card border-l-4 ${alert.severity === 'CRITICAL' ? 'border-red-600 bg-red-50/30' :
                                                alert.severity === 'HIGH' ? 'border-orange-500' :
                                                    alert.severity === 'MEDIUM' ? 'border-amber-400' : 'border-blue-400'
                                                }`}>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-4">
                                                        <div className={`p-2 rounded-lg ${alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                                                            alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                                                                'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            <AlertCircle className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${alert.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                                                                    alert.severity === 'HIGH' ? 'bg-orange-500 text-white' :
                                                                        'bg-slate-200 text-slate-700'
                                                                    }`}>
                                                                    {alert.severity}
                                                                </span>
                                                                <span className="text-xs text-slate-400">
                                                                    {new Date(alert.timestamp).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-bold text-slate-900">{alert.type.replace(/_/g, ' ')}</h4>
                                                            <p className="text-slate-600 text-sm mt-1">{alert.description}</p>
                                                            {alert.recommendation && (
                                                                <div className="mt-3 p-2 bg-white/50 rounded text-xs border border-slate-100 italic">
                                                                    <strong className="text-primary-600">AI Recommendation:</strong> {alert.recommendation}
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
                                                                        className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-[10px] font-bold rounded hover:bg-red-700 transition-colors"
                                                                        title="Block IP Address"
                                                                    >
                                                                        <Ban className="h-3 w-3" />
                                                                        BLOCK IP
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleUpdateAlertStatus(alert._id, 'RESOLVED')}
                                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                    title="Resolve"
                                                                >
                                                                    <CheckCircle className="h-5 w-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateAlertStatus(alert._id, 'DISMISSED')}
                                                                    className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
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

                        {activeTab === 'audit' && (
                            <div className="card">
                                {/* Security Warning Banner */}
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertTriangle className="h-5 w-5 text-red-500" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-bold text-red-800">RESTRICTED: ADMIN EYES ONLY</h3>
                                            <div className="mt-2 text-sm text-red-700">
                                                <p>
                                                    You are viewing sensitive audit trails. This data is legally protected under HIPAA/GDPR validation rules.
                                                    Any unauthorized sharing or modification attempts are strictly logged and may result in account suspension.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold text-slate-900">Audit Logs</h2>
                                    <div className="flex gap-3 items-center">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await apiClient.get('/admin/audit-logs/export', { responseType: 'blob' });
                                                    const url = window.URL.createObjectURL(new Blob([res.data]));
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', 'audit_logs.csv');
                                                    document.body.appendChild(link);
                                                    link.click();
                                                } catch (err) { alert('Export failed'); }
                                            }}
                                            className="btn-outline text-xs py-2 px-4 whitespace-nowrap"
                                        >
                                            Export CSV
                                        </button>
                                        <div className="relative w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Filter logs..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="input-field pl-10"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {loading ? (
                                    <p>Loading...</p>
                                ) : (
                                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                        <table className="w-full">
                                            <thead className="sticky top-0 bg-white shadow-sm z-10">
                                                <tr className="border-b border-slate-200">
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Timestamp</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">User</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Target</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Action</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Compliance</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Resource</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 font-mono">IP Address</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Outcome</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {auditLogs.filter(log =>
                                                    log.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    log.targetUserId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                    log.resource?.toLowerCase().includes(searchTerm.toLowerCase())
                                                ).map((log, idx) => (
                                                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                        <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                                                            {new Date(log.timestamp).toLocaleString()}
                                                        </td>
                                                        <td className="py-3 px-4 font-mono text-sm font-medium text-slate-700">{log.userId}</td>
                                                        <td className="py-3 px-4 font-mono text-xs text-slate-500">{log.targetUserId || '-'}</td>
                                                        <td className="py-3 px-4">
                                                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                                                                {log.action.replace(/_/g, ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {log.complianceCategory && (
                                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${log.complianceCategory === 'HIPAA' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                                    log.complianceCategory === 'GDPR' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                                        'bg-slate-50 text-slate-400'
                                                                    }`}>
                                                                    {log.complianceCategory}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-xs text-slate-600 max-w-[200px] truncate" title={log.resource}>
                                                            {log.resource}
                                                        </td>
                                                        <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                                                            {log.ipAddress || 'internal'}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${log.outcome === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                                                                log.outcome === 'DENIED' || log.outcome === 'FAILURE' ? 'bg-rose-100 text-rose-700' :
                                                                    'bg-slate-100 text-slate-700'
                                                                }`}>
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

                        {/* Admin Restrictions Notice */}
                        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-800 text-sm">
                                <strong>Admin Access:</strong> You can view system statistics and audit logs.
                                Medical record content is encrypted and not directly viewable by administrators.
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
