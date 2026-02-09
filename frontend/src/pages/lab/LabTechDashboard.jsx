import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Upload, ClipboardList, Search, User, CheckCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';

const LabTechDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('upload');
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [formData, setFormData] = useState({
        patientId: '',
        testName: '',
        resultValue: '',
        unit: '',
        referenceRange: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await apiClient.get('/records/patients/list');
            setPatients(response.data.patients || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.post('/mgmt/lab/upload', formData);
            setUploadSuccess(true);
            setFormData({
                patientId: '',
                testName: '',
                resultValue: '',
                unit: '',
                referenceRange: '',
                notes: ''
            });
            setTimeout(() => setUploadSuccess(false), 3000);
        } catch (error) {
            console.error('Error uploading lab result:', error);
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
        { id: 'history', label: 'Upload History', icon: ClipboardList }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-50">
            <div className="flex">
                <Sidebar
                    items={sidebarItems}
                    activeItem={activeTab}
                    onItemClick={setActiveTab}
                    user={user}
                    onLogout={handleLogout}
                />

                <main className="flex-1 p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-2">
                            <FlaskConical className="h-8 w-8 text-primary-600" />
                            <h1 className="text-3xl font-bold text-slate-900">Lab Technician Dashboard</h1>
                        </div>
                        <p className="text-slate-600 mb-8">Upload and manage laboratory test results</p>

                        {activeTab === 'upload' && (
                            <div className="card">
                                <h2 className="text-xl font-semibold text-slate-900 mb-6">Upload Lab Result</h2>

                                {uploadSuccess && (
                                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <p className="text-green-700">Lab result uploaded successfully!</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Patient Selection */}
                                    <div>
                                        <label className="label">Select Patient</label>
                                        <div className="relative mb-2">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search patients..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="input-field pl-10"
                                            />
                                        </div>
                                        <select
                                            name="patientId"
                                            value={formData.patientId}
                                            onChange={handleChange}
                                            required
                                            className="input-field"
                                        >
                                            <option value="">Choose a patient...</option>
                                            {filteredPatients.map(p => (
                                                <option key={p.userId} value={p.userId}>
                                                    {p.firstName} {p.lastName} ({p.userId})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Test Details */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Test Name</label>
                                            <input
                                                type="text"
                                                name="testName"
                                                value={formData.testName}
                                                onChange={handleChange}
                                                required
                                                placeholder="e.g., Complete Blood Count"
                                                className="input-field"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Result Value</label>
                                            <input
                                                type="text"
                                                name="resultValue"
                                                value={formData.resultValue}
                                                onChange={handleChange}
                                                required
                                                placeholder="e.g., 14.5"
                                                className="input-field"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Unit</label>
                                            <input
                                                type="text"
                                                name="unit"
                                                value={formData.unit}
                                                onChange={handleChange}
                                                placeholder="e.g., g/dL"
                                                className="input-field"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Reference Range</label>
                                            <input
                                                type="text"
                                                name="referenceRange"
                                                value={formData.referenceRange}
                                                onChange={handleChange}
                                                placeholder="e.g., 12.0-16.0"
                                                className="input-field"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label">Notes (Optional)</label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            rows="3"
                                            placeholder="Additional notes about the test..."
                                            className="input-field"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary w-full"
                                    >
                                        {loading ? 'Uploading...' : 'Upload Lab Result'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="card">
                                <h2 className="text-xl font-semibold text-slate-900 mb-6">Upload History</h2>
                                <p className="text-slate-500">Your uploaded lab results will appear here.</p>
                            </div>
                        )}

                        {/* Access Restrictions Notice */}
                        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-amber-800 text-sm">
                                <strong>Note:</strong> As a lab technician, you can upload lab results only.
                                Patient medical records, diagnoses, and prescriptions are not accessible.
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default LabTechDashboard;
