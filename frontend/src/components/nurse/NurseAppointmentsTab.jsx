import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, CheckCircle, XCircle, Search, ClipboardCheck, ArrowRight, User, Calendar, Clock } from 'lucide-react';
import appointmentApi from '../../api/appointmentApi';

const NurseAppointmentsTab = () => {
    const navigate = useNavigate();
    const [qrToken, setQrToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const handleVerifyToken = async (e) => {
        if (e) e.preventDefault();
        if (!qrToken.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await appointmentApi.verifyEntry(qrToken);
            setResult(data);
            setQrToken(''); // Clear after success
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Invalid or expired token.');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoManualScan = (demoToken) => {
        setQrToken(demoToken);
        // We don't auto-verify to allow the nurse to "click scan"
    };

    return (
        <div className="tab-content max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Hospital Entry Verification</h2>
                <p className="text-slate-500 mt-1 font-medium">Verify patient QR codes to grant secure access and audit entries.</p>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
                {/* Scanner Interface */}
                <div className="lg:col-span-3">
                    <div className="glass-card relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <ScanLine className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Scan QR Code</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Entry Authorization System</p>
                            </div>
                        </div>

                        <form onSubmit={handleVerifyToken} className="space-y-6">
                            <div className="relative group/input">
                                <label className="label text-xs font-black uppercase text-slate-400 mb-2 block">Secure Entry Token</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors">
                                        <ClipboardCheck className="w-6 h-6" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Paste or Scan Entry Token..."
                                        className="w-full pl-14 pr-4 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner"
                                        value={qrToken}
                                        onChange={(e) => setQrToken(e.target.value)}
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 font-medium">Patient token is a secure, time-limited cryptographic hash.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !qrToken.trim()}
                                className="w-full btn-primary py-5 rounded-2xl flex items-center justify-center gap-3 text-lg font-black tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed group/btn hover:scale-[1.01] active:scale-[0.99] transition-all"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <ScanLine className="w-6 h-6 group-hover/btn:rotate-12 transition-transform" />
                                        Verify Authorization
                                    </>
                                )}
                            </button>
                        </form>

                        {error && (
                            <div className="mt-8 p-5 bg-rose-50 border border-rose-100 rounded-2xl animate-shake">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                                        <XCircle className="w-6 h-6 text-rose-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-rose-900">Authorization Refused</p>
                                        <p className="text-sm text-rose-600 mt-1">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status / History / Help */}
                <div className="lg:col-span-2 space-y-6">
                    {result ? (
                        <div className="glass-card bg-emerald-50 border-emerald-100 animate-fade-in">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-emerald-900">Access Granted</h3>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Entry Validated</p>
                                </div>
                            </div>

                            <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-emerald-100 space-y-4">
                                <div className="flex justify-between items-center border-b border-emerald-50 pb-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient</p>
                                        <p className="font-bold text-slate-900">{result.appointment?.patientName}</p>
                                    </div>
                                    <User className="w-8 h-8 text-slate-200" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</p>
                                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {result.appointment?.date}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</p>
                                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {result.appointment?.timeSlot}</p>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-emerald-50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doctor</p>
                                    <p className="text-sm font-bold text-teal-600">Dr. {result.appointment?.doctorName}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setResult(null)}
                                className="w-full mt-6 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100/50 rounded-xl transition-colors border border-emerald-200/50"
                            >
                                Clear & Reset Scanner
                            </button>
                        </div>
                    ) : (
                        <div className="glass-card">
                            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <ArrowRight className="w-4 h-4 text-blue-500" /> Recent Logins
                            </h4>
                            <div className="space-y-3">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center py-10">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                        <ClipboardCheck className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">No verifications performed in this session yet.</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Verification Tips</h4>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-2.5 text-xs text-slate-500 leading-relaxed font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                                        <span>Patient MUST provide their unique QR code from their portal.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5 text-xs text-slate-500 leading-relaxed font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                                        <span>Each token is one-time use and session-bound.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5 text-xs text-slate-500 leading-relaxed font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                                        <span>Audit logs are transmitted to the security engine in real-time.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NurseAppointmentsTab;
