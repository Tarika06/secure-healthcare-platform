import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, User, Mail, Lock, UserCircle, Stethoscope, Activity, FlaskConical, ShieldCheck } from 'lucide-react';
import apiClient from '../api/client';

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
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
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
                                    className={`p-3 rounded-lg border-2 transition-all ${formData.role === 'PATIENT'
                                        ? 'border-primary-700 bg-primary-50'
                                        : 'border-slate-300 hover:border-primary-300'
                                        }`}
                                >
                                    <UserCircle className="h-6 w-6 mx-auto mb-1 text-primary-700" />
                                    <span className="block text-xs font-semibold text-slate-900">Patient</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, role: 'DOCTOR' }))}
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

                        {/* User ID */}
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

                        {/* Email */}
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

                        {/* Specialty (for doctors) */}
                        {formData.role === 'DOCTOR' && (
                            <div>
                                <label className="label">Specialty</label>
                                <input
                                    type="text"
                                    name="specialty"
                                    value={formData.specialty}
                                    onChange={handleChange}
                                    className="input-field"
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
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        type="checkbox"
                                        name="acceptPrivacyPolicy"
                                        checked={formData.acceptPrivacyPolicy}
                                        onChange={handleChange}
                                        required
                                        className="checkbox"
                                    />
                                </div>
                                <div className="ml-3">
                                    <label className="text-sm text-slate-700">
                                        I agree to the <span className="font-semibold text-primary-700">Privacy Policy & Data Processing</span> terms
                                    </label>
                                    <p className="text-xs text-slate-500 mt-1">
                                        <Shield className="h-3 w-3 inline mr-1" />
                                        Your data is protected under GDPR and HIPAA compliance standards
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>

                        {/* Login Link */}
                        <div className="text-center">
                            <p className="text-sm text-slate-600">
                                Already have an account?{' '}
                                <Link to="/login" className="font-medium text-primary-700 hover:text-primary-800">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
