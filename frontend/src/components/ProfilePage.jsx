import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Shield, Calendar, Building, ArrowLeft, Edit, Camera, CheckCircle, X, Eye, EyeOff, Lock, AlertCircle, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const ProfilePage = ({ role, dashboardPath }) => {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Edit profile form state
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        specialty: ''
    });

    // Change password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (user) {
            setEditForm({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                specialty: user.specialty || ''
            });
        }
    }, [user]);

    const getRoleColor = () => {
        switch (role) {
            case 'ADMIN': return 'from-purple-500 to-violet-600';
            case 'DOCTOR': return 'from-blue-500 to-indigo-600';
            case 'PATIENT': return 'from-primary-500 to-teal-500';
            case 'NURSE': return 'from-green-500 to-emerald-600';
            case 'LAB_TECHNICIAN': return 'from-purple-500 to-indigo-600';
            default: return 'from-primary-500 to-teal-500';
        }
    };

    const getRoleBg = () => {
        switch (role) {
            case 'ADMIN': return 'dashboard-bg-admin';
            case 'DOCTOR': return 'dashboard-bg-doctor';
            case 'PATIENT': return 'dashboard-bg-patient';
            case 'NURSE': return 'dashboard-bg-nurse';
            case 'LAB_TECHNICIAN': return 'dashboard-bg-lab';
            default: return 'dashboard-bg';
        }
    };

    const getRoleLabel = () => {
        switch (role) {
            case 'ADMIN': return 'Administrator';
            case 'DOCTOR': return 'Doctor';
            case 'PATIENT': return 'Patient';
            case 'NURSE': return 'Nurse';
            case 'LAB_TECHNICIAN': return 'Lab Technician';
            default: return 'User';
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Not available';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleEditProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await apiClient.put('/user/profile', editForm);
            setSuccess('Profile updated successfully!');
            if (refreshUser) await refreshUser();
            setTimeout(() => {
                setShowEditModal(false);
                setSuccess('');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('New passwords do not match');
            setLoading(false);
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            await apiClient.put('/user/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            setSuccess('Password changed successfully!');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => {
                setShowPasswordModal(false);
                setSuccess('');
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const profileFields = [
        { icon: User, label: 'Full Name', value: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Not set' },
        { icon: Mail, label: 'Email Address', value: user?.email || 'Not set' },
        { icon: Shield, label: 'User ID', value: user?.userId || 'Not set' },
        { icon: Building, label: 'Role', value: getRoleLabel() },
        { icon: Phone, label: 'Phone', value: user?.phone || 'Not provided' },
        { icon: Calendar, label: 'Member Since', value: formatDate(user?.createdAt) },
    ];

    if (role === 'DOCTOR' && user?.specialty) {
        profileFields.splice(4, 0, { icon: Building, label: 'Specialty', value: user.specialty });
    }

    return (
        <div className={`min-h-screen ${getRoleBg()} bg-dots`}>
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate(dashboardPath)}
                    className={`flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-all duration-300 group ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">Back to Dashboard</span>
                </button>

                {/* Profile Header Card */}
                <div className={`profile-card text-center mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    {/* Avatar */}
                    <div className="relative inline-block mb-6">
                        <div className={`profile-avatar bg-gradient-to-br ${getRoleColor()}`}>
                            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </div>
                    </div>

                    {/* Name & Role */}
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        {user?.firstName} {user?.lastName}
                    </h1>
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r ${getRoleColor()}`}>
                            {getRoleLabel()}
                        </span>
                    </div>
                    <p className="text-slate-500">
                        {user?.email}
                    </p>

                    {/* Status Badge */}
                    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Account Verified</span>
                    </div>
                </div>

                {/* Profile Details Card */}
                <div className={`profile-card transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Profile Information</h2>
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                            Edit Profile
                        </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {profileFields.map((field, idx) => (
                            <div
                                key={idx}
                                className="profile-info-row stagger-item"
                                style={{ animationDelay: `${300 + idx * 100}ms` }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center`}>
                                        <field.icon className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <span className="profile-label">{field.label}</span>
                                </div>
                                <span className="profile-value">{field.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Security Card */}
                <div className={`profile-card mt-8 transition-all duration-700 delay-400 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-teal-100 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Security</h2>
                            <p className="text-sm text-slate-500">Manage your account security</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div>
                                <p className="font-medium text-slate-900">Password</p>
                                <p className="text-sm text-slate-500">Change your account password</p>
                            </div>
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="btn-outline text-sm"
                            >
                                Change Password
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user?.mfaEnabled ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                                    <div className="flex items-center gap-1.5">
                                        {user?.mfaEnabled ? (
                                            <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                                                <CheckCircle className="w-3 h-3" /> Active
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-500 italic">Not configured</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/mfa-setup')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${user?.mfaEnabled
                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                    : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-500/20'
                                    }`}
                            >
                                {user?.mfaEnabled ? 'Manage MFA' : 'Set Up MFA'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Logout Button */}
                <div className={`mt-8 text-center transition-all duration-700 delay-600 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="text-red-600 hover:text-red-700 font-medium transition-colors"
                    >
                        Sign Out of Account
                    </button>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900">Edit Profile</h3>
                            <button onClick={() => { setShowEditModal(false); setError(''); setSuccess(''); }} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleEditProfile} className="p-6 space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    {success}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={editForm.firstName}
                                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={editForm.lastName}
                                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="input-field"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>

                            {role === 'DOCTOR' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
                                    <input
                                        type="text"
                                        value={editForm.specialty}
                                        onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                                        className="input-field"
                                        placeholder="e.g., Cardiology, Pediatrics"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setError(''); setSuccess(''); }}
                                    className="btn-outline flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary flex-1"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                                    <Lock className="w-5 h-5 text-amber-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Change Password</h3>
                            </div>
                            <button onClick={() => { setShowPasswordModal(false); setError(''); setSuccess(''); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    {success}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                        className="input-field pr-12"
                                        required
                                        placeholder="Enter your current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                        className="input-field pr-12"
                                        required
                                        placeholder="Enter new password (min 6 characters)"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className="input-field"
                                    required
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowPasswordModal(false); setError(''); setSuccess(''); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                                    className="btn-outline flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary flex-1"
                                    disabled={loading}
                                >
                                    {loading ? 'Changing...' : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
