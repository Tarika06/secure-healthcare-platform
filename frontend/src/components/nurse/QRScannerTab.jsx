import React, { useState } from 'react';
import { Camera, ScanLine, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import appointmentApi from '../../api/appointmentApi';

const QRScannerTab = () => {
    const [qrToken, setQrToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleVerify = async (e) => {
        e.preventDefault();

        if (!qrToken.trim()) {
            setError("Please enter the QR Token string from the patient's QR code.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await appointmentApi.verifyEntry(qrToken.trim());
            setResult(data);
            setQrToken(''); // clear on success
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to verify entry. Invalid or expired token.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tab-content max-w-3xl">
            <div className="mb-6">
                <h2 className="text-2xl font-heading font-bold text-slate-900 flex items-center gap-2">
                    <ScanLine className="w-6 h-6 text-emerald-600" /> Verify Hospital Entry
                </h2>
                <p className="text-slate-500 mt-1">Scan or paste the patient's QR token to grant building access</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-card">
                    <h3 className="font-bold text-slate-900 mb-4">Patient Entry Scanner</h3>

                    <form onSubmit={handleVerify} className="space-y-4">
                        <div>
                            <label className="label">QR Token (JWT)</label>
                            <textarea
                                value={qrToken}
                                onChange={(e) => setQrToken(e.target.value)}
                                className="input-field font-mono text-xs h-32"
                                placeholder="Paste the long token string here..."
                                required
                            />
                            <p className="text-xs text-slate-400 mt-2">
                                In a production setting, a physical 2D barcode scanner would automatically paste this string when the patient shows their phone.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !qrToken.trim()}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><ScanLine className="w-5 h-5" /> Verify Access</>
                            )}
                        </button>
                    </form>
                </div>

                <div className="glass-card flex flex-col items-center justify-center p-8 bg-slate-50 relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-bl-full opacity-50 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-100 rounded-tr-full opacity-50 blur-2xl"></div>

                    {loading ? (
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-600 font-medium">Verifying Credentials...</p>
                        </div>
                    ) : result ? (
                        <div className="text-center w-full z-10 animate-fade-in relative">
                            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                                <CheckCircle className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">Access Granted</h3>
                            <p className="text-sm text-slate-500 mb-4">{result.message}</p>

                            {result.appointment && (
                                <div className="bg-white p-4 rounded-xl border border-emerald-200 text-left shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Patient Details</p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="text-slate-500">Name</span>
                                            <span className="font-semibold text-slate-900">{result.appointment.patientName}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="text-slate-500">Scheduled With</span>
                                            <span className="font-semibold text-slate-900">Dr. {result.appointment.doctorName}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="text-slate-500">Time Slot</span>
                                            <span className="font-semibold text-slate-900">{result.appointment.timeSlot}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Status</span>
                                            <span className="badge badge-lab text-[10px]">{result.appointment.status}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : error ? (
                        <div className="text-center w-full z-10 animate-fade-in">
                            <div className="w-20 h-20 mx-auto rounded-full bg-rose-100 flex items-center justify-center mb-4">
                                <XCircle className="w-10 h-10 text-rose-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-1">Access Denied</h3>
                            <div className="bg-white p-4 rounded-xl border border-rose-200 text-left shadow-sm mt-4">
                                <p className="text-sm text-rose-700 font-medium flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    {error}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center opacity-70 z-10">
                            <ScanLine className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-600 mb-2">Awaiting Scan</h3>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                Waiting for nurse to verify a patient's QR code.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRScannerTab;
