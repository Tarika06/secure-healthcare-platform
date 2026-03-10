import React, { useState, useEffect, useCallback } from 'react';
import { Phone, PhoneIncoming, Video, Clock, FileText, CheckCircle, XCircle, AlertTriangle, User, Plus, Trash2, Download, Calendar, Sparkles } from 'lucide-react';
import { io } from 'socket.io-client';
import teleconsultationApi from '../../api/teleconsultationApi';
import VideoRoom from '../patient/VideoRoom';
import { useAuth } from '../../context/AuthContext';

/**
 * DoctorTeleconsultTab
 * 
 * Doctor-facing teleconsultation management:
 * - Incoming consultation requests (real-time via Socket.IO)
 * - Priority Queues (Triage-based sorting)
 * - Active video calls
 * - Post-call prescription form & follow-ups
 * - Consultation history with AI Summaries
 */

const DoctorTeleconsultTab = () => {
    const { user, token } = useAuth();
    const [view, setView] = useState('dashboard'); // dashboard | call | prescription | history
    const [pendingRequests, setPendingRequests] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    // Prescription form state
    const [prescriptionForm, setPrescriptionForm] = useState({
        diagnosis: '',
        additionalNotes: '',
        followUpRequired: false,
        followUpDate: '',
        followUpReason: '',
        medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });

    // Fetch pending requests with Smart Priority Sorting
    const fetchPending = useCallback(async () => {
        try {
            const data = await teleconsultationApi.getPendingConsultations();
            const sortedSessions = (data.sessions || []).sort((a, b) => {
                const painA = a.triage?.painLevel || 0;
                const painB = b.triage?.painLevel || 0;
                if (painB !== painA) return painB - painA; // Highest pain first
                return new Date(a.createdAt) - new Date(b.createdAt); // Oldest first
            });
            setPendingRequests(sortedSessions);
        } catch (err) {
            console.error('Error fetching pending:', err);
        }
    }, []);

    // Check for active sessions
    const checkActive = useCallback(async () => {
        try {
            const data = await teleconsultationApi.getActiveSessions();
            if (data.sessions && data.sessions.length > 0) {
                setActiveSession(data.sessions[0]);
                setView('call');
            }
        } catch (err) {
            console.error('Error checking active:', err);
        }
    }, []);

    useEffect(() => {
        fetchPending();
        checkActive();
    }, [fetchPending, checkActive]);

    // Real-time updates via Socket.IO
    useEffect(() => {
        if (!token) return;

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const serverUrl = apiUrl.replace('/api', '');

        const socket = io(serverUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        socket.on('CONSULTATION_REQUEST', ({ session }) => {
            setPendingRequests(prev => {
                const updated = [session, ...prev];
                return updated.sort((a, b) => {
                    const painA = a.triage?.painLevel || 0;
                    const painB = b.triage?.painLevel || 0;
                    if (painB !== painA) return painB - painA;
                    return new Date(a.createdAt) - new Date(b.createdAt);
                });
            });
        });

        // Re-fetch pending every 30 seconds as fallback
        const interval = setInterval(fetchPending, 30000);

        return () => {
            socket.disconnect();
            clearInterval(interval);
        };
    }, [token, fetchPending]);

    // Accept a consultation
    const handleAccept = async (sessionId) => {
        setLoading(true);
        try {
            const data = await teleconsultationApi.acceptConsultation(sessionId);
            setActiveSession(data.session);
            setPendingRequests(prev => prev.filter(s => s.sessionId !== sessionId));
            setView('call');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to accept');
        } finally {
            setLoading(false);
        }
    };

    // Reject a consultation
    const handleReject = async (sessionId) => {
        try {
            await teleconsultationApi.rejectConsultation(sessionId);
            setPendingRequests(prev => prev.filter(s => s.sessionId !== sessionId));
        } catch (err) {
            console.error('Error rejecting:', err);
        }
    };

    // Call ended — show prescription form
    const handleCallEnd = async () => {
        setView('prescription');
    };

    // Submit prescription
    const handleSubmitPrescription = async (e) => {
        e.preventDefault();
        if (!activeSession) return;
        setLoading(true);
        try {
            const followUp = prescriptionForm.followUpRequired ? {
                required: true,
                date: prescriptionForm.followUpDate,
                reason: prescriptionForm.followUpReason
            } : null;

            // End the session with notes and followUp
            await teleconsultationApi.endSession(activeSession.sessionId, prescriptionForm.additionalNotes, followUp);

            // Create prescription
            const validMeds = prescriptionForm.medications.filter(m => m.name.trim());
            if (validMeds.length > 0 && prescriptionForm.diagnosis.trim()) {
                await teleconsultationApi.createPrescription(activeSession.sessionId, {
                    medications: validMeds,
                    diagnosis: prescriptionForm.diagnosis,
                    additionalNotes: prescriptionForm.additionalNotes
                });
            }

            alert('Consultation completed. Prescription, follow-up, and AI Summary saved!');
            setActiveSession(null);
            setPrescriptionForm({
                diagnosis: '', additionalNotes: '', followUpRequired: false, followUpDate: '', followUpReason: '',
                medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
            });
            setView('dashboard');
            fetchPending();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save prescription');
        } finally {
            setLoading(false);
        }
    };

    // Skip prescription
    const handleSkipPrescription = async () => {
        if (!activeSession) return;
        try {
            await teleconsultationApi.endSession(activeSession.sessionId, '');
            setActiveSession(null);
            setView('dashboard');
            fetchPending();
        } catch (err) {
            console.error('Error ending session:', err);
        }
    };

    // Add medication row
    const addMedication = () => {
        setPrescriptionForm(prev => ({
            ...prev,
            medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
        }));
    };

    // Remove medication row
    const removeMedication = (index) => {
        setPrescriptionForm(prev => ({
            ...prev,
            medications: prev.medications.filter((_, i) => i !== index)
        }));
    };

    // Update medication field
    const updateMedication = (index, field, value) => {
        setPrescriptionForm(prev => ({
            ...prev,
            medications: prev.medications.map((m, i) => i === index ? { ...m, [field]: value } : m)
        }));
    };

    // Load history
    const loadHistory = async () => {
        try {
            const data = await teleconsultationApi.getHistory();
            setHistory(data.sessions || []);
            setView('history');
        } catch (err) {
            console.error('Error loading history:', err);
        }
    };

    // ─── DASHBOARD VIEW ───────────────────────────────────────
    if (view === 'dashboard') {
        return (
            <div className="tab-content">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Teleconsultation</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage emergency consultation requests</p>
                    </div>
                    <button onClick={loadHistory} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" /> History
                    </button>
                </div>

                {/* Incoming Requests */}
                <div className="mb-6">
                    <h3 className="font-heading font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <PhoneIncoming className="w-5 h-5 text-rose-500" />
                        Incoming Requests
                        {pendingRequests.length > 0 && (
                            <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                {pendingRequests.length}
                            </span>
                        )}
                    </h3>

                    {pendingRequests.length === 0 ? (
                        <div className="glass-card text-center py-8 opacity-60">
                            <p className="text-slate-500 dark:text-slate-400 text-sm">No pending consultation requests</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingRequests.map(req => (
                                <div key={req.sessionId} className="glass-card border-l-4 border-rose-400 animate-fade-in">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="badge badge-vitals">EMERGENCY</span>
                                                <span className="text-xs font-mono text-slate-500">{req.sessionId}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <User className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {req.patient?.firstName} {req.patient?.lastName}
                                                </span>
                                                <span className="text-xs text-slate-400">({req.patientId})</span>
                                            </div>
                                            {req.symptoms && (
                                                <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                                    <strong>Symptoms:</strong> {req.symptoms}
                                                </p>
                                            )}
                                            {req.triage && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                                                        req.triage.painLevel >= 8 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800' : 
                                                        req.triage.painLevel >= 5 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800' : 
                                                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                                    }`}>
                                                        {req.triage.painLevel >= 8 && <AlertTriangle className="w-3 h-3" />}
                                                        Pain Scale: {req.triage.painLevel}/10
                                                    </div>
                                                    {req.triage.duration && <span className="px-2 py-1 rounded text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Duration: {req.triage.duration}</span>}
                                                    {req.triage.existingConditions && <span className="px-2 py-1 rounded text-xs bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">Conditions: {req.triage.existingConditions}</span>}
                                                </div>
                                            )}
                                            {req.specialtyNeeded && (
                                                <p className="text-xs text-slate-400 mt-2">Requested specialty: {req.specialtyNeeded}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => handleAccept(req.sessionId)}
                                                disabled={loading}
                                                className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2"
                                            >
                                                <Phone className="w-4 h-4" /> Accept
                                            </button>
                                            <button
                                                onClick={() => handleReject(req.sessionId)}
                                                className="px-4 py-2 text-rose-600 text-sm font-medium rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── CALL VIEW ────────────────────────────────────────────
    if (view === 'call' && activeSession) {
        return (
            <div className="tab-content">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Video className="w-5 h-5 text-teal-600" />
                            Live Consultation — {activeSession.patient?.firstName} {activeSession.patient?.lastName}
                        </h2>
                        <p className="text-xs text-slate-500 font-mono mt-1">Session: {activeSession.sessionId}</p>
                    </div>
                </div>

                <VideoRoom
                    sessionId={activeSession.sessionId}
                    session={activeSession}
                    onCallEnd={handleCallEnd}
                />
            </div>
        );
    }

    // ─── PRESCRIPTION VIEW ────────────────────────────────────
    if (view === 'prescription') {
        return (
            <div className="tab-content">
                <div className="mb-6">
                    <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Post-Consultation Notes</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Consultation with {activeSession?.patient?.firstName} {activeSession?.patient?.lastName} — Generate a prescription
                    </p>
                </div>

                <form onSubmit={handleSubmitPrescription} className="glass-card max-w-2xl space-y-5">
                    {/* Diagnosis */}
                    <div>
                        <label className="label">Diagnosis *</label>
                        <textarea
                            required
                            rows={2}
                            className="input-field"
                            placeholder="Enter diagnosis..."
                            value={prescriptionForm.diagnosis}
                            onChange={(e) => setPrescriptionForm(p => ({ ...p, diagnosis: e.target.value }))}
                        />
                    </div>

                    {/* Medications */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="label mb-0">Medications</label>
                            <button type="button" onClick={addMedication} className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Add Medication
                            </button>
                        </div>

                        <div className="space-y-3">
                            {prescriptionForm.medications.map((med, i) => (
                                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400">Medication #{i + 1}</span>
                                        {prescriptionForm.medications.length > 1 && (
                                            <button type="button" onClick={() => removeMedication(i)} className="text-rose-400 hover:text-rose-600">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input className="input-field text-xs" placeholder="Medicine name" value={med.name}
                                            onChange={(e) => updateMedication(i, 'name', e.target.value)} />
                                        <input className="input-field text-xs" placeholder="Dosage (e.g., 500mg)" value={med.dosage}
                                            onChange={(e) => updateMedication(i, 'dosage', e.target.value)} />
                                        <input className="input-field text-xs" placeholder="Frequency (e.g., 3x/day)" value={med.frequency}
                                            onChange={(e) => updateMedication(i, 'frequency', e.target.value)} />
                                        <input className="input-field text-xs" placeholder="Duration (e.g., 7 days)" value={med.duration}
                                            onChange={(e) => updateMedication(i, 'duration', e.target.value)} />
                                    </div>
                                    <input className="input-field text-xs" placeholder="Special instructions (optional)" value={med.instructions}
                                        onChange={(e) => updateMedication(i, 'instructions', e.target.value)} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Additional Notes */}
                    <div>
                        <label className="label">Clinical Notes</label>
                        <textarea
                            rows={3}
                            className="input-field"
                            placeholder="Clinical findings, advice, etc..."
                            value={prescriptionForm.additionalNotes}
                            onChange={(e) => setPrescriptionForm(p => ({ ...p, additionalNotes: e.target.value }))}
                        />
                    </div>

                    {/* Follow-Up Booking (F4) */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/50">
                        <label className="flex items-center gap-2 cursor-pointer mb-3">
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                checked={prescriptionForm.followUpRequired}
                                onChange={e => setPrescriptionForm(p => ({ ...p, followUpRequired: e.target.checked }))}
                            />
                            <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                Schedule a Follow-Up Appointment
                            </span>
                        </label>
                        
                        {prescriptionForm.followUpRequired && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pl-6 border-l-2 border-blue-200 dark:border-blue-800/50">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Follow-Up Date *</label>
                                    <input 
                                        type="date" 
                                        className="input-field text-sm py-2" 
                                        required={prescriptionForm.followUpRequired}
                                        value={prescriptionForm.followUpDate}
                                        onChange={e => setPrescriptionForm(p => ({ ...p, followUpDate: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Reason for Follow-Up</label>
                                    <input 
                                        type="text" 
                                        className="input-field text-sm py-2" 
                                        placeholder="E.g., Review lab results"
                                        value={prescriptionForm.followUpReason}
                                        onChange={e => setPrescriptionForm(p => ({ ...p, followUpReason: e.target.value }))}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={handleSkipPrescription} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                            Skip (No Prescription)
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><FileText className="w-4 h-4" /> Save Prescription</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // ─── HISTORY VIEW ─────────────────────────────────────────
    if (view === 'history') {
        return (
            <div className="tab-content">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Consultation History</h2>
                    <button onClick={() => { setView('dashboard'); fetchPending(); }} className="text-sm text-teal-600 hover:text-teal-800 font-medium">
                        ← Back
                    </button>
                </div>

                {history.length === 0 ? (
                    <div className="glass-card text-center py-8 opacity-60">
                        <p className="text-slate-500 text-sm">No consultation history yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map(s => (
                            <div key={s.sessionId} className="glass-card">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`badge ${s.status === 'COMPLETED' ? 'badge-general' : 'badge-vitals'}`}>{s.status}</span>
                                            <span className="text-xs font-mono text-slate-500">{s.sessionId}</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            {s.patient?.firstName} {s.patient?.lastName}
                                        </p>
                                        <div className="mt-2 space-y-2 max-w-2xl">
                                            {s.symptoms && <p className="text-xs text-slate-600 dark:text-slate-400"><strong>Symptoms:</strong> {s.symptoms}</p>}
                                            {s.aiSummary && (
                                                <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-100 dark:border-teal-800/50">
                                                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-teal-800 dark:text-teal-400 mb-1 flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3"/> AI Summary
                                                    </h4>
                                                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                        {s.aiSummary}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        {s.status === 'COMPLETED' && s.aiSummary && (
                                            <button 
                                                onClick={() => teleconsultationApi.downloadPrescriptionPDF(s.sessionId)} 
                                                className="mt-4 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
                                            >
                                                <Download className="w-3.5 h-3.5" /> Download Digital Prescription & Summary
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <p className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                            {new Date(s.createdAt).toLocaleDateString()}
                                        </p>
                                        {s.duration > 0 && (
                                            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                                <Clock className="w-3 h-3"/> {Math.floor(s.duration / 60)}m {s.duration % 60}s
                                            </p>
                                        )}
                                        {s.followUp && s.followUp.required && (
                                            <div className="mt-4 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400 text-[10px] rounded-lg text-right font-medium">
                                                <Calendar className="w-3 h-3 inline mr-1" />
                                                Follow-Up: {new Date(s.followUp.date).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default DoctorTeleconsultTab;
