import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, FileText, BarChart3, Search, AlertTriangle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        else if (activeTab === 'audit') fetchAuditLogs();
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

    const handleLogout = () => { logout(); navigate('/login'); };

    const filteredUsers = users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'users', label: 'User Management', icon: Users },
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
                                                        <td className="py-3 px-4">{u.firstName} {u.lastName}</td>
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

                        {activeTab === 'audit' && (
                            <div className="card">
                                <h2 className="text-xl font-semibold text-slate-900 mb-6">Audit Logs</h2>
                                {loading ? (
                                    <p>Loading...</p>
                                ) : (
                                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                        <table className="w-full">
                                            <thead className="sticky top-0 bg-white">
                                                <tr className="border-b border-slate-200">
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Timestamp</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">User</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Action</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Resource</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Outcome</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {auditLogs.map((log, idx) => (
                                                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                                                        <td className="py-3 px-4 text-sm text-slate-600">
                                                            {new Date(log.timestamp).toLocaleString()}
                                                        </td>
                                                        <td className="py-3 px-4 font-mono text-sm">{log.userId}</td>
                                                        <td className="py-3 px-4">{log.action}</td>
                                                        <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate">{log.resource}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.outcome === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                                                                    log.outcome === 'DENIED' ? 'bg-red-100 text-red-700' :
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
