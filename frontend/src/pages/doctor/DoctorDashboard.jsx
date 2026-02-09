import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Users, Plus, ShieldAlert, CheckCircle, AlertCircle, ClipboardList } from 'lucide-react';
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
    const [myCreatedRecords, setMyCreatedRecords] = useState([]);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showAccessModal, setShowAccessModal] = useState(false);
    const [accessError, setAccessError] = useState(null);
    const [accessInfo, setAccessInfo] = useState(null);

    const [reportForm, setReportForm] = useState({
        patientId: '', title: '', diagnosis: '', details: '', prescription: '', recordType: 'GENERAL'
    });

    useEffect(() => {
        if (activeTab === 'patients' || activeTab === 'create') fetchPatients();
        if (activeTab === 'myrecords') fetchMyCreatedRecords();
        if (activeTab === 'overview') fetchDashboardStats();
    }, [activeTab]);

    const fetchDashboardStats = async () => {
        try {
            const response = await apiClient.get('/doctor/dashboard');
            setDashboardStats(response.data.stats);
        } catch (error) { console.error('Error fetching dashboard stats:', error); }
    };

    const fetchPatients = async () => {
        try {
            const response = await apiClient.get('/records/patients/list');
            setPatients(response.data.patients || []);
        } catch (error) { console.error('Error fetching patients:', error); }
    };

    const fetchMyCreatedRecords = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/records/my-created-records');
            setMyCreatedRecords(response.data.records || []);
        } catch (error) { console.error('Error fetching my records:', error); }
        finally { setLoading(false); }
    };

    const handleCreateReport = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.post('/records/create', reportForm);
            alert('Medical report created successfully!');
            setReportForm({ patientId: '', title: '', diagnosis: '', details: '', prescription: '', recordType: 'GENERAL' });
        } catch (error) { alert(error.response?.data?.message || 'Failed to create report'); }
        finally { setLoading(false); }
    };

    const handleViewPatientRecords = async (patient) => {
        setSelectedPatient(patient);
        setLoading(true);
        setAccessError(null);
        setAccessInfo(null);
        try {
            const response = await apiClient.get(`/records/patient/${patient.userId}`);
            setPatientRecords(response.data.records || []);
            setAccessInfo(response.data.accessInfo);
        } catch (error) {
            if (error.response?.status === 403) {
                setAccessError({ type: 'CONSENT_REQUIRED', message: error.response.data.message, patientId: patient.userId });
                setShowAccessModal(true);
            } else { alert('Failed to fetch patient records'); }
        } finally { setLoading(false); }
    };

    const handleRequestConsent = async () => {
        try {
            await consentApi.requestConsent(accessError.patientId);
            setShowAccessModal(false);
            alert('Consent request sent successfully!');
        } catch (error) { alert(error.response?.data?.message || 'Failed to send consent request'); }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar role="DOCTOR" onLogout={handleLogout} />
            <div className="flex-1 overflow-y-auto">
                <div className="container-medical">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900">Doctor Dashboard</h1>
                        <p className="text-slate-600 mt-1">Dr. {user?.firstName} {user?.lastName}{user?.specialty && ` • ${user.specialty}`}</p>
                    </div>

                    <div className="flex gap-4 border-b border-slate-200 mb-8 overflow-x-auto">
                        <button onClick={() => navigate('/doctor/dashboard?tab=overview')} className={`pb-3 px-1 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-primary-700 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Dashboard</button>
                        <button onClick={() => navigate('/doctor/dashboard?tab=myrecords')} className={`pb-3 px-1 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'myrecords' ? 'border-primary-700 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><ClipboardList className="h-5 w-5 inline mr-2" />My Records</button>
                        <button onClick={() => navigate('/doctor/dashboard?tab=create')} className={`pb-3 px-1 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'create' ? 'border-primary-700 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Plus className="h-5 w-5 inline mr-2" />Create Report</button>
                        <button onClick={() => navigate('/doctor/dashboard?tab=patients')} className={`pb-3 px-1 border-b-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'patients' ? 'border-primary-700 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Users className="h-5 w-5 inline mr-2" />Patients</button>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="grid md:grid-cols-4 gap-6">
                            <div className="card-medical"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center"><FileText className="h-6 w-6 text-blue-600" /></div><div><p className="text-sm text-slate-600">Records Created</p><p className="text-2xl font-bold text-slate-900">{dashboardStats?.recordsCreated || 0}</p></div></div></div>
                            <div className="card-medical"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center"><CheckCircle className="h-6 w-6 text-green-600" /></div><div><p className="text-sm text-slate-600">Active Consents</p><p className="text-2xl font-bold text-slate-900">{dashboardStats?.activeConsents || 0}</p></div></div></div>
                            <div className="card-medical"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center"><AlertCircle className="h-6 w-6 text-yellow-600" /></div><div><p className="text-sm text-slate-600">Pending Requests</p><p className="text-2xl font-bold text-slate-900">{dashboardStats?.pendingRequests || 0}</p></div></div></div>
                            <div className="card-medical"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center"><Users className="h-6 w-6 text-purple-600" /></div><div><p className="text-sm text-slate-600">Patients Served</p><p className="text-2xl font-bold text-slate-900">{dashboardStats?.patientsServed || 0}</p></div></div></div>
                        </div>
                    )}

                    {activeTab === 'myrecords' && (
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">My Created Records</h2>
                            <p className="text-slate-600 mb-6">Records you have created for patients (visible without consent).</p>
                            {loading ? <div className="text-center py-12"><p>Loading...</p></div> : myCreatedRecords.length === 0 ? (
                                <div className="card text-center py-12">
                                    <ClipboardList className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Records Created Yet</h3>
                                    <button onClick={() => navigate('/doctor/dashboard?tab=create')} className="btn-primary">Create Report</button>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {myCreatedRecords.map(record => (
                                        <div key={record._id} className="card hover:shadow-lg transition-shadow">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${record.recordType === 'PRESCRIPTION' ? 'bg-purple-100 text-purple-700' : record.recordType === 'LAB_RESULT' ? 'bg-blue-100 text-blue-700' : record.recordType === 'DIAGNOSIS' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{record.recordType}</span>
                                                <span className="px-2 py-1 text-[10px] rounded bg-red-50 text-red-600 border border-red-100 font-bold uppercase tracking-tighter">HIPAA</span>
                                                <span className="text-sm text-slate-500">{new Date(record.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-900">{record.title}</h3>
                                            <p className="text-sm text-slate-600">Patient: {record.patientName}</p>
                                            <p className="text-slate-700 mt-2"><strong>Diagnosis:</strong> {record.diagnosis}</p>
                                            <p className="text-slate-600 mt-1 text-sm">{record.details}</p>
                                            {record.prescription && <p className="text-slate-600 mt-2 text-sm bg-green-50 p-2 rounded"><strong>Rx:</strong> {record.prescription}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'create' && (
                        <div className="max-w-3xl">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Medical Report</h2>
                            <form onSubmit={handleCreateReport} className="card space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div><label className="label">Patient ID</label><select value={reportForm.patientId} onChange={(e) => setReportForm({ ...reportForm, patientId: e.target.value })} required className="input-field"><option value="">Select Patient</option>{patients.map(p => <option key={p.userId} value={p.userId}>{p.userId} - {p.firstName} {p.lastName}</option>)}</select></div>
                                    <div><label className="label">Record Type</label><select value={reportForm.recordType} onChange={(e) => setReportForm({ ...reportForm, recordType: e.target.value })} className="input-field"><option value="GENERAL">General</option><option value="LAB_RESULT">Lab Result</option><option value="PRESCRIPTION">Prescription</option><option value="DIAGNOSIS">Diagnosis</option><option value="IMAGING">Imaging</option><option value="VITALS">Vitals</option></select></div>
                                </div>
                                <div><label className="label">Title</label><input type="text" value={reportForm.title} onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })} required className="input-field" placeholder="e.g., Annual Checkup" /></div>
                                <div><label className="label">Diagnosis</label><input type="text" value={reportForm.diagnosis} onChange={(e) => setReportForm({ ...reportForm, diagnosis: e.target.value })} required className="input-field" placeholder="Primary diagnosis" /></div>
                                <div><label className="label">Details</label><textarea value={reportForm.details} onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })} required rows="4" className="input-field" placeholder="Observations..." /></div>
                                <div><label className="label">Prescription (Optional)</label><textarea value={reportForm.prescription} onChange={(e) => setReportForm({ ...reportForm, prescription: e.target.value })} rows="3" className="input-field" placeholder="Medications..." /></div>
                                <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Creating...' : 'Create Report'}</button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'patients' && (
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Patient Management</h2>
                            {patients.length === 0 ? <div className="card text-center py-12"><Users className="h-16 w-16 text-slate-300 mx-auto mb-4" /><h3 className="text-lg font-semibold text-slate-900">No Patients Found</h3></div> : (
                                <div className="grid gap-4">
                                    {patients.map(patient => (
                                        <div key={patient.userId} className="card hover:shadow-lg transition-shadow">
                                            <div className="flex items-center justify-between">
                                                <div><h3 className="text-lg font-semibold text-slate-900">{patient.firstName} {patient.lastName}</h3><p className="text-sm text-slate-600">ID: {patient.userId} • {patient.email}</p></div>
                                                <button onClick={() => handleViewPatientRecords(patient)} className="btn-primary">View Records</button>
                                            </div>
                                            {selectedPatient?.userId === patient.userId && patientRecords.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-slate-200">
                                                    {accessInfo && !accessInfo.fullAccess && (
                                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                                                            <div>
                                                                <p className="text-yellow-800 text-sm">{accessInfo.message}</p>
                                                                {accessInfo.hiddenRecordCount > 0 && (
                                                                    <p className="text-yellow-600 text-xs mt-1">
                                                                        {accessInfo.hiddenRecordCount} additional records require consent
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setAccessError({ patientId: patient.userId });
                                                                    handleRequestConsent();
                                                                }}
                                                                className="btn-primary text-xs py-1.5 px-3"
                                                            >
                                                                Request Consent
                                                            </button>
                                                        </div>
                                                    )}
                                                    <h4 className="font-semibold text-slate-900 mb-3">Medical Timeline</h4>
                                                    <div className="space-y-3">{patientRecords.map(record => <div key={record._id} className="flex gap-3 p-3 bg-slate-50 rounded-lg"><div className="flex-shrink-0 w-2 bg-primary-700 rounded-full"></div><div className="flex-1"><div className="flex justify-between items-start"><p className="font-medium text-slate-900">{record.title}</p><span className="px-2 py-0.5 text-[8px] rounded bg-red-50 text-red-600 border border-red-100 font-bold uppercase">HIPAA</span></div><p className="text-sm text-slate-600">{record.diagnosis}</p><p className="text-xs text-slate-500 mt-1">{new Date(record.createdAt).toLocaleDateString()}</p></div></div>)}</div>
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

            {showAccessModal && (
                <Modal isOpen={showAccessModal} onClose={() => setShowAccessModal(false)} title="Access Restricted" icon={ShieldAlert}>
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"><p className="text-yellow-800 text-sm">{accessError?.message || 'Patient consent required.'}</p></div>
                        <div className="flex gap-3"><button onClick={handleRequestConsent} className="btn-primary flex-1">Request Consent</button><button onClick={() => setShowAccessModal(false)} className="btn-outline flex-1">Cancel</button></div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default DoctorDashboard;
