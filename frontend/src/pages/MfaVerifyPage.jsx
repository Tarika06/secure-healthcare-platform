import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ArrowLeft, Lock, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';

const MfaVerifyPage = () => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const inputRefs = useRef([]);

    const { verifyMfa } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const mfaToken = location.state?.mfaToken;
    const userId = location.state?.userId;

    useEffect(() => {
        setMounted(true);
        // If no MFA token in state, redirect to login
        if (!mfaToken) {
            navigate('/login', { replace: true });
        }
        // Focus the first input
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [mfaToken, navigate]);

    const handleChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const newCode = pasted.split('');
            setCode(newCode);
            inputRefs.current[5]?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const user = await verifyMfa(mfaToken, fullCode);

            // Redirect based on role
            const roleRoutes = {
                DOCTOR: '/doctor/dashboard',
                PATIENT: '/patient/dashboard',
                NURSE: '/nurse/dashboard',
                LAB_TECHNICIAN: '/lab/dashboard',
                ADMIN: '/admin/dashboard'
            };
            navigate(roleRoutes[user.role] || '/login', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Verification failed. Please try again.');
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans transition-colors duration-500">
            <div className={`relative z-10 w-full max-w-md transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {/* Card */}
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-8 rounded-[20px] shadow-2xl border border-white/50 dark:border-slate-700/50">
                    {/* Back to Login */}
                    <button
                        onClick={handleCancel}
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-8 transition-all duration-300 group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back to Login</span>
                    </button>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
                            <KeyRound className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-2">
                            Two-Factor Authentication
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Enter the 6-digit code from your authenticator app
                            {userId && <span className="block mt-1 text-primary-600 dark:text-primary-400 font-medium">for {userId}</span>}
                        </p>
                    </div>

                    {/* Code Input */}
                    <form onSubmit={handleSubmit}>
                        <div className="flex gap-3 justify-center mb-6">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 
                                        transition-all duration-200 outline-none
                                        ${digit ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 bg-slate-50 text-slate-700'}
                                        focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white
                                        hover:border-slate-300`}
                                    autoComplete="one-time-code"
                                />
                            ))}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 mb-4 animate-slide-up">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || code.join('').length !== 6}
                            className="btn-glow w-full relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className={`flex items-center justify-center gap-2 transition-all duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                                <Shield className="w-5 h-5" />
                                <span className="font-semibold">Verify & Sign In</span>
                            </span>
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                </div>
                            )}
                        </button>

                        {/* Cancel Button */}
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="w-full mt-3 py-3 text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors"
                        >
                            Cancel and return to login
                        </button>
                    </form>

                    {/* Help Notice */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-teal-50 rounded-xl border border-primary-100">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mt-0.5">
                                <Shield className="w-4 h-4 text-primary-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-600">
                                    Open your authenticator app (Google Authenticator, Authy, or Microsoft Authenticator) and enter the current code for <strong>SecureCare+</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MfaVerifyPage;
