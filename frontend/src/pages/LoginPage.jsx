import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Heart, ArrowLeft, Eye, EyeOff, CheckCircle, Sparkles, Info } from 'lucide-react';
import logo from '../assets/logo.png';
import PolicyModal from '../components/PolicyModal';

const LoginPage = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        setIsLoading(true);

        try {
            const user = await login(userId, password);

            // Redirect based on role
            if (user.role === 'DOCTOR') {
                navigate('/doctor/dashboard');
            } else if (user.role === 'PATIENT') {
                navigate('/patient/dashboard');
            } else if (user.role === 'NURSE') {
                navigate('/nurse/dashboard');
            } else if (user.role === 'LAB_TECHNICIAN') {
                navigate('/lab/dashboard');
            } else if (user.role === 'ADMIN') {
                navigate('/admin/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const features = [
        { icon: Shield, text: 'HIPAA Compliant' },
        { icon: Lock, text: 'End-to-End Encryption' },
        { icon: CheckCircle, text: 'GDPR Protected' },
    ];

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Animated Graphics Panel */}
            <div className="hidden lg:flex lg:w-1/2 login-bg relative overflow-hidden">
                {/* Animated Decorative Elements */}
                <div className="absolute inset-0">
                    {/* Floating Circles */}
                    <div className="floating-shape w-64 h-64 bg-primary-400/20 -top-20 -left-20" style={{ animationDelay: '0s' }} />
                    <div className="floating-shape w-48 h-48 bg-teal-400/15 top-1/4 right-10" style={{ animationDelay: '2s' }} />
                    <div className="floating-shape w-32 h-32 bg-emerald-400/20 bottom-1/4 left-1/4" style={{ animationDelay: '4s' }} />
                    <div className="floating-shape w-40 h-40 bg-primary-500/15 bottom-20 right-1/4" style={{ animationDelay: '1s' }} />

                    {/* Grid Pattern */}
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                            backgroundSize: '50px 50px'
                        }}
                    />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
                    {/* Logo */}
                    <div className={`mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="relative">
                            <div className="absolute inset-0 blur-2xl bg-primary-400/30 rounded-full animate-pulse" />
                            <img
                                src={logo}
                                alt="SecureCare Logo"
                                className="relative w-48 h-48 object-contain drop-shadow-2xl"
                            />
                        </div>
                    </div>

                    {/* Title */}
                    <div className={`text-center transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <h1 className="text-6xl font-heading font-extrabold text-white mb-4 tracking-tight">
                            Secure<span className="text-primary-200">Care</span><span className="text-primary-400">+</span>
                        </h1>
                        <p className="text-xl text-slate-300 mb-2">Enterprise Healthcare Platform</p>
                        <p className="text-slate-400 max-w-md">
                            Protecting patient data with military-grade security and seamless healthcare management
                        </p>
                    </div>

                    {/* Feature Badges */}
                    <div className={`flex flex-wrap gap-4 mt-12 justify-center transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90"
                                style={{ animationDelay: `${600 + idx * 100}ms` }}
                            >
                                <feature.icon className="w-4 h-4 text-primary-300" />
                                <span className="text-sm font-medium">{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Stats */}
                    <div className={`grid grid-cols-3 gap-8 mt-16 transition-all duration-1000 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-white">256-bit</p>
                            <p className="text-sm text-slate-400">AES Encryption</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-white">99.9%</p>
                            <p className="text-sm text-slate-400">Uptime SLA</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-white">24/7</p>
                            <p className="text-sm text-slate-400">Monitoring</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-slate-100 via-white to-primary-50 dark:from-slate-950 dark:via-slate-900 dark:to-primary-950/20">
                <div className={`w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-slate-200 dark:border-slate-800 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    {/* Back to Home Link */}
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 mb-8 transition-all duration-300 group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">Back to Home</span>
                    </Link>

                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <img src={logo} alt="SecureCare" className="w-20 h-20 mx-auto mb-4" />
                        <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white">
                            <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Secure</span>
                            <span className="text-primary-600 dark:text-primary-400">Care</span>
                            <span className="text-primary-400">+</span>
                        </h1>
                    </div>

                    {/* Welcome Text */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-primary-500" />
                            <span className="text-sm font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider">Welcome back</span>
                        </div>
                        <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">Sign in to your account</h2>
                        <p className="text-slate-500 dark:text-slate-400">Access your secure healthcare portal</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* User ID Field */}
                        <div className="group">
                            <label className="block text-sm font-heading font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                User ID
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    className="input-field pr-12 font-sans dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    placeholder="e.g., P001, D001, N001, L001, A001"
                                    required
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Shield className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="group">
                            <label className="block text-sm font-heading font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pr-12 font-sans dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Implied Consent Notice */}
                        <div className="mt-6 text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                By signing in, you agree to our{' '}
                                <button
                                    type="button"
                                    onClick={() => setIsPolicyModalOpen(true)}
                                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium hover:underline transition-colors"
                                >
                                    Privacy Policy & Data Processing Terms
                                </button>
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center justify-center gap-1">
                                <Shield className="h-3 w-3" />
                                Protected by GDPR & HIPAA Standards
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 animate-slide-up">
                                <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                                    <span className="text-red-500 dark:text-red-400 text-lg">!</span>
                                </div>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-glow w-full relative overflow-hidden group"
                        >
                            <span className={`flex items-center justify-center gap-2 transition-all duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                                <Lock className="w-5 h-5" />
                                <span className="font-semibold">Sign In Securely</span>
                            </span>
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                </div>
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-8 text-center">
                        <p className="text-slate-500 dark:text-slate-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                                Create Account
                            </Link>
                        </p>
                    </div>

                    {/* Security Notice */}
                    <div className="mt-8 p-4 bg-gradient-to-r from-primary-50 to-teal-50 dark:from-primary-900/20 dark:to-teal-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Bank-Level Security</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Your data is protected with 256-bit encryption and multi-factor authentication
                                </p>
                            </div>
                        </div>
                    </div>
                </div >
            </div >

            <PolicyModal
                isOpen={isPolicyModalOpen}
                onClose={() => setIsPolicyModalOpen(false)}
            />
        </div >
    );
};

export default LoginPage;

