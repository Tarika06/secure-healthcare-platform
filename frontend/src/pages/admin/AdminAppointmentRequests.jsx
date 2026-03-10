import React, { useState, useEffect } from 'react';
import { MailCheck, CheckCircle, XCircle, Clock, Calendar, AlertCircle } from 'lucide-react';
import appointmentApi from '../../api/appointmentApi';
import apiClient from '../../api/client';
import Modal from '../../components/Modal';

const AdminAppointmentRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState([]);

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);

    // Approval Form State
    const [approveForm, setApproveForm] = useState({
        doctorId: '',
        date: '',
        timeSlot: ''
    });
    const [availableSlots, setAvailableSlots] = useState(null);
    const [submittingData, setSubmittingData] = useState(false);

    // Rejection Form State
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchRequests();
        fetchDoctors();
    }, []);

    useEffect(() => {
        if (approveForm.doctorId && approveForm.date) {
            fetchSlots(approveForm.doctorId, approveForm.date);
        } else {
            setAvailableSlots(null);
            setApproveForm(prev => ({ ...prev, timeSlot: '' }));
        }
    }, [approveForm.doctorId, approveForm.date]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await appointmentApi.getAppointments({ status: 'PENDING_ADMIN_APPROVAL' });
            setRequests(res.appointments || []);
        } catch (err) {
            console.error('Failed to fetch requests', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const res = await apiClient.get('/doctor/list');
            setDoctors(res.data.doctors || []);
        } catch (err) {
            console.error('Failed to fetch doctors', err);
        }
    };

    const fetchSlots = async (doctorId, date) => {
        try {
            const res = await appointmentApi.getAvailableSlots(doctorId, date);
            setAvailableSlots(res.availableSlots || []);
        } catch (err) {
            setAvailableSlots([]);
        }
    };

    const openApprove = (req) => {
        setSelectedRequest(req);
        // Pre-fill if patient had preferences
        setApproveForm({
            doctorId: req.doctorId || '',
            date: req.date || '',
            timeSlot: req.timeSlot || ''
        });
        setIsApproveOpen(true);
    };

    const openReject = (req) => {
        setSelectedRequest(req);
        setRejectReason('');
        setIsRejectOpen(true);
    };

    const handleApprove = async (e) => {
        e.preventDefault();
        setSubmittingData(true);
        try {
            await appointmentApi.approveAppointment(selectedRequest.appointmentId, approveForm);
            alert('Appointment approved and assigned successfully.');
            setIsApproveOpen(false);
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to approve');
        } finally {
            setSubmittingData(false);
        }
    };

    const handleReject = async (e) => {
        e.preventDefault();
        setSubmittingData(true);
        try {
            await appointmentApi.rejectAppointment(selectedRequest.appointmentId, rejectReason);
            alert('Appointment rejected.');
            setIsRejectOpen(false);
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reject');
        } finally {
            setSubmittingData(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-20 animate-fade-in">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-slate-500">Loading requests...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-amber-500 pl-3">Appointment Requests</h2>
                    <p className="text-slate-500 mt-1 pl-4">Review, assign, and approve patient consultations.</p>
                </div>
                <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                    <MailCheck className="w-5 h-5" />
                    {requests.length} Pending
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="glass-card text-center py-24 border-dashed border-2">
                    <CheckCircle className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-emerald-700">All clear!</h3>
                    <p className="text-slate-500 mt-2">There are no pending appointment requests.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {requests.map(req => (
                        <div key={req.appointmentId} className="glass-card border-l-4 border-amber-400 hover:shadow-xl transition-shadow flex flex-col">
                            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{req.appointmentId.split('-').pop()}</p>
                                    <h4 className="font-bold text-slate-900 text-lg mt-1">{req.patient?.firstName} {req.patient?.lastName}</h4>
                                    <p className="text-xs text-slate-500">{req.patient?.email}</p>
                                </div>
                                <Clock className="w-6 h-6 text-amber-300" />
                            </div>

                            <div className="flex-1 space-y-3 mb-6">
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Requested Specifics</p>
                                    <div className="text-sm font-medium text-slate-700 space-y-1">
                                        <p><span className="text-slate-400">Date:</span> {req.date ? new Date(req.date).toLocaleDateString() : 'N/A'}</p>
                                        <p><span className="text-slate-400">Doctor:</span> {req.doctor ? `Dr. ${req.doctor.lastName}` : 'Any Available'}</p>
                                        <p><span className="text-slate-400">Time:</span> {req.timeSlot || 'Any Time'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Reason</p>
                                    <p className="text-sm text-slate-800 bg-white border border-slate-100 p-2 rounded-lg italic">&quot;{req.reason}&quot;</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-auto">
                                <button onClick={() => openReject(req)} className="btn-danger-outline py-2.5 text-xs font-bold w-full rounded-xl">REJECT</button>
                                <button onClick={() => openApprove(req)} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2.5 text-xs w-full rounded-xl shadow-md transition-all">APPROVE & ASSIGN</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Approve Modal */}
            <Modal isOpen={isApproveOpen} onClose={() => setIsApproveOpen(false)} title="Approve & Assign" icon={CheckCircle}>
                <form onSubmit={handleApprove} className="space-y-4">
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-amber-800 font-medium">You are assigning a doctor and confirming a time slot for <strong>{selectedRequest?.patient?.firstName} {selectedRequest?.patient?.lastName}</strong>.</p>
                        </div>
                    </div>

                    <div>
                        <label className="label">Assign Doctor <span className="text-red-500">*</span></label>
                        <select className="input-field" required value={approveForm.doctorId} onChange={e => setApproveForm(prev => ({ ...prev, doctorId: e.target.value }))}>
                            <option value="">-- Select Doctor --</option>
                            {doctors.map(d => <option key={d.userId} value={d.userId}>Dr. {d.firstName} {d.lastName} ({d.specialty})</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Date <span className="text-red-500">*</span></label>
                            <input type="date" className="input-field" required value={approveForm.date} min={new Date().toISOString().split('T')[0]} onChange={e => setApproveForm(prev => ({ ...prev, date: e.target.value }))} />
                        </div>
                        <div>
                            <label className="label">Time Slot <span className="text-red-500">*</span></label>
                            <select className="input-field" required disabled={!availableSlots} value={approveForm.timeSlot} onChange={e => setApproveForm(prev => ({ ...prev, timeSlot: e.target.value }))}>
                                <option value="">Select Time</option>
                                {availableSlots?.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {availableSlots && availableSlots.length === 0 && <p className="text-xs text-red-500 mt-1">No slots available</p>}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                        <button type="button" onClick={() => setIsApproveOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">CANCEL</button>
                        <button type="submit" disabled={submittingData || !approveForm.doctorId || !approveForm.date || !approveForm.timeSlot} className="flex-1 btn-primary py-3">CONFIRM & ASSIGN</button>
                    </div>
                </form>
            </Modal>

            {/* Reject Modal */}
            <Modal isOpen={isRejectOpen} onClose={() => setIsRejectOpen(false)} title="Reject Request" icon={XCircle}>
                <form onSubmit={handleReject} className="space-y-4">
                    <div>
                        <label className="label">Reason for Rejection <span className="text-red-500">*</span></label>
                        <textarea className="input-field" required rows="3" placeholder="Provide a reason to the patient..." value={rejectReason} onChange={e => setRejectReason(e.target.value)}></textarea>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                        <button type="button" onClick={() => setIsRejectOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">CANCEL</button>
                        <button type="submit" disabled={submittingData || !rejectReason} className="flex-1 btn-danger py-3">CONFIRM REJECTION</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminAppointmentRequests;
