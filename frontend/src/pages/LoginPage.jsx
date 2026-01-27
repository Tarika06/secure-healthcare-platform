import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, ArrowLeft } from 'lucide-react';

const LoginPage = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

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

                <div className="card">
                    <h2 className="text-2xl font-semibold mb-6 text-center">Sign In</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">User ID</label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="input-field"
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
                                className="input-field"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-medium text-primary-700 hover:text-primary-800">
                                Create Account
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <p className="text-sm text-slate-600 text-center">
                            Demo Credentials:<br />
                            Patient: <span className="font-mono font-semibold">P001</span> / <span className="font-mono">password</span><br />
                            Doctor: <span className="font-mono font-semibold">D001</span> / <span className="font-mono">password</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
