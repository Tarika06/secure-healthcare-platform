import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, ArrowLeft, Shield, Info } from 'lucide-react';
import PolicyModal from '../components/PolicyModal';

const LoginPage = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [acceptPrivacyPolicy, setAcceptPrivacyPolicy] = useState(false);
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!acceptPrivacyPolicy) {
            setError('You must agree to the Privacy Policy & Data Processing terms to proceed.');
            return;
        }

        setIsLoading(true);

        try {
            const user = await login(userId, password);

            // Redirect based on role
            if (user.role === 'DOCTOR') {
                navigate('/doctor/dashboard');
            } else if (user.role === 'PATIENT') {
                navigate('/patient/dashboard');
            } else if (user.role === 'ADMIN') {
                navigate('/admin/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Back to Home Link */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-primary-700 mb-6 transition-colors font-medium"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Link>

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-full mb-4">
                        <Heart className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">SecureCare<span className="text-primary-500">+</span></h1>
                    <p className="text-slate-600 mt-2">Secure Healthcare Management System</p>
                </div>

                <div className="card shadow-2xl border-white/50 bg-white/80 backdrop-blur-sm">
                    <h2 className="text-2xl font-semibold mb-6 text-center text-slate-900">Sign In</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">User ID</label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="input-field shadow-sm"
                                placeholder="e.g., P001 or D001"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field shadow-sm"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        {/* Privacy Policy Checkbox */}
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 mt-2 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="privacy-policy"
                                        type="checkbox"
                                        checked={acceptPrivacyPolicy}
                                        onChange={(e) => setAcceptPrivacyPolicy(e.target.checked)}
                                        className="h-4 w-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500 transition-all cursor-pointer"
                                    />
                                </div>
                                <div className="ml-3">
                                    <label htmlFor="privacy-policy" className="text-sm font-medium text-slate-700 cursor-pointer">
                                        I agree to the <span className="text-primary-700">Privacy Policy & Data Processing</span> terms
                                    </label>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <Shield className="h-3 w-3 text-primary-500" />
                                        Your data is protected under GDPR and HIPAA standards
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setIsPolicyModalOpen(true)}
                                        className="text-xs text-primary-600 hover:text-primary-700 font-semibold mt-2 flex items-center gap-1 transition-colors"
                                    >
                                        <Info className="h-3 w-3" />
                                        View detailed policies
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-shake">
                                <div className="w-1 h-1 bg-red-700 rounded-full"></div>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`btn-primary w-full py-3 shadow-lg shadow-primary-200 transition-all duration-300 ${isLoading ? 'opacity-70' : 'hover:-translate-y-0.5'}`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center border-t border-slate-100 pt-6">
                        <p className="text-sm text-slate-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-bold text-primary-700 hover:text-primary-800 underline decoration-primary-200 underline-offset-4 decoration-2 hover:decoration-primary-700 transition-all">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <PolicyModal
                isOpen={isPolicyModalOpen}
                onClose={() => setIsPolicyModalOpen(false)}
            />
        </div>
    );
};

export default LoginPage;


