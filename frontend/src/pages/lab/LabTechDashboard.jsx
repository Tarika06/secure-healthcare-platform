import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Upload, FileText, Search, User, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
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

    const handleLogout = () => { logout(); navigate('/login'); };

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
        <div className="flex min-h-screen dashboard-glass-bg">
            <div className="flex">
                <Sidebar
                    items={sidebarItems}
                    activeItem={activeTab}
                    onItemClick={setActiveTab}
                    user={user}
                    onLogout={handleLogout}
                />

                <main className="flex-1 p-8">
                    <div className="max-w-5xl mx-auto">
                        {/* Header */}
                        <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                                    <FlaskConical className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900">Lab Portal</h1>
                                    <p className="text-slate-500">Welcome back, <span className="text-purple-600 font-medium">{user?.firstName} {user?.lastName}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Upload Tab */}
                        {activeTab === 'upload' && (
                            <div className={`transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-slate-900">Upload Lab Results</h2>
                                    <p className="text-slate-500 mt-1">Submit test results for a patient</p>
                                </div>

                                <form onSubmit={handleUploadResult} className="card space-y-6">
                                    {/* Patient Selection */}
                                    <div>
                                        <label className="label">Select Patient</label>
                                        <div className="relative mb-3">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search patients..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="input-field pl-11"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-1">
                                            {filteredPatients.map((patient) => (
                                                <button
                                                    key={patient.userId}
                                                    type="button"
                                                    onClick={() => setUploadForm({ ...uploadForm, patientId: patient.userId })}
                                                    className={`p-3 rounded-xl text-left transition-all duration-300 border ${uploadForm.patientId === patient.userId
                                                        ? 'bg-gradient-to-r from-primary-50 to-teal-50 border-primary-300 shadow-md ring-2 ring-primary-200'
                                                        : 'hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${uploadForm.patientId === patient.userId
                                                            ? 'bg-gradient-to-br from-primary-500 to-teal-500'
                                                            : 'bg-slate-400'
                                                            }`}>
                                                            {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-slate-900 text-sm truncate">{patient.firstName} {patient.lastName}</p>
                                                            <p className="text-xs text-slate-500">{patient.userId}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Test Details */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="label">Test Title</label>
                                            <input
                                                type="text"
                                                value={uploadForm.title}
                                                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                                                className="input-field"
                                                placeholder="e.g., Blood Test Results - March 2026"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Test Type</label>
                                            <select
                                                value={uploadForm.testType}
                                                onChange={(e) => setUploadForm({ ...uploadForm, testType: e.target.value })}
                                                className="input-field"
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
                                        <label className="label">Test Results</label>
                                        <textarea
                                            value={uploadForm.results}
                                            onChange={(e) => setUploadForm({ ...uploadForm, results: e.target.value })}
                                            className="input-field"
                                            rows="5"
                                            placeholder="Enter detailed test results, values, and measurements..."
                                            required
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="label">Additional Notes (Optional)</label>
                                        <textarea
                                            value={uploadForm.notes}
                                            onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                                            className="input-field"
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
                            <div className={`transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-slate-900">Upload History</h2>
                                    <p className="text-slate-500 mt-1">View all lab results you've uploaded</p>
                                </div>

                                {loading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                                    </div>
                                ) : uploadHistory.length === 0 ? (
                                    <div className="card text-center py-16">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                                            <FileText className="w-10 h-10 text-slate-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-900 mb-2">No Uploads Yet</h3>
                                        <p className="text-slate-500 mb-6">Your uploaded lab results will appear here</p>
                                        <button onClick={() => setActiveTab('upload')} className="btn-primary">
                                            <Upload className="w-5 h-5 mr-2" />Upload Results
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {uploadHistory.map((record, idx) => (
                                            <div
                                                key={record._id}
                                                className="card hover:shadow-xl transition-all duration-300"
                                                style={{ animationDelay: `${idx * 100}ms` }}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                                                            <FlaskConical className="w-6 h-6 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-slate-900">{record.title}</h3>
                                                            <p className="text-sm text-slate-500">Patient: {record.patientName}</p>
                                                        </div>
                                                    </div>
                                                    <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full ring-1 ring-purple-200">
                                                        LAB RESULT
                                                    </span>
                                                </div>

                                                <div className="mt-4 space-y-3">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="font-medium text-slate-700">Test Type:</span>
                                                        <span className="text-slate-600">{record.diagnosis}</span>
                                                    </div>

                                                    <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100">
                                                        <p className="text-sm text-slate-600">{record.details}</p>
                                                    </div>

                                                    {record.prescription && (
                                                        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                                                            <p className="text-sm text-amber-800"><strong>Notes:</strong> {record.prescription}</p>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
                                                        <Clock className="w-4 h-4" />
                                                        Uploaded on {new Date(record.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Access Notice */}
                        <div className={`mt-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                                    <FlaskConical className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-purple-900">Access Level: Lab Technician</p>
                                    <p className="text-purple-700 text-sm mt-1">
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
