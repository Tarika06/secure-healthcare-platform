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
                        <div className="aurora-bg-indigo md:rounded-[2.5rem] rounded-2xl p-10 mb-10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between animate-fade-in border border-white/20 group">
                            <div className="absolute top-0 left-0 w-full h-full shimmer-effect opacity-20 pointer-events-none"></div>

                            <div className="relative z-10 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                    <FlaskConical className="w-4 h-4 text-indigo-300" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-100/60">Diagnostics Station Node</span>
                                </div>
                                <h1 className="text-4xl font-extrabold tracking-tight text-white m-0">
                                    Welcome, <span className="text-indigo-300">{user?.firstName || 'Technician'}</span>
                                </h1>
                                <p className="text-indigo-100/60 text-base font-medium mt-2 max-w-lg">System status: Optimal results processing active.</p>
                            </div>

                            <div className="flex flex-col items-center md:items-end gap-6 mt-8 md:mt-0 relative z-10">
                                <div className="text-right hidden md:block">
                                    <p className="text-[10px] font-black text-indigo-300/80 uppercase tracking-widest mb-1.5 leading-none">Technician ID</p>
                                    <p className="text-sm font-black text-white leading-none font-mono tracking-tighter shadow-sm">LAB-SIGMA-{user?.userId?.slice(-4) || 'AUTH'}</p>
                                </div>
                                <div className="relative group/avatar">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-25 group-hover/avatar:opacity-60 transition duration-1000"></div>
                                    <div className="relative w-16 h-16 rounded-[20px] bg-slate-900 border border-white/10 flex items-center justify-center text-white font-black text-2xl shadow-2xl transform group-hover/avatar:scale-105 transition-all">
                                        {user?.firstName?.[0] || 'L'}{user?.lastName?.[0] || 'T'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {activeTab === 'upload' && (
                            <div className={`animate-fade-in transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Upload Lab Results</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">Submit test results for a patient</p>
                                </div>

                                <form onSubmit={handleUploadResult} className="card-premium space-y-8 p-10 border-slate-100/50 shadow-2xl transition-all duration-700">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-1 h-8 bg-indigo-500 rounded-full"></div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Entry Configuration</h3>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Resident Target</label>
                                            <div className="relative group/input">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" />
                                                <select
                                                    value={uploadForm.patientId}
                                                    onChange={(e) => setUploadForm({ ...uploadForm, patientId: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-10 text-sm font-bold text-slate-700 dark:text-white focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 outline-none transition-all appearance-none"
                                                    required
                                                >
                                                    <option value="">Search for a resident...</option>
                                                    {patients.map((patient) => (
                                                        <option key={patient.userId} value={patient.userId}>
                                                            {patient.firstName} {patient.lastName} — ID: {patient.userId}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                    <Sparkles className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Diagnostic Heading</label>
                                                <input
                                                    type="text"
                                                    value={uploadForm.title}
                                                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 dark:text-white focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 outline-none transition-all shadow-inner"
                                                    placeholder="e.g., Comprehensive Vital Scan"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Protocol Category</label>
                                                <select
                                                    value={uploadForm.testType}
                                                    onChange={(e) => setUploadForm({ ...uploadForm, testType: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 dark:text-white focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 outline-none transition-all shadow-inner appearance-none"
                                                    required
                                                >
                                                    <option value="">Select protocol...</option>
                                                    {testTypes.map((type) => (
                                                        <option key={type} value={type}>{type}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Primary Findings (E2EE Protected)</label>
                                            <textarea
                                                value={uploadForm.results}
                                                onChange={(e) => setUploadForm({ ...uploadForm, results: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 dark:text-white focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 outline-none transition-all shadow-inner min-h-[140px]"
                                                placeholder="Enter clinical findings here..."
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Supplementary Metadata</label>
                                            <textarea
                                                value={uploadForm.notes}
                                                onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 dark:text-white focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 outline-none transition-all shadow-inner min-h-[80px]"
                                                placeholder="Additional observations..."
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !uploadForm.patientId}
                                        className="relative group w-full h-16 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl hover:shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="relative z-10 flex items-center justify-center gap-3">
                                            {loading ? (
                                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <Upload className="w-5 h-5 text-white" />
                                            )}
                                            <span className="text-white font-black uppercase tracking-widest text-sm">
                                                {loading ? 'Processing Upload...' : 'Encrypt & Submit Results'}
                                            </span>
                                        </div>
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
