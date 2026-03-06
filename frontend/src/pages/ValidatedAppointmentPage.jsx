import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, CalendarDays, User, ArrowLeft, ScanLine } from 'lucide-react';
import appointmentApi from '../api/appointmentApi';
import { useAuth } from '../context/AuthContext';

const ValidatedAppointmentPage = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    const [loading, setLoading] = useState(true);
    const [appointment, setAppointment] = useState(null);
    const [error, setError] = useState(null);
    const [verifiedResult, setVerifiedResult] = useState(null);

    useEffect(() => {
        if (!id) {
            setError("Invalid appointment link.");
            setLoading(false);
            return;
        }

        fetchAppointmentDetails();
    }, [id]);

    const fetchAppointmentDetails = async () => {
        try {
            setLoading(true);
            // Public or semi-public endpoint to get basic details OR use the verify endpoint
            // If the user scanning is a NURSE/ADMIN, we can auto-verify using the token if they click a button

            // To just display info first, we need an endpoint, but since the QR has the token
            // We can actually just attempt to verify if the current user is a nurse/admin
            // Otherwise, we shouldn't expose PII publicly.

            // For now, if there's no token, show error.
            if (!token) {
                setError("No valid QR token found in the URL.");
                setLoading(false);
                return;
            }

            // Since only nurses/admins should verify, if the user isn't logged in, prompt login
            if (!isAuthenticated) {
                navigate(`/login?redirect=/appointment/${id}?token=${token}`);
                return;
            }

            // If logged in, fetch details or attempt verify
            if (user.role === 'NURSE' || user.role === 'ADMIN') {
                // Nurse is viewing, show verification button
                setAppointment({ appointmentId: id, token });
            } else {
                setError("You do not have permission to verify this QR code.");
            }
        } catch (err) {
            setError("Failed to load appointment details.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await appointmentApi.verifyEntry(token);
            setVerifiedResult(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to verify entry. Invalid or expired token.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full glass-card p-8 shadow-xl relative overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-teal-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20"></div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20"></div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-600 font-medium">Processing secure QR link...</p>
                    </div>
                ) : error ? (
                    <div className="text-center relative z-10">
                        <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 flex items-center justify-center mb-4">
                            <XCircle className="w-8 h-8 text-rose-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
                        <p className="text-slate-600 mb-6">{error}</p>
                        <button onClick={() => navigate('/')} className="btn-secondary w-full">
                            Return to Home
                        </button>
                    </div>
                ) : verifiedResult ? (
                    <div className="text-center animate-fade-in relative z-10">
                        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                            <CheckCircle className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-1">Entry Authorized</h2>
                        <p className="text-sm text-slate-500 mb-6">{verifiedResult.message}</p>

                        {verifiedResult.appointment && (
                            <div className="bg-white p-5 rounded-2xl border border-emerald-100 text-left shadow-sm space-y-3 mb-6">
                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest text-center mb-4 pb-2 border-b border-emerald-50">Patient Details</p>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex flex-shrink-0 items-center justify-center">
                                        <User className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Patient</p>
                                        <p className="text-sm font-semibold text-slate-900">{verifiedResult.appointment.patientName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex flex-shrink-0 items-center justify-center">
                                        <User className="w-4 h-4 text-teal-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Doctor</p>
                                        <p className="text-sm font-semibold text-slate-900">Dr. {verifiedResult.appointment.doctorName}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-50">
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        <p className="text-[10px] uppercase text-slate-400 font-bold mb-1 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Date</p>
                                        <p className="text-sm font-medium text-slate-800">{verifiedResult.appointment.date}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        <p className="text-[10px] uppercase text-slate-400 font-bold mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Time</p>
                                        <p className="text-sm font-medium text-slate-800">{verifiedResult.appointment.timeSlot}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <button onClick={() => navigate('/nurse/dashboard?tab=verify')} className="btn-primary w-full">
                            Back to Scanner
                        </button>
                    </div>
                ) : (
                    <div className="text-center relative z-10">
                        <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-6">
                            <ScanLine className="w-10 h-10 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-heading font-bold text-slate-900 mb-2">Verify Hospital Entry</h2>
                        <p className="text-slate-500 mb-8 text-sm">
                            You are about to verify entry for appointment ID:<br />
                            <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 mt-2 inline-block text-xs">{id}</span>
                        </p>

                        <div className="flex flex-col gap-3">
                            <button onClick={handleVerify} className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-lg shadow-lg shadow-teal-500/30">
                                <ScanLine className="w-5 h-5" /> Grant Access
                            </button>
                            <button onClick={() => navigate('/nurse/dashboard')} className="text-slate-500 hover:text-slate-700 text-sm font-medium py-2">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ValidatedAppointmentPage;
