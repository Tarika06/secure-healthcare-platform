import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Upload, FileText, Search, User, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import MedicalCard from '../../components/MedicalCard';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';

const LabTechDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('upload');
    const [patients, setPatients] = useState([]);
    const [uploadHistory, setUploadHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [mounted, setMounted] = useState(false);

    const [uploadForm, setUploadForm] = useState({
        patientId: '',
        title: '',
        testType: '',
        results: '',
        notes: ''
    });

    useEffect(() => {
        setMounted(true);
        fetchPatients();
    }, []);

    useEffect(() => {
        if (activeTab === 'history') fetchUploadHistory();
    }, [activeTab]);

    const fetchPatients = async () => {
        try {
            const response = await apiClient.get('/records/patients/list');
            setPatients(response.data.patients || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const fetchUploadHistory = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/records/my-created-records');
            setUploadHistory(response.data.records || []);
        } catch (error) {
            console.error('Error fetching upload history:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const filteredPatients = patients.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            <div className="flex">
                <Sidebar
                    items={sidebarItems}
                    activeItem={activeTab}
                    onItemClick={setActiveTab}
                    user={user}
                    onLogout={handleLogout}
                />

                <main className="flex-1 p-8">
                    <div className="max-w-full mx-auto">

                        {/* Upload Tab */}
                        {activeTab === 'upload' && (
                            <div className={`animate-fade-in transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Upload Lab Results</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">Submit test results for a patient</p>
                                </div>

                                <form onSubmit={handleUploadResult} className="card space-y-6">
                                    {/* Patient Selection */}
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
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Test Details */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="label dark:text-slate-300">Test Title</label>
                                            <input
                                                type="text"
                                                value={uploadForm.title}
                                                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                                className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                                placeholder="e.g., Blood Test Results - March 2026"
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

                                    {/* Results */}
                                    <div>
                                        <label className="label dark:text-slate-300">Test Results</label>
                                        <textarea
                                            value={uploadForm.results}
                                            onChange={(e) => setUploadForm({ ...uploadForm, results: e.target.value })}
                                            className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                            rows="5"
                                            placeholder="Enter detailed test results, values, and measurements..."
                                            required
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="label dark:text-slate-300">Additional Notes (Optional)</label>
                                        <textarea
                                            value={uploadForm.notes}
                                            onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                                            className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                            rows="3"
                                            placeholder="Any observations or recommendations..."
                                        />
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={loading || !uploadForm.patientId}
                                        className="btn-glow w-full"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Uploading...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <Upload className="w-5 h-5" />
                                                Upload Lab Results
                                            </span>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* History Tab */}
                        {activeTab === 'history' && (
                            <div className={`animate-fade-in transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Upload History</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">View all lab results you've uploaded</p>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                                    </div>
                                ) : uploadHistory.length === 0 ? (
                                    <div className="card text-center py-16">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <FileText className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Uploads Yet</h3>
                                        <p className="text-slate-500 dark:text-slate-400 mb-6">Your uploaded lab results will appear here</p>
                                        <button onClick={() => setActiveTab('upload')} className="btn-primary">
                                            <Upload className="w-5 h-5 mr-2" />Upload Results
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {uploadHistory.map((record) => (
                                            <MedicalCard key={record._id} record={record} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Access Notice */}
                        <div className={`mt-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                                    <FlaskConical className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-purple-900 dark:text-purple-200">Access Level: Lab Technician</p>
                                    <p className="text-purple-700 dark:text-purple-300 text-sm mt-1">
                                        You can upload lab test results for patients. All uploads are encrypted and logged for compliance. Patient diagnosis and treatment records are controlled by attending physicians.
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
