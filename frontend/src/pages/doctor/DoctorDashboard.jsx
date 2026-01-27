import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Users, Plus, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import consentApi from '../../api/consentApi';

const DoctorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientRecords, setPatientRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAccessModal, setShowAccessModal] = useState(false);
    const [accessError, setAccessError] = useState(null);

    // Create Report Form State
    const [reportForm, setReportForm] = useState({
        patientId: '',
        title: '',
        diagnosis: '',
        details: '',
        prescription: '',
        recordType: 'GENERAL'
    });

    useEffect(() => {
        if (activeTab === 'patients' || activeTab === 'create') {
            fetchPatients();
        }
    }, [activeTab]);

    const fetchPatients = async () => {
        try {
            const response = await apiClient.get('/records/patients/list');
            setPatients(response.data.patients || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const handleCreateReport = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await apiClient.post('/records/create', reportForm);
            alert('Medical report created successfully!');

            // Reset form
            setReportForm({
                patientId: '',
                title: '',
                diagnosis: '',
                details: '',
                prescription: '',
                recordType: 'GENERAL'
            });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create report');
        } finally {
            setLoading(false);
        }
    };

    const handleViewPatientRecords = async (patient) => {
        setSelectedPatient(patient);
        setLoading(true);
        setAccessError(null);

        try {
            const response = await apiClient.get(`/records/patient/${patient.userId}`);
            setPatientRecords(response.data.records || []);
        } catch (error) {
            if (error.response?.status === 403) {
                // Consent required
                setAccessError({
                    type: 'CONSENT_REQUIRED',
                    message: error.response.data.message,
                    patientId: patient.userId
                });
                setShowAccessModal(true);
            } else {
                alert('Failed to fetch patient records');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRequestConsent = async () => {
        try {
            await consentApi.requestConsent(accessError.patientId);
            setShowAccessModal(false);
            alert('Consent request sent successfully! The patient will be notified.');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to send consent request');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar role="DOCTOR" onLogout={handleLogout} />

            <div className="flex-1 overflow-y-auto">
                <div className="container-medical">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900">Doctor Dashboard</h1>
                        <p className="text-slate-600 mt-1">
                            Dr. {user?.firstName} {user?.lastName}
                            {user?.specialty && ` • ${user.specialty}`}
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-4 border-b border-slate-200 mb-8">
                        <button
                            onClick={() => navigate('/doctor/dashboard?tab=overview')}
                            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${activeTab === 'overview'
                                    ? 'border-primary-700 text-primary-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => navigate('/doctor/dashboard?tab=create')}
                            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${activeTab === 'create'
                                    ? 'border-primary-700 text-primary-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Plus className="h-5 w-5 inline mr-2" />
                            Create Report
                        </button>
                        <button
                            onClick={() => navigate('/doctor/dashboard?tab=patients')}
                            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${activeTab === 'patients'
                                    ? 'border-primary-700 text-primary-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Users className="h-5 w-5 inline mr-2" />
                            Patients
                        </button>
                    </div>

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="card-medical">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Users className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">Total Patients</p>
                                        <p className="text-2xl font-bold text-slate-900">{patients.length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="card-medical">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                                        <FileText className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">Quick Actions</p>
                                        <button
                                            onClick={() => navigate('/doctor/dashboard?tab=create')}
                                            className="text-primary-700 font-medium hover:text-primary-800 text-sm"
                                        >
                                            Create Report →
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="card-medical">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">System Status</p>
                                        <p className="text-sm font-medium text-green-600">All Systems Active</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Create Report Tab */}
                    {activeTab === 'create' && (
                        <div className="max-w-3xl">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Medical Report</h2>

                            <form onSubmit={handleCreateReport} className="card space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="label">Patient ID</label>
                                        <select
                                            value={reportForm.patientId}
                                            onChange={(e) => setReportForm({ ...reportForm, patientId: e.target.value })}
                                            required
                                            className="input-field"
                                        >
                                            <option value="">Select Patient</option>
                                            {patients.map(patient => (
                                                <option key={patient.userId} value={patient.userId}>
                                                    {patient.userId} - {patient.firstName} {patient.lastName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="label">Record Type</label>
                                        <select
                                            value={reportForm.recordType}
                                            onChange={(e) => setReportForm({ ...reportForm, recordType: e.target.value })}
                                            className="input-field"
                                        >
                                            <option value="GENERAL">General</option>
                                            <option value="LAB_RESULT">Lab Result</option>
                                            <option value="PRESCRIPTION">Prescription</option>
                                            <option value="DIAGNOSIS">Diagnosis</option>
                                            <option value="IMAGING">Imaging</option>
                                            <option value="VITALS">Vitals</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="label">Report Title</label>
                                    <input
                                        type="text"
                                        value={reportForm.title}
                                        onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                                        required
                                        className="input-field"
                                        placeholder="e.g., Annual Checkup, Blood Test Results"
                                    />
                                </div>

                                <div>
                                    <label className="label">Diagnosis</label>
                                    <input
                                        type="text"
                                        value={reportForm.diagnosis}
                                        onChange={(e) => setReportForm({ ...reportForm, diagnosis: e.target.value })}
                                        required
                                        className="input-field"
                                        placeholder="Primary diagnosis or findings"
                                    />
                                </div>

                                <div>
                                    <label className="label">Details / Notes</label>
                                    <textarea
                                        value={reportForm.details}
                                        onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })}
                                        required
                                        rows="4"
                                        className="input-field"
                                        placeholder="Detailed observations, test results, recommendations..."
                                    />
                                </div>

                                <div>
                                    <label className="label">Prescription (Optional)</label>
                                    <textarea
                                        value={reportForm.prescription}
                                        onChange={(e) => setReportForm({ ...reportForm, prescription: e.target.value })}
                                        rows="3"
                                        className="input-field"
                                        placeholder="Medications, dosage, instructions..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-full"
                                >
                                    {loading ? 'Creating Report...' : 'Create Medical Report'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Patients Tab */}
                    {activeTab === 'patients' && (
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Patient Management</h2>

                            {patients.length === 0 ? (
                                <div className="card text-center py-12">
                                    <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Patients Found</h3>
                                    <p className="text-slate-600">Patients will appear here once registered in the system.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {patients.map(patient => (
                                        <div key={patient.userId} className="card hover:shadow-lg transition-shadow">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-slate-900">
                                                        {patient.firstName} {patient.lastName}
                                                    </h3>
                                                    <p className="text-sm text-slate-600">
                                                        Patient ID: {patient.userId} • {patient.email}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleViewPatientRecords(patient)}
                                                    className="btn-primary"
                                                >
                                                    View Records
                                                </button>
                                            </div>

                                            {selectedPatient?.userId === patient.userId && patientRecords.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-slate-200">
                                                    <h4 className="font-semibold text-slate-900 mb-3">Medical Timeline</h4>
                                                    <div className="space-y-3">
                                                        {patientRecords.map(record => (
                                                            <div key={record._id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                                                                <div className="flex-shrink-0 w-2 bg-primary-700 rounded-full"></div>
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-slate-900">{record.title}</p>
                                                                    <p className="text-sm text-slate-600">{record.diagnosis}</p>
                                                                    <p className="text-xs text-slate-500 mt-1">
                                                                        {new Date(record.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Access Restricted Modal */}
            {showAccessModal && (
                <Modal
                    isOpen={showAccessModal}
                    onClose={() => setShowAccessModal(false)}
                    title="Access Restricted"
                    icon={ShieldAlert}
                >
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-yellow-800 text-sm">
                                {accessError?.message || 'Patient consent is required to view these medical records.'}
                            </p>
                        </div>

                        <p className="text-slate-600 text-sm">
                            This patient's records are protected. You need to request access, and the patient must grant consent before you can view their medical information.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={handleRequestConsent}
                                className="btn-primary flex-1"
                            >
                                Request Consent
                            </button>
                            <button
                                onClick={() => setShowAccessModal(false)}
                                className="btn-outline flex-1"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default DoctorDashboard;
