import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, User, FileText, CheckCircle, XCircle, Printer } from 'lucide-react';
import appointmentApi from '../../api/appointmentApi';
import html2pdf from 'html2pdf.js';

const DoctorAppointmentsTab = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Default to today

    // Modal State
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchAppointments();
    }, [filterDate]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const data = await appointmentApi.listAppointments({ date: filterDate });
            setAppointments(data.appointments || []);
        } catch (err) {
            console.error('Failed to load appointments', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'BOOKED': return 'badge-prescription'; // Teal
            case 'VERIFIED': return 'badge-lab'; // Blue (Arrived/Verified at reception)
            case 'COMPLETED': return 'badge-general'; // Slate
            case 'CANCELLED':
            case 'NO_SHOW': return 'badge-vitals'; // Rose
            default: return 'badge-general';
        }
    };

    const handleOpenModal = (appointment) => {
        setSelectedAppointment(appointment);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAppointment(null);
    };

    const handleDownloadPDF = () => {
        const element = document.getElementById('appointment-pdf-content');
        if (!element) return;

        const opt = {
            margin: 0.5,
            filename: `Appointment-Details-${selectedAppointment?.appointmentId}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        element.classList.add('exporting-pdf');
        html2pdf().from(element).set(opt).save().then(() => {
            element.classList.remove('exporting-pdf');
        });
    };

    // Sort by time
    const sortedAppointments = [...appointments].sort((a, b) => {
        return a.timeSlot.localeCompare(b.timeSlot);
    });

    const activeAppointments = sortedAppointments.filter(a => ['BOOKED', 'VERIFIED'].includes(a.status));
    const pastAppointments = sortedAppointments.filter(a => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status));

    return (
        <div className="tab-content">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-heading font-bold text-slate-900">My Schedule</h2>
                    <p className="text-slate-500 mt-1">Manage your daily appointments and consultations</p>
                </div>

                <div className="flex items-center gap-3 glass-card py-2 px-4 shadow-sm w-fit">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <input
                        type="date"
                        className="bg-transparent border-none focus:outline-none text-slate-700 font-medium cursor-pointer"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="glass-card text-center py-16">
                    <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-500">Loading schedule...</p>
                </div>
            ) : appointments.length === 0 ? (
                <div className="glass-card text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                        <Calendar className="w-10 h-10 text-blue-300 animate-float" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">No Appointments</h3>
                    <p className="text-slate-500">You have no appointments scheduled for {new Date(filterDate).toLocaleDateString()}.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Active/Upcoming for the day */}
                    <div>
                        <h3 className="font-heading font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" /> Today's Roster
                        </h3>

                        {activeAppointments.length === 0 ? (
                            <p className="text-slate-500 italic px-2">No pending appointments for this date.</p>
                        ) : (
                            <div className="grid gap-4">
                                {activeAppointments.map((apt, idx) => (
                                    <div key={apt.appointmentId} className={`glass-card border-l-4 ${apt.status === 'VERIFIED' ? 'border-blue-500' : 'border-emerald-400'} stagger-item`} style={{ animationDelay: `${idx * 50}ms` }}>
                                        <div className="flex flex-col sm:flex-row gap-4 justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`badge ${getStatusColor(apt.status)}`}>
                                                        {apt.status === 'VERIFIED' ? 'PATIENT WAITING' : apt.status}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-slate-700 font-bold bg-slate-100 px-2.5 py-1 rounded-md">
                                                        <Clock className="w-4 h-4 text-blue-600" /> {apt.timeSlot}
                                                    </div>
                                                </div>
                                                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                    {apt.patient?.firstName} {apt.patient?.lastName}
                                                </h4>
                                                <p className="text-sm text-slate-500 font-mono mb-3">ID: {apt.patient?.userId}</p>

                                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                                                    <p className="text-sm text-slate-700 flex items-start gap-2">
                                                        <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                                                        <span><strong className="text-slate-900">Reason:</strong> {apt.reason}</span>
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => handleOpenModal(apt)}
                                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors border border-blue-200 w-full flex items-center justify-center gap-1"
                                                >
                                                    <FileText className="w-3 h-3" /> View Full Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Past/Completed for the day */}
                    {pastAppointments.length > 0 && (
                        <div>
                            <h3 className="font-heading font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-slate-400" /> Completed / Cancelled
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {pastAppointments.map((apt) => (
                                    <div key={apt.appointmentId} className="glass-card-l3 p-4 opacity-70">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-700">{apt.timeSlot}</span>
                                                <h4 className="font-semibold text-slate-900">{apt.patient?.firstName} {apt.patient?.lastName}</h4>
                                            </div>
                                            <span className={`badge text-[10px] py-0.5 ${getStatusColor(apt.status)}`}>{apt.status}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate">{apt.reason}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Appointment Details Modal */}
            {isModalOpen && selectedAppointment && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" /> Appointment Details
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body (Printable Area) */}
                        <div id="appointment-pdf-content" className="p-8 overflow-y-auto flex-1 bg-[#094b46] text-white">
                            <div className="text-center mb-6 pb-6 border-b border-teal-800">
                                <h2 className="text-2xl font-bold tracking-tight text-white">SecureCare+ Hospital</h2>
                                <p className="text-teal-200 text-sm mt-1">Official Appointment Record</p>
                            </div>

                            <div className="space-y-4">
                                {/* Patient Card (Top Section) */}
                                <div className="bg-[#125c56] p-5 rounded-2xl border border-teal-700/50 flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-teal-400/20 flex items-center justify-center text-xl font-bold text-teal-100">
                                        {selectedAppointment.patient?.firstName?.[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-white">{selectedAppointment.patient?.firstName} {selectedAppointment.patient?.lastName}</p>
                                        <p className="text-sm text-teal-200">Patient ID: {selectedAppointment.patient?.userId}</p>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#125c56] p-4 rounded-2xl border border-teal-700/50">
                                        <p className="text-[10px] uppercase font-bold text-teal-300 tracking-wider mb-1">Appointment ID</p>
                                        <p className="font-mono text-sm font-bold text-white break-all">{selectedAppointment.appointmentId}</p>

                                        <p className="text-[10px] uppercase font-bold text-teal-300 tracking-wider mt-4 mb-1">Status</p>
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${selectedAppointment.status === 'BOOKED' ? 'bg-teal-400/20 text-teal-100' :
                                            selectedAppointment.status === 'VERIFIED' ? 'bg-blue-400/20 text-blue-100' :
                                                'bg-slate-400/20 text-slate-100'
                                            }`}>
                                            {selectedAppointment.status === 'VERIFIED' ? 'PATIENT WAITING' : selectedAppointment.status}
                                        </span>
                                    </div>

                                    <div className="bg-[#125c56] p-4 rounded-2xl border border-teal-700/50">
                                        <p className="text-[10px] uppercase font-bold text-teal-300 tracking-wider mb-1">Date</p>
                                        <p className="text-lg font-bold text-white flex items-center gap-2">
                                            {selectedAppointment.date}
                                        </p>
                                        <p className="text-[10px] uppercase font-bold text-teal-300 tracking-wider mt-4 mb-1">Time Slot</p>
                                        <p className="text-sm font-bold text-white flex items-center gap-2">
                                            {selectedAppointment.timeSlot}
                                        </p>
                                    </div>
                                </div>

                                {/* Reason */}
                                <div className="bg-[#125c56] p-4 rounded-2xl border border-teal-700/50">
                                    <p className="text-[10px] uppercase font-bold text-teal-300 tracking-wider mb-2">Patient's Stated Reason</p>
                                    <p className="text-sm font-medium text-teal-50">
                                        {selectedAppointment.reason}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                            <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors">
                                Close
                            </button>
                            <button onClick={handleDownloadPDF} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6 py-2 rounded-xl transition-all shadow-sm">
                                <Printer className="w-4 h-4" /> Download as PDF
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DoctorAppointmentsTab;
