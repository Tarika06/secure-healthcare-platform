import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, User, Mail, Lock, UserCircle, Stethoscope, Activity, FlaskConical, ShieldCheck } from 'lucide-react';
import { Shield, User, Mail, Lock, UserCircle, Stethoscope, Info } from 'lucide-react';
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
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <Link to="/" className="inline-block">
                        <h1 className="text-3xl font-bold text-primary-700">
                            SecureCare<span className="text-primary-500">+</span>
                        </h1>
                    </Link>
                    <h2 className="mt-6 text-3xl font-bold text-slate-900">
                        Create Your Account
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Join the secure healthcare platform
                    </p>
                </div>

                {/* Form */}
                <div className="card-glass">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-red-700 rounded-full"></div>
                                {error}
                            </div>
                        )}

                        {/* Role Selection */}
                        <div>
                            <label className="label">I am a</label>
                            <div className="grid grid-cols-4 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, role: 'PATIENT' }))}
<<<<<<< HEAD
                                    className={`p-3 rounded-lg border-2 transition-all ${formData.role === 'PATIENT'
                                        ? 'border-primary-700 bg-primary-50'
                                        : 'border-slate-300 hover:border-primary-300'
                                        }`}
                                >
                                    <UserCircle className="h-6 w-6 mx-auto mb-1 text-primary-700" />
                                    <span className="block text-xs font-semibold text-slate-900">Patient</span>
=======
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${formData.role === 'PATIENT'
                                        ? 'border-primary-600 bg-primary-50 ring-4 ring-primary-50'
                                        : 'border-slate-200 hover:border-primary-200 bg-white'
                                        }`}
                                >
                                    <UserCircle className={`h-8 w-8 mx-auto mb-2 transition-colors ${formData.role === 'PATIENT' ? 'text-primary-600' : 'text-slate-400'}`} />
                                    <span className={`block font-bold ${formData.role === 'PATIENT' ? 'text-primary-900' : 'text-slate-600'}`}>Patient</span>
>>>>>>> backend_tarika
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, role: 'DOCTOR' }))}
<<<<<<< HEAD
                                    className={`p-3 rounded-lg border-2 transition-all ${formData.role === 'DOCTOR'
                                        ? 'border-primary-700 bg-primary-50'
                                        : 'border-slate-300 hover:border-primary-300'
                                        }`}
                                >
                                    <Stethoscope className="h-6 w-6 mx-auto mb-1 text-primary-700" />
                                    <span className="block text-xs font-semibold text-slate-900">Doctor</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, role: 'NURSE' }))}
                                    className={`p-3 rounded-lg border-2 transition-all ${formData.role === 'NURSE'
                                        ? 'border-primary-700 bg-primary-50'
                                        : 'border-slate-300 hover:border-primary-300'
                                        }`}
                                >
                                    <Activity className="h-6 w-6 mx-auto mb-1 text-primary-700" />
                                    <span className="block text-xs font-semibold text-slate-900">Nurse</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, role: 'LAB_TECHNICIAN' }))}
                                    className={`p-3 rounded-lg border-2 transition-all ${formData.role === 'LAB_TECHNICIAN'
                                        ? 'border-primary-700 bg-primary-50'
                                        : 'border-slate-300 hover:border-primary-300'
                                        }`}
                                >
                                    <FlaskConical className="h-6 w-6 mx-auto mb-1 text-primary-700" />
                                    <span className="block text-xs font-semibold text-slate-900">Lab Tech</span>
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                {{
                                    'PATIENT': 'User ID must start with "P" (e.g., P001)',
                                    'DOCTOR': 'User ID must start with "D" (e.g., D001)',
                                    'NURSE': 'User ID must start with "N" (e.g., N001)',
                                    'LAB_TECHNICIAN': 'User ID must start with "L" (e.g., L001)'
                                }[formData.role]}
=======
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${formData.role === 'DOCTOR'
                                        ? 'border-primary-600 bg-primary-50 ring-4 ring-primary-50'
                                        : 'border-slate-200 hover:border-primary-200 bg-white'
                                        }`}
                                >
                                    <Stethoscope className={`h-8 w-8 mx-auto mb-2 transition-colors ${formData.role === 'DOCTOR' ? 'text-primary-600' : 'text-slate-400'}`} />
                                    <span className={`block font-bold ${formData.role === 'DOCTOR' ? 'text-primary-900' : 'text-slate-600'}`}>Doctor</span>
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-slate-500 font-medium">
                                {formData.role === 'PATIENT'
                                    ? 'User ID must start with "P" (e.g., P001)'
                                    : 'User ID must start with "D" (e.g., D001)'}
>>>>>>> backend_tarika
                            </p>
                        </div>

                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    className="input-field"
                                    placeholder="John"
                                />
                            </div>
                            <div>
                                <label className="label">Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    className="input-field"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        {/* User ID and Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">User ID</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="userId"
                                        value={formData.userId}
                                        onChange={handleChange}
                                        required
                                        className="input-field pl-10"
                                        placeholder={formData.role === 'PATIENT' ? 'P001' : 'D001'}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="input-field pl-10"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Specialty (for doctors) */}
                        {formData.role === 'DOCTOR' && (
                            <div className="animate-fade-in">
                                <label className="label">Specialty</label>
                                <input
                                    type="text"
                                    name="specialty"
                                    value={formData.specialty}
                                    onChange={handleChange}
                                    className="input-field border-primary-100"
                                    placeholder="e.g., Cardiology, Neurology"
                                />
                            </div>
                        )}

                        {/* Password */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="input-field pl-10"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className="input-field pl-10"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Privacy Policy */}
                        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60 shadow-inner">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="acceptPrivacyPolicy"
                                        type="checkbox"
                                        name="acceptPrivacyPolicy"
                                        checked={formData.acceptPrivacyPolicy}
                                        onChange={handleChange}
                                        required
                                        className="h-5 w-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500 cursor-pointer"
                                    />
                                </div>
                                <div className="ml-4">
                                    <label htmlFor="acceptPrivacyPolicy" className="text-sm font-bold text-slate-800 cursor-pointer">
                                        I agree to the <span className="text-primary-700">Privacy Policy & Data Processing</span> terms
                                    </label>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                                        <Shield className="h-3.5 w-3.5 text-primary-600" />
                                        Your data is protected under GDPR and HIPAA compliance standards
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setIsPolicyModalOpen(true)}
                                        className="text-xs text-primary-700 hover:text-primary-800 font-bold mt-3 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-primary-100 shadow-sm transition-all hover:shadow-md active:scale-95"
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
                            className={`btn-primary w-full py-4 text-lg shadow-xl shadow-primary-200 transition-all duration-300 ${loading ? 'opacity-70' : 'hover:-translate-y-1 hover:shadow-primary-300'}`}
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
                        <div className="text-center pt-4 border-t border-slate-100">
                            <p className="text-sm text-slate-600">
                                Already have an account?{' '}
                                <Link to="/login" className="font-bold text-primary-700 hover:text-primary-800 underline decoration-primary-200 underline-offset-4 decoration-2">
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

