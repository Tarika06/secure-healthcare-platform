import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, User, Mail, Lock, UserCircle, Stethoscope, Activity, FlaskConical, Info } from 'lucide-react';
import apiClient from '../api/client';
import PolicyModal from '../components/PolicyModal';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        userId: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        role: 'PATIENT',
        specialty: '',
        acceptPrivacyPolicy: false
    });
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!formData.acceptPrivacyPolicy) {
            setError('You must accept the Privacy Policy & Data Processing terms');
            return;
        }

        // Validate userId prefix
        const prefix = formData.userId.charAt(0).toUpperCase();
        if (formData.role === 'PATIENT' && prefix !== 'P') {
            setError('Patient User ID must start with "P" (e.g., P001)');
            return;
        }
        if (formData.role === 'DOCTOR' && prefix !== 'D') {
            setError('Doctor User ID must start with "D" (e.g., D001)');
            return;
        }
        if (formData.role === 'NURSE' && prefix !== 'N') {
            setError('Nurse User ID must start with "N" (e.g., N001)');
            return;
        }
        if (formData.role === 'LAB_TECHNICIAN' && prefix !== 'L') {
            setError('Lab Tech User ID must start with "L" (e.g., L001)');
            return;
        }

        setLoading(true);

        try {
            await apiClient.post('/auth/register', {
                userId: formData.userId,
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: formData.role,
                specialty: formData.specialty,
                acceptPrivacyPolicy: formData.acceptPrivacyPolicy
            });

            // Navigate to login page
            navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-primary-950/20 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <Link to="/" className="inline-block">
                        <h1 className="text-3xl font-bold text-primary-700 dark:text-primary-400">
                            SecureCare<span className="text-primary-500">+</span>
                        </h1>
                    </Link>
                    <h2 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">
                        Create Your Account
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Join the secure healthcare platform
                    </p>
                </div>

                {/* Form */}
                <div className="card-glass dark:bg-slate-900 dark:border-slate-800">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-red-700 dark:bg-red-400 rounded-full"></div>
                                {error}
                            </div>
                        )}

                        {/* Role Selection */}
                        <div>
                            <label className="label dark:text-slate-300">I am a</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { id: 'PATIENT', label: 'Patient', icon: UserCircle },
                                    { id: 'DOCTOR', label: 'Doctor', icon: Stethoscope },
                                    { id: 'NURSE', label: 'Nurse', icon: Activity },
                                    { id: 'LAB_TECHNICIAN', label: 'Lab Tech', icon: FlaskConical }
                                ].map((role) => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, role: role.id }))}
                                        className={`p-3 rounded-xl border-2 transition-all duration-300 ${formData.role === role.id
                                            ? 'border-primary-600 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 ring-4 ring-primary-50 dark:ring-primary-900/10'
                                            : 'border-slate-200 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 bg-white dark:bg-slate-800 shadow-sm'
                                            }`}
                                    >
                                        <role.icon className={`h-6 w-6 mx-auto mb-1 transition-colors ${formData.role === role.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`} />
                                        <span className={`block text-xs font-bold ${formData.role === role.id ? 'text-primary-900 dark:text-primary-200' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {role.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {{
                                    'PATIENT': 'User ID must start with "P" (e.g., P001)',
                                    'DOCTOR': 'User ID must start with "D" (e.g., D001)',
                                    'NURSE': 'User ID must start with "N" (e.g., N001)',
                                    'LAB_TECHNICIAN': 'User ID must start with "L" (e.g., L001)'
                                }[formData.role]}
                            </p>
                        </div>

                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label dark:text-slate-300">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    placeholder="John"
                                />
                            </div>
                            <div>
                                <label className="label dark:text-slate-300">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        {/* User ID and Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label dark:text-slate-300">User ID</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="userId"
                                        value={formData.userId}
                                        onChange={handleChange}
                                        required
                                        className="input-field pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        placeholder={formData.role === 'PATIENT' ? 'P001' : 'D001'}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label dark:text-slate-300">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="input-field pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Specialty (for doctors) */}
                        {formData.role === 'DOCTOR' && (
                            <div className="animate-fade-in">
                                <label className="label dark:text-slate-300">Specialty</label>
                                <input
                                    type="text"
                                    name="specialty"
                                    value={formData.specialty}
                                    onChange={handleChange}
                                    className="input-field border-primary-100 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    placeholder="e.g., Cardiology, Neurology"
                                />
                            </div>
                        )}

                        {/* Password */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label dark:text-slate-300">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="input-field pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label dark:text-slate-300">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className="input-field pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Privacy Policy */}
                        <div className="bg-slate-50/80 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="acceptPrivacyPolicy"
                                        type="checkbox"
                                        name="acceptPrivacyPolicy"
                                        checked={formData.acceptPrivacyPolicy}
                                        onChange={handleChange}
                                        required
                                        className="h-5 w-5 text-primary-600 dark:text-primary-400 border-slate-300 dark:border-slate-600 rounded focus:ring-primary-500 cursor-pointer dark:bg-slate-700"
                                    />
                                </div>
                                <div className="ml-4">
                                    <label htmlFor="acceptPrivacyPolicy" className="text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                                        I agree to the <span className="text-primary-700 dark:text-primary-400">Privacy Policy & Data Processing</span> terms
                                    </label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                                        <Shield className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                                        Your data is protected under GDPR and HIPAA compliance standards
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setIsPolicyModalOpen(true)}
                                        className="text-xs text-primary-700 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-bold mt-3 flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-primary-100 dark:border-primary-900 shadow-sm transition-all hover:shadow-md active:scale-95"
                                    >
                                        <Info className="h-3.5 w-3.5" />
                                        View All HIPAA & GDPR Policies
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`btn-primary w-full py-4 text-lg shadow-xl shadow-primary-200 dark:shadow-primary-900/20 transition-all duration-300 ${loading ? 'opacity-70' : 'hover:-translate-y-1 hover:shadow-primary-300 dark:hover:shadow-primary-900/40'}`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Your Account...
                                </span>
                            ) : 'Create Secure Account'}
                        </button>

                        {/* Login Link */}
                        <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Already have an account?{' '}
                                <Link to="/login" className="font-bold text-primary-700 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 underline decoration-primary-200 dark:decoration-primary-900 underline-offset-4 decoration-2">
                                    Sign in here
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            <PolicyModal
                isOpen={isPolicyModalOpen}
                onClose={() => setIsPolicyModalOpen(false)}
            />
        </div>
    );
};

export default RegisterPage;
