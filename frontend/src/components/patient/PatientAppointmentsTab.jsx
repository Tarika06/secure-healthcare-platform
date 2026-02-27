import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, User, FileText, CheckCircle, XCircle, AlertCircle, CalendarDays, Download, Printer } from 'lucide-react';
import appointmentApi from '../../api/appointmentApi';
import apiClient from '../../api/client';
import html2pdf from 'html2pdf.js';

const PatientAppointmentsTab = () => {
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [error, setError] = useState(null);

    // Booking Form State
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [reason, setReason] = useState('');
    const [availableSlots, setAvailableSlots] = useState(null);

    // Modal State
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchAppointments();
        fetchDoctors();
    }, []);

    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            fetchAvailableSlots(selectedDoctor, selectedDate);
        } else {
            setAvailableSlots(null);
            setSelectedSlot('');
        }
    }, [selectedDoctor, selectedDate]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const data = await appointmentApi.listAppointments();
            setAppointments(data.appointments || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const response = await apiClient.get('/records/doctors/list');
            setDoctors(response.data.doctors || []);
        } catch (err) {
            console.error('Error fetching doctors:', err);
        }
    };

    const fetchAvailableSlots = async (doctorId, date) => {
        try {
            const data = await appointmentApi.getAvailableSlots(doctorId, date);
            setAvailableSlots(data.availableSlots || []);
        } catch (err) {
            console.error('Error fetching slots:', err);
            setAvailableSlots([]);
        }
    };

    const handleRequestAppointment = async (e) => {
        e.preventDefault();
        setBookingLoading(true);
        setError(null);
        try {
            await appointmentApi.requestAppointment({
                doctorId: selectedDoctor || null,
                date: selectedDate,
                timeSlot: selectedSlot || null,
                reason
            });
            alert('Appointment requested successfully and is pending admin approval!');
            // Reset form
            setSelectedDoctor('');
            setSelectedDate('');
            setSelectedSlot('');
            setReason('');
            fetchAppointments(); // Refresh list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to book appointment');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleCancelAppointment = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
        try {
            await appointmentApi.cancelAppointment(id);
            alert('Appointment cancelled successfully.');
            fetchAppointments();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel appointment');
        }
    };

    const handleDownloadQR = (qrCode, appointmentId) => {
        if (!qrCode) return;
        const a = document.createElement('a');
        a.href = qrCode;
        a.download = `hospital-entry-QR-${appointmentId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
            filename: `Appointment-Order-${selectedAppointment?.appointmentId}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Add a temporary class to hide buttons during export
        element.classList.add('exporting-pdf');
        html2pdf().from(element).set(opt).save().then(() => {
            element.classList.remove('exporting-pdf');
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING_ADMIN_APPROVAL': return 'badge-lab text-orange-700 bg-orange-100 border-orange-200'; // Orange
            case 'CONFIRMED': return 'badge-prescription'; // Teal/Emerald
            case 'VERIFIED': return 'badge-lab'; // Blue
            case 'COMPLETED': return 'badge-general'; // Slate
            case 'CANCELLED':
            case 'REJECTED':
            case 'NO_SHOW': return 'badge-vitals'; // Rose/Red
            default: return 'badge-general';
        }
    };

    // Sort appointments: upcoming first, then past
    const sortedAppointments = [...appointments].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.timeSlot}`);
        const dateB = new Date(`${b.date}T${b.timeSlot}`);
        return dateB - dateA; // Descending for full list, typically you'd split them
    });

    const upcomingAppointments = sortedAppointments.filter(a => a.status === 'CONFIRMED' || a.status === 'VERIFIED' || a.status === 'PENDING_ADMIN_APPROVAL');
    const pastAppointments = sortedAppointments.filter(a => ['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW', 'BOOKED'].includes(a.status));

    return (
        <div className="tab-content">
            <div className="mb-6">
                <h2 className="text-2xl font-heading font-bold text-slate-900">Hospital Appointments</h2>
                <p className="text-slate-500 mt-1">Request consultations from your preferred doctors</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Booking Form */}
                <div className="lg:col-span-1">
                    <div className="glass-card mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-md">
                                <CalendarDays className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Request Appointment</h3>
                        </div>

                        {error && (
                            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleRequestAppointment} className="space-y-4">
                            <div>
                                <label className="label">Select Doctor (Optional)</label>
                                <select
                                    className="input-field"
                                    value={selectedDoctor}
                                    onChange={(e) => setSelectedDoctor(e.target.value)}
                                >
                                    <option value="">-- Any Available Doctor --</option>
                                    {doctors.map(doc => (
                                        <option key={doc.userId} value={doc.userId}>
                                            Dr. {doc.firstName} {doc.lastName} - {doc.specialty || 'General'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label">Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    required
                                    min={new Date().toISOString().split('T')[0]} // Cannot book in the past
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </div>

                            {selectedDoctor && selectedDate && (
                                <div>
                                    <label className="label flex justify-between">
                                        Time Slot
                                        {availableSlots && <span className="text-xs font-normal text-slate-500">{availableSlots.length} available</span>}
                                    </label>

                                    {!availableSlots ? (
                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-500">
                                            Loading slots...
                                        </div>
                                    ) : availableSlots.length === 0 ? (
                                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center text-sm text-rose-600 font-medium">
                                            No slots available for this date.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {availableSlots.map(slot => (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`py-2 px-1 text-sm rounded-lg border transition-all ${selectedSlot === slot
                                                        ? 'bg-teal-50 border-teal-500 text-teal-700 font-bold shadow-sm'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                                                        }`}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="label text-xs text-slate-500 mb-2">
                                    <AlertCircle className="inline w-3 h-3 mr-1" />
                                    Time slot is optional. Admin will assign an available slot if left blank.
                                </label>
                            </div>

                            <div>
                                <label className="label">Reason for Visit</label>
                                <textarea
                                    className="input-field"
                                    required
                                    rows="2"
                                    placeholder="Briefly describe your symptoms..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={bookingLoading || !selectedDate || !reason}
                                className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
                            >
                                {bookingLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <><Calendar className="w-4 h-4" /> Request Appointment</>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Appointment List */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="glass-card text-center py-16">
                            <div className="w-10 h-10 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-slate-500">Loading appointments...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Upcoming Appointments */}
                            <div>
                                <h3 className="font-heading font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-teal-600" /> Upcoming Appointments
                                </h3>

                                {upcomingAppointments.length === 0 ? (
                                    <div className="glass-card text-center py-8 opacity-80">
                                        <p className="text-slate-500 text-sm">You have no upcoming appointments.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {upcomingAppointments.map((apt) => (
                                            <div key={apt.appointmentId} className="glass-card border-l-4 border-teal-400 relative overflow-hidden group">
                                                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className={`badge ${getStatusColor(apt.status)}`}>{apt.status}</span>
                                                            <span className="text-xs font-mono text-slate-500">ID: {apt.appointmentId.split('-').pop()}</span>
                                                        </div>
                                                        <h4 className="text-lg font-bold text-slate-900">
                                                            {apt.doctorId ? `Dr. ${apt.doctor?.firstName || ''} ${apt.doctor?.lastName || ''}` : 'Doctor Pending Assignment'}
                                                        </h4>
                                                        <p className="text-sm text-slate-600 mb-2">{apt.doctor?.specialty || 'General Practitioner'}</p>

                                                        <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-700 bg-slate-50 inline-flex p-2 rounded-lg border border-slate-100">
                                                            <div className="flex items-center gap-1.5 px-2">
                                                                <Calendar className="w-4 h-4 text-teal-600" /> {new Date(apt.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </div>
                                                            <div className="w-px h-4 bg-slate-300 self-center"></div>
                                                            <div className="flex items-center gap-1.5 px-2">
                                                                <Clock className="w-4 h-4 text-teal-600" /> {apt.timeSlot || 'Pending Time'}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-slate-500 mt-3 flex items-start gap-2">
                                                            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                                                            <span><strong className="text-slate-700">Reason:</strong> {apt.reason}</span>
                                                        </p>
                                                    </div>

                                                    {/* QR Code and Actions */}
                                                    <div className="flex flex-col items-center justify-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-4 min-w-[140px]">
                                                        {apt.qrCode ? (
                                                            <div className="text-center">
                                                                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm inline-block mb-2 group-hover:scale-105 transition-transform duration-300 cursor-pointer" onClick={() => handleDownloadQR(apt.qrCode, apt.appointmentId)}>
                                                                    <img src={apt.qrCode} alt="Entry QR" className="w-24 h-24 object-contain" />
                                                                </div>
                                                                <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wide">Hospital Entry QR</p>
                                                                <button onClick={() => handleDownloadQR(apt.qrCode, apt.appointmentId)} className="text-xs text-slate-500 hover:text-teal-600 mt-1 flex items-center justify-center gap-1 w-full">
                                                                    <Download className="w-3 h-3" /> Download
                                                                </button>
                                                                {apt.qrToken && (
                                                                    <button
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(apt.qrToken);
                                                                            alert('Token copied to clipboard! Switch to the Nurse Dashboard to paste and verify it.');
                                                                        }}
                                                                        className="mt-2 w-full text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1.5 rounded-lg transition-colors"
                                                                    >
                                                                        Copy Test Token
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200 w-full mb-2">
                                                                <p className="text-xs text-slate-400 font-medium">QR not generated</p>
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={() => handleOpenModal(apt)}
                                                            className="text-xs font-semibold text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-lg transition-colors border border-teal-200 w-full flex items-center justify-center gap-1 mb-2"
                                                        >
                                                            <FileText className="w-3 h-3" /> View Details
                                                        </button>

                                                        {(apt.status === 'CONFIRMED' || apt.status === 'PENDING_ADMIN_APPROVAL') && (
                                                            <button
                                                                onClick={() => handleCancelAppointment(apt.appointmentId)}
                                                                className="text-xs font-semibold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-rose-200 mt-auto w-full"
                                                            >
                                                                Cancel Request
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Past Appointments */}
                            {pastAppointments.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="font-heading font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-slate-400" /> Past Appointments
                                    </h3>
                                    <div className="grid xl:grid-cols-2 gap-4">
                                        {pastAppointments.map((apt) => (
                                            <div key={apt.appointmentId} className="glass-card-l3 p-4 opacity-75 hover:opacity-100 transition-opacity">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-slate-900">{apt.doctor ? `Dr. ${apt.doctor.firstName}` : 'Doctor N/A'}</h4>
                                                    <span className={`badge text-[10px] py-0.5 ${getStatusColor(apt.status)}`}>{apt.status}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 flex items-center gap-2 font-medium mb-1.5">
                                                    <Calendar className="w-3.5 h-3.5" /> {apt.date} • {apt.timeSlot || 'N/A'}
                                                </p>
                                                {apt.rejectionReason && (
                                                    <p className="text-xs text-rose-500 mb-1"><strong>Reason:</strong> {apt.rejectionReason}</p>
                                                )}
                                                <p className="text-xs text-slate-500 truncate">{apt.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Appointment Details Modal */}
            {isModalOpen && selectedAppointment && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-teal-600" /> Appointment Order
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body (Printable Area) */}
                        <div id="appointment-pdf-content" className="p-8 overflow-y-auto flex-1 bg-[#094b46] text-white">
                            <div className="text-center mb-6 pb-6 border-b border-teal-800">
                                <h2 className="text-2xl font-bold tracking-tight text-white">SecureCare+ Hospital</h2>
                                <p className="text-teal-200 text-sm mt-1">Official Appointment Confirmation</p>
                            </div>

                            <div className="space-y-4">
                                {/* Doctor Card (Top Section) */}
                                <div className="bg-[#125c56] p-5 rounded-2xl border border-teal-700/50 flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-teal-400/20 flex items-center justify-center text-xl font-bold text-teal-100">
                                        {selectedAppointment.doctor?.firstName?.[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-white">Dr. {selectedAppointment.doctor?.firstName} {selectedAppointment.doctor?.lastName}</p>
                                        <p className="text-sm text-teal-200">{selectedAppointment.doctor?.specialty || 'General Practitioner'}</p>
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
                                            {selectedAppointment.status}
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
                                    <p className="text-[10px] uppercase font-bold text-teal-300 tracking-wider mb-2">Reason for Visit</p>
                                    <p className="text-sm font-medium text-teal-50">
                                        {selectedAppointment.reason}
                                    </p>
                                </div>

                                {/* QR Code (only visible if exists) */}
                                {selectedAppointment.qrCode && (
                                    <div className="bg-[#125c56] p-5 rounded-2xl border border-teal-700/50 text-center mt-2">
                                        <p className="text-[10px] uppercase font-bold text-teal-300 tracking-wider mb-3">Hospital Entry QR Code</p>
                                        <div className="bg-white p-2 rounded-xl inline-block shadow-lg">
                                            <img src={selectedAppointment.qrCode} alt="QR Code" className="w-32 h-32 object-contain" />
                                        </div>
                                        <p className="text-xs text-teal-200 mt-3 max-w-xs mx-auto">Please present this QR code at the reception desk upon arrival.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                            <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors">
                                Close
                            </button>
                            <button onClick={handleDownloadPDF} className="btn-primary flex items-center gap-2 px-6 py-2">
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

export default PatientAppointmentsTab;
