import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { Shield, ArrowLeft, QrCode, KeyRound, CheckCircle, AlertCircle, Copy, Check, ShieldOff, Smartphone } from 'lucide-react';

const MfaSetupPage = () => {
    const [step, setStep] = useState('loading'); // loading, setup, verify, success, manage
    const [qrCode, setQrCode] = useState('');
    const [manualKey, setManualKey] = useState('');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [disableCode, setDisableCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const inputRefs = useRef([]);
    const disableInputRefs = useRef([]);

    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setMounted(true);
        checkMfaStatus();
    }, []);

    const checkMfaStatus = async () => {
        try {
            const response = await apiClient.post('/mfa/status');
            setMfaEnabled(response.data.mfaEnabled);
            setStep(response.data.mfaEnabled ? 'manage' : 'setup');
        } catch (err) {
            setStep('setup');
        }
    };

    const initiateSetup = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await apiClient.post('/mfa/setup');
            setQrCode(response.data.qrCode);
            setManualKey(response.data.manualKey);
            setStep('verify');
        } catch (err) {
            setError('Failed to initiate MFA setup. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (refs, codeState, setCodeState) => (index, value) => {
        if (value && !/^\d$/.test(value)) return;
        const newCode = [...codeState];
        newCode[index] = value;
        setCodeState(newCode);
        setError('');
        if (value && index < 5) {
            refs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (refs, codeState) => (index, e) => {
        if (e.key === 'Backspace' && !codeState[index] && index > 0) {
            refs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (setCodeState, refs) => (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setCodeState(pasted.split(''));
            refs.current[5]?.focus();
        }
    };

    const handleVerifySetup = async (e) => {
        e.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            await apiClient.post('/mfa/verify-setup', { code: fullCode });
            setMfaEnabled(true);
            setStep('success');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid code. Please try again.');
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisable = async (e) => {
        e.preventDefault();
        const fullCode = disableCode.join('');
        if (fullCode.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            await apiClient.post('/mfa/disable', { code: fullCode });
            setMfaEnabled(false);
            setStep('setup');
            setDisableCode(['', '', '', '', '', '']);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid code. Please try again.');
            setDisableCode(['', '', '', '', '', '']);
            disableInputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const copyManualKey = () => {
        navigator.clipboard.writeText(manualKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const goBack = () => {
        if (user?.role === 'DOCTOR') navigate('/doctor/dashboard');
        else if (user?.role === 'PATIENT') navigate('/patient/dashboard');
        else if (user?.role === 'NURSE') navigate('/nurse/dashboard');
        else if (user?.role === 'LAB_TECHNICIAN') navigate('/lab/dashboard');
        else if (user?.role === 'ADMIN') navigate('/admin/dashboard');
        else navigate('/');
    };

    const renderCodeInput = (codeState, setCodeState, refs) => (
        <div className="flex gap-3 justify-center mb-6">
            {codeState.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => (refs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(refs, codeState, setCodeState)(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(refs, codeState)(index, e)}
                    onPaste={index === 0 ? handlePaste(setCodeState, refs) : undefined}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 
                        transition-all duration-200 outline-none
                        ${digit ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-slate-200 bg-slate-50 text-slate-700'}
                        focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:bg-white
                        hover:border-slate-300`}
                    autoComplete="one-time-code"
                />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen relative flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans transition-colors duration-500">
            <div className={`relative z-10 w-full max-w-lg transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-8 rounded-[20px] shadow-2xl border border-white/50 dark:border-slate-700/50">
                    {/* Back Button */}
                    <button
                        onClick={goBack}
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-6 transition-all duration-300 group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back to Dashboard</span>
                    </button>

                    {/* ==================== SETUP STEP ==================== */}
                    {step === 'setup' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-2">
                                Enable Two-Factor Authentication
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                                Add an extra layer of security to your account using an authenticator app
                            </p>

                            {/* Steps Info */}
                            <div className="text-left mb-8 space-y-4">
                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-sm font-bold text-primary-600">1</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">Install an Authenticator App</p>
                                        <p className="text-xs text-slate-500">Google Authenticator, Authy, or Microsoft Authenticator</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-sm font-bold text-primary-600">2</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">Scan the QR Code</p>
                                        <p className="text-xs text-slate-500">Use the app to scan the QR code we'll generate</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-sm font-bold text-primary-600">3</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">Verify with Code</p>
                                        <p className="text-xs text-slate-500">Enter the 6-digit code from your app to confirm</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={initiateSetup}
                                disabled={isLoading}
                                className="btn-glow w-full relative overflow-hidden group"
                            >
                                <span className={`flex items-center justify-center gap-2 transition-all duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                                    <QrCode className="w-5 h-5" />
                                    <span className="font-semibold">Generate QR Code</span>
                                </span>
                                {isLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    </div>
                                )}
                            </button>
                        </div>
                    )}

                    {/* ==================== VERIFY STEP ==================== */}
                    {step === 'verify' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
                                <Smartphone className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-2">
                                Scan QR Code
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                                Scan this QR code with your authenticator app
                            </p>

                            {/* QR Code */}
                            {qrCode && (
                                <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 inline-block mb-6 shadow-sm">
                                    <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
                                </div>
                            )}

                            {/* Manual Key */}
                            <div className="mb-6">
                                <p className="text-xs text-slate-500 mb-2">Or enter this key manually:</p>
                                <div className="flex items-center justify-center gap-2">
                                    <code className="bg-slate-100 px-4 py-2 rounded-lg text-sm font-mono text-slate-700 tracking-wider">
                                        {manualKey}
                                    </code>
                                    <button
                                        onClick={copyManualKey}
                                        className="p-2 text-slate-400 hover:text-primary-600 transition-colors rounded-lg hover:bg-primary-50"
                                        title="Copy key"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <p className="text-sm font-semibold text-slate-700 mb-4">
                                    Enter the 6-digit code from your app to confirm:
                                </p>
                                <form onSubmit={handleVerifySetup}>
                                    {renderCodeInput(code, setCode, inputRefs)}

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 mb-4 animate-slide-up">
                                            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                                            <p className="text-sm">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading || code.join('').length !== 6}
                                        className="btn-glow w-full relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className={`flex items-center justify-center gap-2 transition-all duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="font-semibold">Verify & Enable MFA</span>
                                        </span>
                                        {isLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* ==================== SUCCESS STEP ==================== */}
                    {step === 'success' && (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                                <CheckCircle className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-2">
                                MFA Enabled Successfully!
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                                Your account is now protected with two-factor authentication.
                                You'll need to enter a code from your authenticator app each time you sign in.
                            </p>

                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 mb-6">
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-green-800 text-left">
                                        <strong>Important:</strong> Keep your authenticator app installed and accessible.
                                        If you lose access, you'll need to contact an administrator to reset your MFA.
                                    </p>
                                </div>
                            </div>

                            <button onClick={goBack} className="btn-glow w-full">
                                <span className="flex items-center justify-center gap-2">
                                    <span className="font-semibold">Return to Dashboard</span>
                                </span>
                            </button>
                        </div>
                    )}

                    {/* ==================== MANAGE STEP (MFA already enabled) ==================== */}
                    {step === 'manage' && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-2">
                                MFA is Active
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                                Two-factor authentication is currently enabled on your account
                            </p>

                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 mb-8">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <p className="text-sm text-green-800 font-medium">Protected with authenticator app</p>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-6">
                                <h3 className="text-sm font-semibold text-red-700 mb-4 flex items-center justify-center gap-2">
                                    <ShieldOff className="w-4 h-4" />
                                    Disable Two-Factor Authentication
                                </h3>
                                <p className="text-xs text-slate-500 mb-4">
                                    Enter your current authenticator code to disable MFA
                                </p>
                                <form onSubmit={handleDisable}>
                                    {renderCodeInput(disableCode, setDisableCode, disableInputRefs)}

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 mb-4 animate-slide-up">
                                            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                                            <p className="text-sm">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading || disableCode.join('').length !== 6}
                                        className="w-full py-3 px-6 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl font-semibold 
                                            hover:bg-red-100 hover:border-red-300 transition-all duration-300
                                            disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className={`flex items-center justify-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                                            <ShieldOff className="w-5 h-5" />
                                            <span>Disable MFA</span>
                                        </span>
                                        {isLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* ==================== LOADING ==================== */}
                    {step === 'loading' && (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-500 text-sm">Checking MFA status...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MfaSetupPage;
