import React, { useState, useEffect } from 'react';
import { Phone, AlertTriangle, Clock, Video, FileText, Download, CheckCircle, XCircle, Stethoscope, Activity, History, ChevronRight } from 'lucide-react';
import { io } from 'socket.io-client';
import teleconsultationApi from '../../api/teleconsultationApi';
import VideoRoom from './VideoRoom';
import { useAuth } from '../../context/AuthContext';

/**
 * EmergencyConsultation Component (Patient)
 * 
 * Full emergency consultation flow:
 * 1. Symptom pre-check form
 * 2. Waiting for doctor assignment
 * 3. Video call
 * 4. Post-call: view prescription & history
 */

const SPECIALTIES = [
    { value: '', label: 'Any Available Doctor' },
    { value: 'General', label: 'General Practitioner' },
    { value: 'Cardiology', label: 'Cardiologist' },
    { value: 'Dermatology', label: 'Dermatologist' },
    { value: 'Neurology', label: 'Neurologist' },
    { value: 'Orthopedics', label: 'Orthopedic' },
    { value: 'Pediatrics', label: 'Pediatrician' },
    { value: 'Psychiatry', label: 'Psychiatrist' }
];

const EmergencyConsultation = () => {
    const { token } = useAuth();
    const [view, setView] = useState('home'); // home | request | waiting | call | post-call | history
    const [symptoms, setSymptoms] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [triage, setTriage] = useState({
        painLevel: 5,
        duration: '',
        existingConditions: '',
        medications: '',
        allergies: '',
        vitals: { temperature: '', bloodPressure: '' }
    });
    const [activeSession, setActiveSession] = useState(null);
    const [history, setHistory] = useState([]);
    const [prescription, setPrescription] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Check for active sessions on mount
    useEffect(() => {
        checkActiveSessions();
    }, []);

    const checkActiveSessions = async () => {
        try {
            const data = await teleconsultationApi.getActiveSessions();
            if (data.sessions && data.sessions.length > 0) {
                const session = data.sessions[0];
                setActiveSession(session);
                if (session.status === 'PENDING') setView('waiting');
                else if (session.status === 'ASSIGNED' || session.status === 'IN_PROGRESS') setView('call');
            }
        } catch (err) {
            console.error('Error checking active sessions:', err);
        }
    };

    // Listen for real-time updates via Socket.IO
    useEffect(() => {
        if (!token || view === 'home' || view === 'history') return;

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const serverUrl = apiUrl.replace('/api', '');

        const socket = io(serverUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        socket.on('CONSULTATION_ACCEPTED', ({ sessionId, doctorId }) => {
            if (activeSession && activeSession.sessionId === sessionId) {
                setActiveSession(prev => ({ ...prev, status: 'ASSIGNED', doctorId }));
                setView('call');
            }
        });

        return () => socket.disconnect();
    }, [token, view, activeSession]);

    // Request consultation
    const handleRequestConsultation = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const data = await teleconsultationApi.requestConsultation({
                symptoms,
                specialtyNeeded: specialty,
                type: 'EMERGENCY',
                triage
            });
            setActiveSession(data.session);
            setView('waiting');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request consultation');
        } finally {
            setLoading(false);
        }
    };

    // Cancel waiting
    const handleCancel = async () => {
        if (!activeSession) return;
        try {
            await teleconsultationApi.cancelSession(activeSession.sessionId);
            setActiveSession(null);
            setView('home');
        } catch (err) {
            console.error('Error cancelling:', err);
        }
    };

    // Call ended
    const handleCallEnd = async () => {
        if (activeSession) {
            try {
                const data = await teleconsultationApi.getPrescription(activeSession.sessionId);
                setPrescription(data.prescription || null);
            } catch (err) {
                console.error(err);
                // No prescription yet, that's ok
            }
        }
        setView('post-call');
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

    // Download prescription
    const handleDownloadPDF = async (sessionId) => {
        try {
            await teleconsultationApi.downloadPrescriptionPDF(sessionId);
        } catch (err) {
            console.error(err);
            alert('Failed to download prescription');
        }
    };

    // ─── HOME VIEW ────────────────────────────────────────────
    if (view === 'home') {
        return (
            <div className="tab-content">
                <div className="mb-6">
                    <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Emergency Teleconsultation</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Connect with a doctor instantly via secure video call</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Start Consultation Card */}
                    <div
                        onClick={() => setView('request')}
                        className="glass-card group cursor-pointer border-2 border-transparent hover:border-rose-300 dark:hover:border-rose-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/10"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Phone className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Emergency Consultation</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Connect with a doctor now</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            Start Emergency Call
                            <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>

                    {/* History Card */}
                    <div
                        onClick={loadHistory}
                        className="glass-card group cursor-pointer border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-500/30 transition-all duration-300"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <History className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Consultation History</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">View past consultations & prescriptions</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                            <FileText className="w-4 h-4" />
                            View History
                            <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>

                {/* Security info */}
                <div className="mt-6 p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50 rounded-xl flex items-start gap-3">
                    <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-teal-800 dark:text-teal-300">Secure & Encrypted</p>
                        <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                            All video calls are end-to-end encrypted using DTLS + SRTP. Your medical data is encrypted at rest with AES-256.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ─── REQUEST VIEW ─────────────────────────────────────────
    if (view === 'request') {
        return (
            <div className="tab-content max-w-2xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Describe Your Symptoms</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">This helps us match you with the right doctor and priority level</p>
                </div>

                <div className="glass-card">
                    {error && (
                        <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleRequestConsultation} className="space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Primary Concern</h3>
                            <div>
                                <label className="label">Symptoms / Reason *</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="input-field"
                                    placeholder="Describe your symptoms or reason for emergency consultation..."
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Preferred Specialty (Optional)</label>
                                    <select
                                        className="input-field"
                                        value={specialty}
                                        onChange={(e) => setSpecialty(e.target.value)}
                                    >
                                        {SPECIALTIES.map(s => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Pain Level (1-10)</label>
                                    <input
                                        type="range" min="1" max="10"
                                        value={triage.painLevel}
                                        onChange={e => setTriage({...triage, painLevel: parseInt(e.target.value)})}
                                        className="w-full accent-teal-600 mt-2"
                                    />
                                    <div className="text-xs text-center text-slate-500 mt-1">Level: {triage.painLevel}</div>
                                </div>
                            </div>
                        </div>

                        {/* Medical History */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Medical History & Vitals</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Duration of Symptoms</label>
                                    <input type="text" className="input-field" placeholder="e.g. 2 hours, 3 days" value={triage.duration} onChange={e => setTriage({...triage, duration: e.target.value})} />
                                </div>
                                <div>
                                    <label className="label">Existing Conditions</label>
                                    <input type="text" className="input-field" placeholder="e.g. Asthma" value={triage.existingConditions} onChange={e => setTriage({...triage, existingConditions: e.target.value})} />
                                </div>
                                <div>
                                    <label className="label">Current Medications</label>
                                    <input type="text" className="input-field" placeholder="e.g. Lisinopril" value={triage.medications} onChange={e => setTriage({...triage, medications: e.target.value})} />
                                </div>
                                <div>
                                    <label className="label">Allergies</label>
                                    <input type="text" className="input-field" placeholder="e.g. Penicillin" value={triage.allergies} onChange={e => setTriage({...triage, allergies: e.target.value})} />
                                </div>
                                <div>
                                    <label className="label">Temperature (°F) (Optional)</label>
                                    <input type="text" className="input-field" placeholder="e.g. 98.6" value={triage.vitals.temperature} onChange={e => setTriage({...triage, vitals: {...triage.vitals, temperature: e.target.value}})} />
                                </div>
                                <div>
                                    <label className="label">Blood Pressure (Optional)</label>
                                    <input type="text" className="input-field" placeholder="e.g. 120/80" value={triage.vitals.bloodPressure} onChange={e => setTriage({...triage, vitals: {...triage.vitals, bloodPressure: e.target.value}})} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setView('home')}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !symptoms.trim()}
                                className="btn-primary flex-1 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <><Phone className="w-4 h-4" /> Connect with Doctor</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ─── WAITING VIEW ─────────────────────────────────────────
    if (view === 'waiting') {
        return (
            <div className="tab-content">
                <div className="glass-card max-w-md mx-auto text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center mx-auto mb-6">
                        <Stethoscope className="w-10 h-10 text-white animate-pulse" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Searching for Available Doctors...</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        We're connecting you with a qualified doctor. This usually takes less than a minute.
                    </p>

                    <div className="flex justify-center gap-2 mb-8">
                        <div className="w-3 h-3 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-3 h-3 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-3 h-3 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>

                    {activeSession && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-left mb-6">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Session ID</p>
                            <p className="text-xs font-mono text-slate-600 dark:text-slate-300">{activeSession.sessionId}</p>
                        </div>
                    )}

                    <button
                        onClick={handleCancel}
                        className="text-sm text-rose-500 hover:text-rose-700 font-medium"
                    >
                        Cancel Request
                    </button>
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
                            Live Consultation
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                            Session: {activeSession.sessionId}
                        </p>
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

    // ─── POST-CALL VIEW ───────────────────────────────────────
    if (view === 'post-call') {
        return (
            <div className="tab-content">
                <div className="glass-card max-w-lg mx-auto text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Consultation Complete</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        Your teleconsultation has ended. {prescription ? 'A prescription has been issued.' : 'No prescription was issued.'}
                    </p>

                    {prescription && (
                        <div className="text-left p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50 rounded-xl mb-6">
                            <p className="text-sm font-bold text-teal-800 dark:text-teal-300 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Digital Prescription
                            </p>
                            <p className="text-xs text-teal-700 dark:text-teal-400 mb-1"><strong>Diagnosis:</strong> {prescription.diagnosis}</p>
                            {prescription.medications?.map((med, i) => (
                                <div key={i} className="text-xs text-teal-600 dark:text-teal-400 mt-1 pl-2 border-l-2 border-teal-300">
                                    <strong>{med.name}</strong> — {med.dosage}, {med.frequency} for {med.duration}
                                </div>
                            ))}
                            <button
                                onClick={() => handleDownloadPDF(activeSession?.sessionId)}
                                className="mt-3 text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1"
                            >
                                <Download className="w-3 h-3" /> Download PDF
                            </button>
                        </div>
                    )}

                    <div className="flex gap-3 justify-center">
                        <button onClick={() => { setView('home'); setActiveSession(null); setPrescription(null); }} className="btn-primary">
                            Back to Home
                        </button>
                        <button onClick={loadHistory} className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg">
                            View History
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── HISTORY VIEW ─────────────────────────────────────────
    if (view === 'history') {
        return (
            <div className="tab-content">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Consultation History</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Your past teleconsultation records</p>
                    </div>
                    <button onClick={() => setView('home')} className="text-sm text-teal-600 hover:text-teal-800 font-medium">
                        ← Back
                    </button>
                </div>

                {history.length === 0 ? (
                    <div className="glass-card text-center py-8 opacity-80">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No consultation history yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map(s => (
                            <div key={s.sessionId} className="glass-card">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`badge ${s.status === 'COMPLETED' ? 'badge-general' : 'badge-vitals'}`}>
                                                {s.status}
                                            </span>
                                            <span className="text-xs font-mono text-slate-500">{s.sessionId}</span>
                                        </div>
                                        {s.doctor && (
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                Dr. {s.doctor.firstName} {s.doctor.lastName}
                                                <span className="text-slate-400 font-normal"> — {s.doctor.specialty || 'General'}</span>
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</p>
                                        {s.duration > 0 && (
                                            <p className="text-xs text-slate-400 flex items-center gap-1 justify-end mt-1">
                                                <Clock className="w-3 h-3" /> {Math.floor(s.duration / 60)}m {s.duration % 60}s
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3">
                                    {s.symptoms && (
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                            <strong>Symptoms:</strong> {s.symptoms}
                                        </p>
                                    )}
                                    {s.notes && (
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                            <strong>Notes:</strong> {s.notes}
                                        </p>
                                    )}
                                    {s.aiSummary && (
                                        <div className="p-3 bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800 rounded-lg mt-2">
                                            <h4 className="text-xs font-bold text-teal-800 dark:text-teal-300 mb-1 flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" /> AI Summary
                                            </h4>
                                            <div className="text-xs text-teal-700 dark:text-teal-400 whitespace-pre-line">
                                                {s.aiSummary}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {s.timeline && s.timeline.length > 0 && (
                                    <div className="mt-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Timeline</h4>
                                        <div className="flex flex-col gap-2 relative pl-2">
                                            <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-slate-300 dark:bg-slate-600 rounded"></div>
                                            {s.timeline.map((evt, idx) => (
                                                <div key={idx} className="flex items-center gap-3 relative z-10">
                                                    <div className="w-3.5 h-3.5 rounded-full bg-teal-500 border-2 border-white dark:border-slate-800"></div>
                                                    <div className="flex-1 text-xs text-slate-600 dark:text-slate-400">
                                                        <span className="font-bold">{evt.status}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {s.status === 'COMPLETED' && (
                                    <button
                                        onClick={() => handleDownloadPDF(s.sessionId)}
                                        className="mt-3 text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1"
                                    >
                                        <Download className="w-3 h-3" /> Download Prescription
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default EmergencyConsultation;
