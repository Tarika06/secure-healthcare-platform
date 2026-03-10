import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Upload, FileText, User } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import MedicalCard from '../../components/MedicalCard';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { Sparkles } from 'lucide-react';

const LabTechDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('upload');
    const [patients, setPatients] = useState([]);
    const [uploadHistory, setUploadHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const [uploadForm, setUploadForm] = useState({
        patientId: '',
        title: '',
        testType: '',
        results: '',
        notes: ''
    });

    const fetchPatients = useCallback(async () => {
        try {
            const response = await apiClient.get('/records/patients/list');
            setPatients(response.data.patients || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    }, []);

    const fetchUploadHistory = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/records/my-created-records');
            setUploadHistory(response.data.records || []);
        } catch (error) {
            console.error('Error fetching upload history:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setMounted(true);
        fetchPatients();
    }, [fetchPatients]);

    useEffect(() => {
        if (activeTab === 'history') fetchUploadHistory();
    }, [activeTab, fetchUploadHistory]);

    const handleUploadResult = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.post('/records/create', {
                patientId: uploadForm.patientId,
                title: uploadForm.title,
                recordType: 'LAB_RESULT',
                diagnosis: uploadForm.testType,
                details: uploadForm.results,
                prescription: uploadForm.notes
            });
            alert('Lab results uploaded successfully!');
            setUploadForm({ patientId: '', title: '', testType: '', results: '', notes: '' });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to upload results');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const sidebarItems = [
        { id: 'upload', label: 'Upload Results', icon: Upload },
        { id: 'history', label: 'Upload History', icon: FileText }
    ];

    const testTypes = [
        'Complete Blood Count (CBC)',
        'Basic Metabolic Panel',
        'Lipid Panel',
        'Liver Function Tests',
        'Kidney Function Tests',
        'Thyroid Panel',
        'Urinalysis',
        'Blood Glucose',
        'Hemoglobin A1C',
        'Other'
    ];

    return (
        <div className="flex h-screen overflow-hidden dashboard-glass-bg">
            <div className="flex w-full">
                <Sidebar
                    items={sidebarItems}
                    activeItem={activeTab}
                    onItemClick={setActiveTab}
                    user={user}
                    onLogout={handleLogout}
                />

                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-full mx-auto">

                        {/* Header */}
                        <div className="bg-gradient-to-r from-teal-900 to-emerald-900 rounded-3xl p-8 mb-10 shadow-2xl relative overflow-hidden flex items-center justify-between animate-fade-in border border-teal-800/50">
                            {/* Decorative background blurs */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full mix-blend-screen filter blur-[80px] opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500 rounded-full mix-blend-screen filter blur-[60px] opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2 text-teal-200">
                                    <Sparkles className="w-5 h-5" />
                                    <span className="text-sm font-bold uppercase tracking-widest">Laboratory Station</span>
                                </div>
                                <h1 className="text-4xl font-black tracking-tight text-white">
                                    Welcome, <span className="text-teal-300">{user?.firstName || 'Technician'}</span>
                                </h1>
                            </div>
                            <div className="flex items-center gap-4 group cursor-default relative z-10">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-black text-teal-300/80 uppercase tracking-widest leading-none mb-1.5">Staff ID</p>
                                    <p className="text-sm font-bold text-teal-50 leading-none shadow-sm">{user?.userId || 'LAB-TECH'}</p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-teal-800/50 border border-teal-700/50 flex items-center justify-center text-teal-50 font-black text-xl shadow-inner backdrop-blur-sm group-hover:rotate-6 group-hover:scale-105 transition-all duration-300">
                                    {user?.firstName?.[0] || 'L'}{user?.lastName?.[0] || 'T'}
                                </div>
                            </div>
                        </div>

                        {activeTab === 'upload' && (
                            <div className={`animate-fade-in transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Upload Lab Results</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">Submit test results for a patient</p>
                                </div>

                                <form onSubmit={handleUploadResult} className="card space-y-6">
                                    <div>
                                        <label className="label dark:text-slate-300">Select Patient</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                            <select
                                                value={uploadForm.patientId}
                                                onChange={(e) => setUploadForm({ ...uploadForm, patientId: e.target.value })}
                                                className="input-field pl-11 appearance-none dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                                required
                                            >
                                                <option value="" className="dark:bg-slate-900">Select a patient...</option>
                                                {patients.map((patient) => (
                                                    <option key={patient.userId} value={patient.userId} className="dark:bg-slate-900">
                                                        {patient.firstName} {patient.lastName} ({patient.userId})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="label dark:text-slate-300">Test Title</label>
                                            <input
                                                type="text"
                                                value={uploadForm.title}
                                                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                                className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                                placeholder="e.g., Blood Test Results"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="label dark:text-slate-300">Test Type</label>
                                            <select
                                                value={uploadForm.testType}
                                                onChange={(e) => setUploadForm({ ...uploadForm, testType: e.target.value })}
                                                className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                                required
                                            >
                                                <option value="">Select test type...</option>
                                                {testTypes.map((type) => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label dark:text-slate-300">Test Results</label>
                                        <textarea
                                            value={uploadForm.results}
                                            onChange={(e) => setUploadForm({ ...uploadForm, results: e.target.value })}
                                            className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                            rows="5"
                                            placeholder="Enter results..."
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="label dark:text-slate-300">Additional Notes (Optional)</label>
                                        <textarea
                                            value={uploadForm.notes}
                                            onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                                            className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                            rows="3"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !uploadForm.patientId}
                                        className="btn-glow w-full"
                                    >
                                        {loading ? 'Uploading...' : 'Upload Lab Results'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className={`animate-fade-in transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                                <h2 className="text-2xl font-bold mb-6">Upload History</h2>
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-24">
                                        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                                        <p className="text-slate-500 mt-4">Loading history...</p>
                                    </div>
                                ) : uploadHistory.length === 0 ? (
                                    <p>No uploads yet.</p>
                                ) : (
                                    <div className="grid gap-4">
                                        {uploadHistory.map((record) => (
                                            <MedicalCard key={record._id} record={record} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={`mt-8 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-2xl ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="flex items-start gap-4">
                                <FlaskConical className="w-6 h-6 text-purple-600" />
                                <div>
                                    <p className="font-semibold text-purple-900 dark:text-purple-200">Access Level: Lab Technician</p>
                                    <p className="text-purple-700 dark:text-purple-300 text-sm mt-1">
                                        Submit lab results for patient mapping. Encrypted for transit.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default LabTechDashboard;
