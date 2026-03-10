import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, Clock, User, FileText, CheckCircle, XCircle, Printer, ChevronLeft, ChevronRight, TrendingUp, Target } from 'lucide-react';
import appointmentApi from '../../api/appointmentApi';
import html2pdf from 'html2pdf.js';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const DoctorAppointmentsTab = () => {
    const [appointments, setAppointments] = useState([]);
    const [monthAppointments, setMonthAppointments] = useState([]); // To show dots on calendar
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // Modal State
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const data = await appointmentApi.listAppointments({ date: filterDate });
            setAppointments(data.appointments || []);
        } catch (err) {
            console.error('Failed to load appointments', err);
        } finally {
            setLoading(false);
        }
    }, [filterDate]);

    const fetchMonthAppointments = useCallback(async () => {
        try {
            // Simplified: Fetch all for the month (or just rely on the API if it supports ranges)
            // For now, let's just fetch for the current year/month
            // Note: Our current API might not support ranges perfectly, so we just show dots for loaded ones or fetch a larger set
            // For demo purposes, we'll fetch for the whole month if the API allowed or just mock it based on loaded data
        } catch (err) {
            console.error('Failed to load month appointments', err);
        }
    }, [currentMonth, currentYear]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // Calendar logic
    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const goToPrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentYear(prev => prev - 1);
            setCurrentMonth(11);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentYear(prev => prev + 1);
            setCurrentMonth(0);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    const handleDateSelect = (day) => {
        const selectedDate = new Date(currentYear, currentMonth, day);
        // Format as YYYY-MM-DD local
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const date = String(selectedDate.getDate()).padStart(2, '0');
        setFilterDate(`${year}-${month}-${date}`);
    };

    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);
    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const isSelected = (day) => {
        const d = new Date(currentYear, currentMonth, day);
        const filterD = new Date(filterDate);
        return d.toDateString() === filterD.toDateString();
    };

    const isToday = (day) => {
        const d = new Date(currentYear, currentMonth, day);
        const today = new Date();
        return d.toDateString() === today.toDateString();
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
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>Doctor's Calendar</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">"Precision in scheduling, excellence in care."</p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2.5 px-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                    <CalendarIcon className="w-5 h-5 text-teal-600" />
                    <input
                        type="date"
                        className="bg-transparent border-none focus:outline-none text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
            </div>

            {/* NEW VISUAL CALENDAR */}
            <div className="grid lg:grid-cols-12 gap-8 mb-10">
                <div className="lg:col-span-5">
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.04)] h-full">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                {MONTHS[currentMonth]} <span className="text-teal-600 opacity-40">{currentYear}</span>
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={goToPrevMonth} className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-100 dark:border-slate-800">
                                    <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </button>
                                <button onClick={goToNextMonth} className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-100 dark:border-slate-800">
                                    <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-y-4 text-center">
                            {DAYS_OF_WEEK.map(day => (
                                <div key={day} className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{day}</div>
                            ))}

                            {blanks.map((_, i) => (
                                <div key={`blank-${i}`} className="h-12 w-full" />
                            ))}

                            {days.map(day => (
                                <button
                                    key={day}
                                    onClick={() => handleDateSelect(day)}
                                    className={`relative group h-12 w-full flex items-center justify-center transition-all duration-300`}
                                >
                                    <div className={`
                                        w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all relative z-10
                                        ${isSelected(day)
                                            ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20 scale-110'
                                            : isToday(day)
                                                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 border border-teal-200 dark:border-teal-800'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }
                                    `}>
                                        {day}
                                    </div>

                                    {/* Medical Indicator Dot — Mocking appointments for these days */}
                                    {(day % 4 === 0 || day === 5 || day === 12 || day === 21) && !isSelected(day) && (
                                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-teal-500 rounded-full z-20 shadow-[0_0_8px_rgba(20,184,166,0.6)]"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-7">
                    <div className="bg-[#0e503f] rounded-[32px] p-8 text-white h-full relative overflow-hidden shadow-xl border border-teal-800/20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-teal-400/20 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-teal-300" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-teal-300/60 mb-1">On Service For</h4>
                                    <p className="text-2xl font-black">{new Date(filterDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>

                            <div className="flex-1 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#1a6552] p-5 rounded-2xl border border-teal-700/30">
                                        <p className="text-[10px] font-bold uppercase text-teal-300/50 mb-2">Daily Goal</p>
                                        <div className="flex items-end justify-between">
                                            <p className="text-3xl font-black">12 <span className="text-sm font-medium opacity-40">Consults</span></p>
                                            <TrendingUp className="w-5 h-5 text-teal-300" />
                                        </div>
                                    </div>
                                    <div className="bg-[#1a6552] p-5 rounded-2xl border border-teal-700/30">
                                        <p className="text-[10px] font-bold uppercase text-teal-300/50 mb-2">Efficiency</p>
                                        <div className="flex items-end justify-between">
                                            <p className="text-3xl font-black">94<span className="text-sm font-medium opacity-40">%</span></p>
                                            <Target className="w-5 h-5 text-teal-300" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#1a6552] p-5 rounded-2xl border border-teal-700/30 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-teal-300" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold leading-tight">Emergency Ready</p>
                                            <p className="text-[10px] text-teal-300/60 mt-1 uppercase font-bold tracking-wide">Backup slots assigned</p>
                                        </div>
                                    </div>
                                    <button className="text-xs font-bold text-[#8bd8bd] hover:underline">View Shift Details</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-10">
                <h3 className="font-heading font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3 text-xl tracking-tight">
                    <Clock className="w-6 h-6 text-teal-600" /> Today's Roster
                </h3>

                {loading ? (
                    <div className="glass-card text-center py-16">
                        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400">Loading schedule...</p>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="glass-card text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 dark:bg-blue-900/20 shadow-inner flex items-center justify-center">
                            <CalendarIcon className="w-10 h-10 text-blue-300 dark:text-blue-500 animate-float" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">No Appointments</h3>
                        <p className="text-slate-500 dark:text-slate-400">You have no appointments scheduled for {new Date(filterDate).toLocaleDateString()}.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div>
                            {activeAppointments.length === 0 ? (
                                <div className="text-center py-10 opacity-60 italic text-slate-400">No scheduled consultations for this slot.</div>
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
                                                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-md">
                                                            <Clock className="w-4 h-4 text-blue-600" /> {apt.timeSlot}
                                                        </div>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                        <User className="w-4 h-4 text-slate-400" />
                                                        {apt.patient?.firstName} {apt.patient?.lastName}
                                                    </h4>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mb-3">ID: {apt.patient?.userId}</p>

                                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-[14px] border border-slate-100 dark:border-slate-800 mb-3">
                                                        <p className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                                            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                                                            <span><strong className="text-slate-900 dark:text-white">Reason:</strong> {apt.reason}</span>
                                                        </p>
                                                    </div>

                                                    <button
                                                        onClick={() => handleOpenModal(apt)}
                                                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-2 rounded-lg transition-colors border border-blue-200 dark:border-blue-800/50 w-full flex items-center justify-center gap-1"
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
                                <h3 className="font-heading font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-slate-400" /> Completed / Cancelled
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {pastAppointments.map((apt) => (
                                        <div key={apt.appointmentId} className="glass-card-l3 p-4 opacity-70">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{apt.timeSlot}</span>
                                                    <h4 className="font-semibold text-slate-900 dark:text-white">{apt.patient?.firstName} {apt.patient?.lastName}</h4>
                                                </div>
                                                <span className={`badge text-[10px] py-0.5 ${getStatusColor(apt.status)}`}>{apt.status}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{apt.reason}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Appointment Details Modal */}
            {isModalOpen && selectedAppointment && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
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
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3 rounded-b-2xl">
                            <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
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
