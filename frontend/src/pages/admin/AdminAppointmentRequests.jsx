import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, FileText, Activity } from 'lucide-react';
import appointmentApi from '../../api/appointmentApi';
import apiClient from '../../api/client';

const AdminAppointmentRequests = ({ appointments, loading, refreshAppointments }) => {
    const [doctors, setDoctors] = useState([]);
    const [processingId, setProcessingId] = useState(null);
    const [error, setError] = useState(null);

    // Modal state
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    // Approval form state
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [availableSlots, setAvailableSlots] = useState(null);

    // Rejection form state
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
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

    const openApproveModal = (apt) => {
        setSelectedAppointment(apt);
        setSelectedDoctor(apt.doctorId || '');
        setSelectedDate(apt.date || '');
        setSelectedSlot(apt.timeSlot || '');
        setIsApproveOpen(true);
    };

    const openRejectModal = (apt) => {
        setSelectedAppointment(apt);
        setRejectionReason('');
        setIsRejectOpen(true);
    };

    const handleApprove = async (e) => {
        e.preventDefault();
        setProcessingId(selectedAppointment.appointmentId);
        setError(null);
        try {
            await appointmentApi.approveAppointment(selectedAppointment.appointmentId, {
                doctorId: selectedDoctor,
                date: selectedDate,
                timeSlot: selectedSlot
            });
            setIsApproveOpen(false);
            refreshAppointments();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve appointment');
            setProcessingId(null);
        }
    };

    const handleReject = async (e) => {
        e.preventDefault();
        setProcessingId(selectedAppointment.appointmentId);
        setError(null);
        try {
            await appointmentApi.rejectAppointment(selectedAppointment.appointmentId, {
                reason: rejectionReason
            });
            setIsRejectOpen(false);
            refreshAppointments();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject appointment');
            setProcessingId(null);
        }
    };

    // Filter to only show pending requests initially, or allow filtering
    const pendingRequests = appointments.filter(a => a.status === 'PENDING_ADMIN_APPROVAL');

    return (
        <div className="tab-content">
            <div className="glass-card mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-md">
                        <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-heading font-bold text-slate-900">Appointment Requests</h2>
                        <p className="text-sm text-slate-500">Review, assign doctors, and confirm patient appointments.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12 text-slate-500">
                        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                ) : pendingRequests.length === 0 ? (
                    <div className="text-center py-12 glass-card-l3 opacity-70">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400 opacity-50" />
                        <h3 className="font-bold text-slate-700">All Caught Up!</h3>
                        <p className="text-sm text-slate-500">There are no pending appointment requests to review.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {pendingRequests.map(apt => (
                            <div key={apt.appointmentId} className="glass-card border-l-4 border-orange-400 p-4 transition-all hover:shadow-md">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="badge badge-lab text-orange-700 bg-orange-100 border-orange-200 uppercase text-[10px]">
                                                Review Needed
                                            </span>
                                            <span className="text-xs font-mono text-slate-400">ID: {apt.appointmentId.split('-').pop()}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            <User className="w-4 h-4 text-slate-400" />
                                            {apt.patient?.firstName} {apt.patient?.lastName}
                                        </h3>
                                        <div className="flex flex-col sm:flex-row gap-2 mt-2">
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 w-fit">
                                                <Calendar className="w-4 h-4 text-indigo-500" />
                                                {apt.date}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 w-fit">
                                                <Activity className="w-4 h-4 text-indigo-500" />
                                                Doctor Preferences: {apt.doctor ? `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}` : 'Any Available'}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100">
                                            <strong>Reason:</strong> {apt.reason}
                                        </p>
                                    </div>
                                    <div className="flex flex-row md:flex-col justify-end gap-2 md:w-32">
                                        <button
                                            onClick={() => openApproveModal(apt)}
                                            className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Approve
                                        </button>
                                        <button
                                            onClick={() => openRejectModal(apt)}
                                            className="flex-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg border border-rose-200 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <XCircle className="w-4 h-4" /> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Approve Modal */}
            {isApproveOpen && selectedAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
                        <button onClick={() => setIsApproveOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <XCircle className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Approve and Assign</h2>
                        <p className="text-sm text-slate-500 mb-6">Assign a doctor and confirm the date and time slot.</p>

                        {error && (
                            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleApprove} className="space-y-4">
                            <div>
                                <label className="label">Assign Doctor</label>
                                <select
                                    className="input-field"
                                    required
                                    value={selectedDoctor}
                                    onChange={(e) => setSelectedDoctor(e.target.value)}
                                >
                                    <option value="">-- Select a Doctor --</option>
                                    {doctors.map(doc => (
                                        <option key={doc.userId} value={doc.userId}>
                                            Dr. {doc.firstName} {doc.lastName} ({doc.specialty || 'General'})
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
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </div>

                            {selectedDoctor && selectedDate && (
                                <div>
                                    <label className="label">Time Slot</label>
                                    {!availableSlots ? (
                                        <div className="p-2 text-sm text-slate-500">Loading...</div>
                                    ) : availableSlots.length === 0 ? (
                                        <div className="p-2 text-sm text-rose-500 font-medium">No slots available</div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {availableSlots.map(slot => (
                                                <button
                                                    key={slot} type="button"
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`py-2 px-1 text-sm rounded-lg border transition-all ${selectedSlot === slot
                                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold shadow-sm'
                                                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                                                        }`}
                                                >
                                                    {slot}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={processingId || !selectedDoctor || !selectedDate || !selectedSlot}
                                className="btn-primary w-full mt-6"
                            >
                                {processingId ? 'Approving...' : 'Confirm Appointment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {isRejectOpen && selectedAppointment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
                        <button onClick={() => setIsRejectOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <XCircle className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Reject Request</h2>
                        <p className="text-sm text-slate-500 mb-6">Provide a reason for rejecting this appointment request.</p>

                        {error && (
                            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleReject} className="space-y-4">
                            <div>
                                <label className="label">Rejection Reason</label>
                                <textarea
                                    className="input-field"
                                    rows="3"
                                    required
                                    placeholder="E.g., Doctor unavailable, schedule completely full, etc."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={processingId || !rejectionReason.trim()}
                                className="w-full bg-rose-600 hover:bg-rose-700 px-4 py-2 text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] hover:-translate-y-0.5"
                            >
                                {processingId ? 'Rejecting...' : 'Reject Appointment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAppointmentRequests;
