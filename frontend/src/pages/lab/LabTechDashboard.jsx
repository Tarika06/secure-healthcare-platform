import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Upload, FileText, Search, User, CheckCircle, Clock, AlertCircle, ArrowRight, Edit2, Save } from 'lucide-react';
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
        patientId: '', title: '', testType: '', results: '', notes: ''
    });

    // --- Edit Record State & Handlers ---
    const [editingRecordId, setEditingRecordId] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', testType: '', results: '', notes: '' });
    const [updatingRecord, setUpdatingRecord] = useState(false);

    useEffect(() => { setMounted(true); fetchPatients(); }, []);
    useEffect(() => { if (activeTab === 'history') fetchUploadHistory(); }, [activeTab]);

    const fetchPatients = async () => {
        try {
            const response = await apiClient.get('/records/patients/list');
            setPatients(response.data.patients || []);
        } catch (error) { console.error('Error fetching patients:', error); }
    };

    const fetchUploadHistory = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/records/my-created-records');
            setUploadHistory(response.data.records || []);
        } catch (error) { console.error('Error fetching upload history:', error); }
        finally { setLoading(false); }
    };

    const handleUploadResult = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.post('/records/create', {
                patientId: uploadForm.patientId, title: uploadForm.title,
                recordType: 'LAB_RESULT', diagnosis: uploadForm.testType,
                details: uploadForm.results, prescription: uploadForm.notes
            });
            alert('Lab results uploaded successfully!');
            setUploadForm({ patientId: '', title: '', testType: '', results: '', notes: '' });
        } catch (error) { alert(error.response?.data?.message || 'Failed to upload results'); }
        finally { setLoading(false); }
    };

    const handleEditRecordClick = (record) => {
        setEditingRecordId(record._id);
        setEditForm({
            title: record.title,
            testType: record.diagnosis || '', // Lab test type is stored in diagnosis
            results: record.details || '',    // Lab results are stored in details
            notes: record.prescription || ''  // Lab notes are stored in prescription
        });
    };

    const handleUpdateRecord = async (e) => {
        e.preventDefault();
        setUpdatingRecord(true);
        try {
            await apiClient.put(`/records/${editingRecordId}`, {
                title: editForm.title,
                recordType: 'LAB_RESULT',
                diagnosis: editForm.testType,
                details: editForm.results,
                prescription: editForm.notes
            });
            alert('Lab record updated successfully!');
            setEditingRecordId(null);
            fetchUploadHistory(); // Refresh the list
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update lab record');
        } finally {
            setUpdatingRecord(false);
        }
    };

    const handleLogout = async () => { await logout(); navigate('/login'); };

    const sidebarItems = [
        { id: 'upload', label: 'Upload Results', icon: Upload },
        { id: 'history', label: 'Upload History', icon: FileText }
    ];

    const testTypes = [
        'Complete Blood Count (CBC)', 'Basic Metabolic Panel', 'Lipid Panel',
        'Liver Function Tests', 'Kidney Function Tests', 'Thyroid Panel',
        'Urinalysis', 'Blood Glucose', 'Hemoglobin A1C', 'Other'
    ];

    const getStatusColor = (idx) => {
        const colors = ['border-violet-400', 'border-blue-400', 'border-emerald-400', 'border-amber-400', 'border-rose-400'];
        return colors[idx % colors.length];
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white transition-colors duration-500">
            <Sidebar
                role="LAB_TECHNICIAN"
                items={sidebarItems}
                activeItem={activeTab}
                onItemClick={setActiveTab}
                user={user}
                onLogout={handleLogout}
            />

            <div className="flex-1 overflow-y-auto relative z-10">
                {/* Sticky Header */}
                <div className="sticky top-0 z-20 px-6 py-3 bg-slate-50/80 backdrop-blur-md border-b border-white/40 dark:bg-slate-900/80 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                            <FlaskConical className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-heading font-bold text-slate-900">Lab Portal</h1>
                            <p className="text-xs text-slate-500">{user?.firstName} {user?.lastName}</p>
                        </div>
                        <div className="ml-auto security-badge">
                            <FlaskConical className="w-3.5 h-3.5" />
                            <span>Lab Technician</span>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-8 max-w-4xl mx-auto">

                    {/* Upload Tab */}
                    {activeTab === 'upload' && (
                        <div className="tab-content">
                            <div className="mb-6">
                                <h2 className="text-2xl font-heading font-bold text-slate-900">Upload Lab Results</h2>
                                <p className="text-slate-500 mt-1">Submit test results for a patient</p>
                            </div>

                            <form onSubmit={handleUploadResult} className="glass-card space-y-6">
                                {/* Patient Selection */}
                                <div>
                                    <label className="label">Select Patient</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <select
                                            value={uploadForm.patientId}
                                            onChange={(e) => setUploadForm({ ...uploadForm, patientId: e.target.value })}
                                            className="input-field pl-11 appearance-none"
                                            required
                                        >
                                            <option value="">Select a patient...</option>
                                            {patients.map((patient) => (
                                                <option key={patient.userId} value={patient.userId}>
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

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="label">Test Title</label>
                                        <input type="text" value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })} className="input-field" placeholder="e.g., Blood Test Results - March 2026" required />
                                    </div>
                                    <div>
                                        <label className="label">Test Type</label>
                                        <select value={uploadForm.testType} onChange={(e) => setUploadForm({ ...uploadForm, testType: e.target.value })} className="input-field" required>
                                            <option value="">Select test type...</option>
                                            {testTypes.map((type) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="label">Test Results</label>
                                    <textarea value={uploadForm.results} onChange={(e) => setUploadForm({ ...uploadForm, results: e.target.value })} className="input-field" rows="5" placeholder="Enter detailed test results, values, and measurements..." required />
                                </div>

                                <div>
                                    <label className="label">Additional Notes (Optional)</label>
                                    <textarea value={uploadForm.notes} onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })} className="input-field" rows="3" placeholder="Any observations or recommendations..." />
                                </div>

                                <button type="submit" disabled={loading || !uploadForm.patientId} className="btn-glow w-full">
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <Upload className="w-5 h-5" />Upload Lab Results
                                        </span>
                                    )}
                                </button>
                            </form>

                            {/* Access Notice */}
                            <div className="glass-card border-l-4 border-violet-400 bg-gradient-to-r from-violet-50/60 to-purple-50/40 mt-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                        <FlaskConical className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-violet-900 text-sm">Access Level: Lab Technician</p>
                                        <p className="text-violet-700 text-xs mt-1">
                                            You can upload lab test results for patients. All uploads are encrypted and logged for compliance.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <div className="tab-content">
                            <div className="mb-6">
                                <h2 className="text-2xl font-heading font-bold text-slate-900">Upload History</h2>
                                <p className="text-slate-500 mt-1">View all lab results you've uploaded</p>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                                </div>
                            ) : uploadHistory.length === 0 ? (
                                <div className="glass-card text-center py-16">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-violet-50 flex items-center justify-center">
                                        <FileText className="w-10 h-10 text-violet-300 animate-float" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-2">No Uploads Yet</h3>
                                    <p className="text-slate-500 mb-6">Your uploaded lab results will appear here</p>
                                    <button onClick={() => setActiveTab('upload')} className="btn-glow flex items-center gap-2 mx-auto">
                                        <Upload className="w-5 h-5" /> Upload Results
                                    </button>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {uploadHistory.map((record, idx) => (
                                        <div key={record._id} className={`glass-card border-l-4 ${getStatusColor(idx)} hover:shadow-glass-hover stagger-item`}
                                            style={{ animationDelay: `${idx * 80}ms` }}
                                        >
                                            {editingRecordId === record._id ? (
                                                <form onSubmit={handleUpdateRecord} className="space-y-4">
                                                    <div className="flex justify-between items-center bg-violet-50 -mt-6 -mx-6 px-6 py-4 mb-4 rounded-t-2xl border-b border-violet-100">
                                                        <h3 className="font-bold text-violet-900 flex items-center gap-2">
                                                            <Edit2 className="w-5 h-5" /> Editing Lab Result
                                                        </h3>
                                                        <div className="flex gap-2">
                                                            <button type="button" onClick={() => setEditingRecordId(null)} className="btn-outline text-xs py-1.5 px-3">Cancel</button>
                                                            <button type="submit" disabled={updatingRecord} className="btn-primary flex items-center gap-1 text-xs py-1.5 px-3">
                                                                {updatingRecord ? 'Saving...' : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="label text-xs">Test Title</label>
                                                            <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} required className="input-field py-2" />
                                                        </div>
                                                        <div>
                                                            <label className="label text-xs">Test Type</label>
                                                            <select value={editForm.testType} onChange={e => setEditForm({ ...editForm, testType: e.target.value })} className="input-field py-2">
                                                                {testTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="label text-xs">Test Results</label>
                                                        <textarea value={editForm.results} onChange={e => setEditForm({ ...editForm, results: e.target.value })} required rows="4" className="input-field" />
                                                    </div>
                                                    <div>
                                                        <label className="label text-xs">Additional Notes (Optional)</label>
                                                        <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows="2" className="input-field" />
                                                    </div>
                                                </form>
                                            ) : (
                                                <>
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                                                                <FlaskConical className="w-5 h-5 text-violet-600" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-bold text-slate-900">{record.title}</h3>
                                                                <p className="text-sm text-slate-500">Patient: {record.patientName}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleEditRecordClick(record)}
                                                                className="text-slate-400 hover:text-violet-600 transition-colors p-1.5 hover:bg-violet-50 rounded-lg flex items-center gap-1 text-xs font-semibold"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" /> Edit
                                                            </button>
                                                            <span className="badge badge-lab">LAB RESULT</span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 space-y-3">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="font-medium text-slate-700">Test Type:</span>
                                                            <span className="text-slate-600">{record.diagnosis}</span>
                                                        </div>
                                                        <div className="glass-card-l3 p-3">
                                                            <p className="text-sm text-slate-600 whitespace-pre-line">{record.details}</p>
                                                        </div>
                                                        {record.prescription && (
                                                            <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                                                                <p className="text-sm text-amber-800 whitespace-pre-line"><strong>Notes:</strong> {record.prescription}</p>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            Uploaded on {new Date(record.createdAt).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabTechDashboard;
