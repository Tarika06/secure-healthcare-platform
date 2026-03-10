import React, { useState, useEffect, useCallback } from 'react';
import { Video, Shield, Clock, Wifi, Search, Filter, Activity, Cpu, Calendar } from 'lucide-react';
import teleconsultationApi from '../../api/teleconsultationApi';

// Helper component for statistics
const StatCard = ({ icon: Icon, label, value, gradientClassName }) => (
    <div className={`p-6 rounded-2xl text-white shadow-lg ${gradientClassName} relative overflow-hidden group`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-500"></div>
        <div className="relative z-10 flex justify-between items-center">
            <div>
                <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-1">{label}</p>
                <h3 className="text-4xl font-black">{value ?? '—'}</h3>
            </div>
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <Icon className="w-7 h-7 text-white" />
            </div>
        </div>
    </div>
);

const VideoConsultationLogsTab = () => {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);
    
    // Pagination & Filters
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        sessionId: '',
        connectionQuality: ''
    });

    const fetchStats = useCallback(async () => {
        try {
            setLoadingStats(true);
            const data = await teleconsultationApi.getVideoLogStats();
            setStats(data.stats);
        } catch (error) {
            console.error('Failed to fetch video log stats:', error);
        } finally {
            setLoadingStats(false);
        }
    }, []);

    const fetchLogs = useCallback(async () => {
        try {
            setLoadingLogs(true);
            const data = await teleconsultationApi.getVideoLogs({
                page,
                limit: 10,
                sessionId: filters.sessionId,
                connectionQuality: filters.connectionQuality
            });
            setLogs(data.logs);
            setTotalPages(data.pagination.pages);
        } catch (error) {
            console.error('Failed to fetch video logs:', error);
        } finally {
            setLoadingLogs(false);
        }
    }, [page, filters]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPage(1); // Reset to first page when filtering
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header section */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                    <Video className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Video Consultation Logs</h2>
                    <p className="text-slate-500 text-sm">System audit trail for teleconsultation network metrics and events</p>
                </div>
            </div>

            {/* Statistics */}
            {!loadingStats && stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard 
                        label="Total Consultations" 
                        value={stats.totalConsultations} 
                        icon={Activity} 
                        gradientClassName="bg-gradient-to-br from-indigo-500 to-blue-600" 
                    />
                    <StatCard 
                        label="Today's Sessions" 
                        value={stats.todayConsultations} 
                        icon={Calendar} 
                        gradientClassName="bg-gradient-to-br from-emerald-500 to-teal-600" 
                    />
                    <StatCard 
                        label="Avg. Duration (s)" 
                        value={stats.avgDurationSeconds} 
                        icon={Clock} 
                        gradientClassName="bg-gradient-to-br from-amber-500 to-orange-600" 
                    />
                    <StatCard 
                        label="Failed Connections" 
                        value={stats.failedConsultations} 
                        icon={Wifi} 
                        gradientClassName="bg-gradient-to-br from-rose-500 to-red-600" 
                    />
                </div>
            )}

            {/* Main Log Table */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-800">Connection Telemetry & Events</h3>
                    </div>
                    
                    {/* Filters */}
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Session ID..."
                                className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-48"
                                value={filters.sessionId}
                                onChange={(e) => handleFilterChange('sessionId', e.target.value)}
                            />
                        </div>
                        <select
                            className="px-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                            value={filters.connectionQuality}
                            onChange={(e) => handleFilterChange('connectionQuality', e.target.value)}
                        >
                            <option value="">All Qualities</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Session Details</th>
                                <th className="p-4 font-semibold">Timing</th>
                                <th className="p-4 font-semibold">Metrics</th>
                                <th className="p-4 font-semibold">Connection Status</th>
                                <th className="p-4 font-semibold">Security Level</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loadingLogs ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center">
                                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                                        <p className="mt-3 text-sm text-slate-500">Loading audit logs...</p>
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                        No video consultation logs found based on current filters.
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log._id} className="hover:bg-indigo-50/50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100 inline-block px-2 py-1 rounded">
                                                {log.sessionId}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">Patient: {log.patientId}</p>
                                            {log.doctorId && <p className="text-xs text-slate-500">Doctor: {log.doctorId}</p>}
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-medium text-slate-800">
                                                {new Date(log.created_at).toLocaleString()}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Dur: {log.totalCallDurationSeconds}s | Wait: {log.waitingTimeSeconds}s
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                                                <span className="flex items-center gap-1" title="Average Latency">
                                                    <Activity className="w-3 h-3 text-amber-500" />
                                                    {Math.round(log.averageLatencyMs)}ms
                                                </span>
                                                <span className="flex items-center gap-1" title="Packet Loss">
                                                    <Cpu className="w-3 h-3 text-red-500" />
                                                    {log.packetLossPercentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                log.connectionQualityRating === 'excellent' ? 'bg-emerald-100 text-emerald-700' :
                                                log.connectionQualityRating === 'good' ? 'bg-blue-100 text-blue-700' :
                                                log.connectionQualityRating === 'fair' ? 'bg-amber-100 text-amber-700' :
                                                'bg-rose-100 text-rose-700'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    log.connectionQualityRating === 'excellent' ? 'bg-emerald-500' :
                                                    log.connectionQualityRating === 'good' ? 'bg-blue-500' :
                                                    log.connectionQualityRating === 'fair' ? 'bg-amber-500' :
                                                    'bg-rose-500'
                                                }`} />
                                                {log.connectionQualityRating.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-teal-700 bg-teal-50 px-2 py-1 rounded inline-block text-xs font-mono font-bold">
                                                <Shield className="w-3 h-3" />
                                                {log.encryptionProtocol}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                        <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoConsultationLogsTab;
