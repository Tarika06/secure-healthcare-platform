import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Upload, FileText, User } from 'lucide-react';
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
                                    <p>Loading...</p>
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
