import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, User, FileText, CheckCircle, Search, Filter } from 'lucide-react';
import appointmentApi from '../../api/appointmentApi';

const AdminAppointmentsTab = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const fetchAllAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const data = await appointmentApi.listAppointments();
            setAppointments(data.appointments || []);
        } catch (err) {
            console.error('Failed to load all appointments', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllAppointments();
    }, [fetchAllAppointments]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'BOOKED': return 'bg-teal-100 text-teal-700 ring-1 ring-teal-200';
            case 'VERIFIED': return 'bg-blue-100 text-blue-700 ring-1 ring-blue-200';
            case 'COMPLETED': return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
            case 'CANCELLED':
            case 'NO_SHOW': return 'bg-rose-100 text-rose-700 ring-1 ring-rose-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const filteredAppointments = appointments.filter(apt => {
        const matchesSearch =
            apt.appointmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${apt.patient?.firstName} ${apt.patient?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${apt.doctor?.firstName} ${apt.doctor?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="tab-content">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Hospital Appointments</h2>
                    <p className="text-slate-500 mt-1">Global view of all scheduled consultations</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search ID, Patient, Doctor..."
                            className="input-field pl-10 py-2 text-sm w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                            className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">ALL STATUS</option>
                            <option value="BOOKED">BOOKED</option>
                            <option value="VERIFIED">VERIFIED</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="glass-card text-center py-20">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Fetching global schedule...</p>
                </div>
            ) : filteredAppointments.length === 0 ? (
                <div className="glass-card text-center py-20">
                    <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">No appointments found</h3>
                    <p className="text-slate-500">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Reference</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Patient</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Doctor</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Schedule</th>
                                <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAppointments.map((apt) => (
                                <tr key={apt.appointmentId} className="hover:bg-white/80 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-xs text-primary-600 font-bold">{apt.appointmentId.split('-').pop()}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">Full ID: {apt.appointmentId}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{apt.patient?.firstName} {apt.patient?.lastName}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">{apt.patient?.userId}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}</div>
                                        <div className="text-[10px] text-primary-500 font-bold uppercase">{apt.doctor?.specialty}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> {apt.date}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" /> {apt.timeSlot}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(apt.status)}`}>
                                            {apt.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminAppointmentsTab;
