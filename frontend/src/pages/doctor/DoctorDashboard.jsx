import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Users, Plus, ShieldAlert, CheckCircle, AlertCircle, ClipboardList, Stethoscope, Calendar, TrendingUp, MailCheck, Search, ArrowRight, ChevronRight, Clock, Send, MessageSquare, Paperclip } from 'lucide-react';
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
    const [mounted, setMounted] = useState(false);
    const [showConsentSentModal, setShowConsentSentModal] = useState(false);
    const [confirmConsentModal, setConfirmConsentModal] = useState(false);
    const [consentSentPatient, setConsentSentPatient] = useState(null);
    const [pendingConsentIds, setPendingConsentIds] = useState([]);
    const [loadingPatientId, setLoadingPatientId] = useState(null);
    const [patientSearch, setPatientSearch] = useState('');
    const [doctors, setDoctors] = useState([]);
    const [collaborations, setCollaborations] = useState({ incoming: [], outgoing: [] });
    const [selectedCollab, setSelectedCollab] = useState(null);
    const [collabMessages, setCollabMessages] = useState([]);
    const [sharedRecords, setSharedRecords] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showRequestCollabModal, setShowRequestCollabModal] = useState(false);
    const [requestCollabForm, setRequestCollabForm] = useState({
        patientId: '',
        consultingDoctorId: '',
        accessScope: 'SUMMARY',
        message: '',
        expiresAt: ''
    });

    const handleConfirmRequest = async () => {
        if (!consentSentPatient) return;
        setConfirmConsentModal(false);
        try {
            await consentApi.requestConsent(consentSentPatient.userId);
            setPendingConsentIds(ids => [...ids, consentSentPatient.userId]);
            setPatients(prev => prev.map(p =>
                p.userId === consentSentPatient.userId ? { ...p, consentPending: true } : p
            ));
            setShowConsentSentModal(true);
        } catch (e) {
            const msg = e?.response?.data?.message || 'Failed to send consent request';
            if (msg.includes("pending")) {
                setPendingConsentIds(ids => [...ids, consentSentPatient.userId]);
                setPatients(prev => prev.map(p =>
                    p.userId === consentSentPatient.userId ? { ...p, consentPending: true } : p
                ));
            }
            alert(msg);
        }
    };

    const [reportForm, setReportForm] = useState({
        patientId: '', title: '', diagnosis: '', details: '', prescription: '', recordType: 'GENERAL'
    });

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (activeTab === 'patients' || activeTab === 'create') fetchPatients();
        if (activeTab === 'myrecords') fetchMyCreatedRecords();
        if (activeTab === 'overview') fetchDashboardStats();
        if (activeTab === 'collaboration') {
            fetchCollaborations();
            fetchDoctors();
        }
    }, [activeTab]);

    const fetchCollaborations = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/collaboration/my-requests');
            setCollaborations(response.data);
        } catch (error) { console.error('Error fetching collaborations:', error); }
        finally { setLoading(false); }
    };

    const fetchDoctors = async () => {
        try {
            const response = await apiClient.get('/doctor/list');
            setDoctors(response.data.doctors || []);
        } catch (error) { console.error('Error fetching doctors:', error); }
    };

    const fetchCollabDetails = async (collab) => {
        setSelectedCollab(collab);
        setLoading(true);
        try {
            const [msgRes, dataRes] = await Promise.all([
                apiClient.get(`/collaboration/${collab._id}/messages`),
                collab.status === 'ACCEPTED' ? apiClient.get(`/collaboration/${collab._id}/patient-data`) : Promise.resolve({ data: { records: [] } })
            ]);
            setCollabMessages(msgRes.data.messages || []);
            setSharedRecords(dataRes.data.records || []);
        } catch (error) { console.error('Error fetching collab details:', error); }
        finally { setLoading(false); }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            await apiClient.post(`/collaboration/${selectedCollab._id}/message`, { message: newMessage });
            setNewMessage('');
            // Refresh messages
            const resp = await apiClient.get(`/collaboration/${selectedCollab._id}/messages`);
            setCollabMessages(resp.data.messages || []);
        } catch (error) { alert(error.response?.data?.message || 'Failed to send message'); }
    };

    const handleRespondToCollab = async (id, status) => {
        try {
            await apiClient.patch(`/collaboration/respond/${id}`, { status });
            fetchCollaborations();
            if (selectedCollab && selectedCollab._id === id) {
                const updated = { ...selectedCollab, status };
                setSelectedCollab(updated);
                fetchCollabDetails(updated);
            }
        } catch (error) { alert(error.response?.data?.message || 'Failed to respond'); }
    };

    const handleRequestCollaboration = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.post('/collaboration/request', requestCollabForm);
            setShowRequestCollabModal(false);
            fetchCollaborations();
            alert('Consultation request sent!');
        } catch (error) { alert(error.response?.data?.message || 'Failed to request consultation'); }
        finally { setLoading(false); }
    };

    const fetchDashboardStats = async () => {
        try {
            const response = await apiClient.get('/doctor/dashboard');
            setDashboardStats(response.data.stats);
        } catch (error) { console.error('Error fetching dashboard stats:', error); }
    };

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/records/patients/list');
            const basePatients = response.data.patients || [];
            const patientsWithConsent = await Promise.all(
                basePatients.map(async (patient) => {
                    try {
                        const consentRes = await consentApi.checkConsent(patient.userId);
                        let pending = false;
                        if (!consentRes.hasConsent) {
                            const pendingRes = await apiClient.get(`/consent/pending-status/${patient.userId}`);
                            pending = pendingRes.data.pending;
                        }
                        return { ...patient, hasConsent: consentRes.hasConsent, consent: consentRes.consent, consentPending: pending };
                    } catch (e) {
                        return { ...patient, hasConsent: false, consent: null, consentPending: false };
                    }
                })
            );
            setPatients(patientsWithConsent);
        } catch (error) { console.error('Error fetching patients:', error); }
        finally { setLoading(false); }
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
        setLoadingPatientId(patient.userId);
        setAccessError(null);
        setAccessInfo(null);
        setPatientRecords([]);
        try {
            const response = await apiClient.get(`/records/patient/${patient.userId}`);
            setPatientRecords(response.data.records || []);
            setAccessInfo(response.data.accessInfo);
        } catch (error) {
            if (error.response?.status === 403) {
                setAccessError({ type: 'CONSENT_REQUIRED', message: error.response.data.message, patientId: patient.userId });
                setShowAccessModal(true);
            } else { alert('Failed to fetch patient records'); }
        } finally { setLoadingPatientId(null); }
    };

    const handleRequestConsent = async () => {
        try {
            await consentApi.requestConsent(accessError.patientId);
            setShowAccessModal(false);
            alert('Consent request sent successfully!');
        } catch (error) { alert(error.response?.data?.message || 'Failed to send consent request'); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const getRecordTypeBadge = (type) => {
        const styles = {
            PRESCRIPTION: 'badge-prescription', LAB_RESULT: 'badge-lab', DIAGNOSIS: 'badge-diagnosis',
            IMAGING: 'badge-imaging', VITALS: 'badge-vitals', GENERAL: 'badge-general'
        };
        return styles[type] || styles.GENERAL;
    };

    const getRecordBorderColor = (type) => {
        const colors = {
            PRESCRIPTION: 'border-emerald-400', LAB_RESULT: 'border-blue-400', DIAGNOSIS: 'border-violet-400',
            IMAGING: 'border-amber-400', VITALS: 'border-rose-400', GENERAL: 'border-slate-300'
        };
        return colors[type] || colors.GENERAL;
    };

    const filteredPatients = patients.filter(p =>
        `${p.firstName} ${p.lastName} ${p.userId} ${p.email}`.toLowerCase().includes(patientSearch.toLowerCase())
    );

    const StatCard = ({ icon: Icon, label, value, gradient, delay }) => (
        <div
            className={`glass-card group relative overflow-hidden transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className={`stat-number mt-2 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                        {value ?? '—'}
                    </p>
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg bg-gradient-to-br ${gradient}`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
            </div>
            <div className={`absolute top-0 right-0 w-28 h-28 rounded-bl-[80px] opacity-[0.04] bg-gradient-to-br ${gradient}`} />
        </div>
    );

    const tabs = [
        { id: 'overview', label: 'Dashboard', icon: TrendingUp },
        { id: 'myrecords', label: 'My Records', icon: ClipboardList },
        { id: 'collaboration', label: 'Consultations', icon: MailCheck },
        { id: 'create', label: 'Create Report', icon: Plus },
        { id: 'patients', label: 'Patients', icon: Users }
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white transition-colors duration-500">
            <Sidebar role="DOCTOR" onLogout={handleLogout} user={user} />

            <div className="flex-1 overflow-y-auto relative z-10">
                {/* Top Action Bar */}
                <div className="sticky top-0 z-20 px-6 py-3 bg-slate-50/80 backdrop-blur-md border-b border-white/40 dark:bg-slate-900/80 dark:border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                <Stethoscope className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-heading font-bold text-slate-900">Dr. {user?.firstName} {user?.lastName}</h1>
                                {user?.specialty && <p className="text-xs text-slate-500">{user.specialty}</p>}
                            </div>
                        </div>

                        {/* Tab pills in action bar */}
                        <div className="flex items-center gap-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => navigate(`/doctor/dashboard?tab=${tab.id}`)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                                        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span className="hidden lg:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        <button onClick={() => navigate('/doctor/dashboard?tab=create')} className="btn-glow text-sm py-2.5 px-5 flex items-center gap-2 hidden xl:flex">
                            <Plus className="w-4 h-4" /> New Report
                        </button>
                    </div>
                </div>

                <div className="px-6 py-8">
                    {/* ─── Overview Tab ─── */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8 tab-content">
                            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                                <StatCard icon={FileText} label="Records Created" value={dashboardStats?.recordsCreated} gradient="from-blue-500 to-indigo-600" delay={100} />
                                <StatCard icon={CheckCircle} label="Active Consents" value={dashboardStats?.activeConsents} gradient="from-emerald-500 to-green-600" delay={200} />
                                <StatCard icon={AlertCircle} label="Pending Requests" value={dashboardStats?.pendingRequests} gradient="from-amber-500 to-orange-500" delay={300} />
                                <StatCard icon={Users} label="Patients Served" value={dashboardStats?.patientsServed} gradient="from-violet-500 to-purple-600" delay={400} />
                            </div>
                        </div>
                    )}

                    {/* ─── My Records Tab ─── */}
                    {activeTab === 'myrecords' && (
                        <div className="tab-content">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-heading font-bold text-slate-900">My Created Records</h2>
                                    <p className="text-slate-500 mt-1">Records you have created for patients</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                                </div>
                            ) : myCreatedRecords.length === 0 ? (
                                <div className="glass-card text-center py-16">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                                        <ClipboardList className="w-10 h-10 text-blue-400 animate-float" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-2">No Records Created Yet</h3>
                                    <p className="text-slate-500 mb-6">Start by creating a medical report for a patient</p>
                                    <button onClick={() => navigate('/doctor/dashboard?tab=create')} className="btn-glow flex items-center gap-2 mx-auto">
                                        <Plus className="w-5 h-5" />Create Report
                                    </button>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {myCreatedRecords.map((record, idx) => (
                                        <div key={record._id} className={`glass-card hover:shadow-glass-hover border-l-4 ${getRecordBorderColor(record.recordType)} stagger-item`}
                                            style={{ animationDelay: `${idx * 80}ms` }}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`badge ${getRecordTypeBadge(record.recordType)}`}>{record.recordType}</span>
                                                    <span className="text-sm text-slate-400 flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {new Date(record.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-1">{record.title}</h3>
                                            <p className="text-sm text-slate-500 mb-3">Patient: {record.patientName}</p>
                                            <div className="space-y-2">
                                                <p className="text-slate-700"><strong className="text-slate-900">Diagnosis:</strong> {record.diagnosis}</p>
                                                <p className="text-slate-600 text-sm">{record.details}</p>
                                                {record.prescription && (
                                                    <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                                                        <p className="text-emerald-800 text-sm"><strong>Rx:</strong> {record.prescription}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── Create Report Tab ─── */}
                    {activeTab === 'create' && (
                        <div className="max-w-3xl tab-content">
                            <div className="mb-6">
                                <h2 className="text-2xl font-heading font-bold text-slate-900">Create Medical Report</h2>
                                <p className="text-slate-500 mt-1">Generate a new medical record for a patient</p>
                            </div>

                            <form onSubmit={handleCreateReport} className="glass-card space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="label">Patient</label>
                                        <select value={reportForm.patientId} onChange={(e) => setReportForm({ ...reportForm, patientId: e.target.value })} required className="input-field">
                                            <option value="">Select Patient</option>
                                            {patients.map(p => <option key={p.userId} value={p.userId}>{p.userId} - {p.firstName} {p.lastName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Record Type</label>
                                        <select value={reportForm.recordType} onChange={(e) => setReportForm({ ...reportForm, recordType: e.target.value })} className="input-field">
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
                                    <label className="label">Title</label>
                                    <input type="text" value={reportForm.title} onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })} required className="input-field" placeholder="e.g., Annual Checkup Report" />
                                </div>
                                <div>
                                    <label className="label">Diagnosis</label>
                                    <input type="text" value={reportForm.diagnosis} onChange={(e) => setReportForm({ ...reportForm, diagnosis: e.target.value })} required className="input-field" placeholder="Primary diagnosis" />
                                </div>
                                <div>
                                    <label className="label">Details</label>
                                    <textarea value={reportForm.details} onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })} required rows="4" className="input-field" placeholder="Detailed observations and findings..." />
                                </div>
                                <div>
                                    <label className="label">Prescription (Optional)</label>
                                    <textarea value={reportForm.prescription} onChange={(e) => setReportForm({ ...reportForm, prescription: e.target.value })} rows="3" className="input-field" placeholder="Medications, dosage, and instructions..." />
                                </div>

                                <button type="submit" disabled={loading} className="btn-glow w-full">
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <Plus className="w-5 h-5" />Create Medical Report
                                        </span>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ─── Collaboration Tab ─── */}
                    {activeTab === 'collaboration' && (
                        <div className="tab-content h-[calc(100vh-180px)] flex gap-6 overflow-hidden">
                            {/* Left: Collaboration Sidebar */}
                            <div className="w-80 flex-shrink-0 flex flex-col glass-card p-0 overflow-hidden border-r border-slate-200/60">
                                <div className="p-4 border-b border-slate-100/60 bg-slate-50/30 flex justify-between items-center">
                                    <h3 className="font-heading font-bold text-slate-800 text-sm">Consultations</h3>
                                    <button
                                        onClick={() => setShowRequestCollabModal(true)}
                                        className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                                        title="Request New Consultation"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-4">
                                    {/* Incoming Section */}
                                    {collaborations.incoming.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Incoming Requests</p>
                                            <div className="space-y-1">
                                                {collaborations.incoming.map(c => (
                                                    <div
                                                        key={c._id}
                                                        onClick={() => fetchCollabDetails(c)}
                                                        className={`p-3 rounded-xl cursor-pointer transition-all ${selectedCollab?._id === c._id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className="text-xs font-bold text-slate-900">Patient: {c.patientId}</p>
                                                            <span className={`status-dot ${c.status === 'ACCEPTED' ? 'status-active' : c.status === 'PENDING' ? 'status-pending' : 'status-offline'}`} />
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 font-medium">From: Dr. {c.requestingDoctorId}</p>
                                                        {c.requestMessage && (
                                                            <p className="text-[9px] text-slate-400 mt-1 italic truncate">"{c.requestMessage}"</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Outgoing Section */}
                                    {collaborations.outgoing.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Sent Consultations</p>
                                            <div className="space-y-1">
                                                {collaborations.outgoing.map(c => (
                                                    <div
                                                        key={c._id}
                                                        onClick={() => fetchCollabDetails(c)}
                                                        className={`p-3 rounded-xl cursor-pointer transition-all ${selectedCollab?._id === c._id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className="text-xs font-bold text-slate-900">Patient: {c.patientId}</p>
                                                            <span className={`status-dot ${c.status === 'ACCEPTED' ? 'status-active' : c.status === 'PENDING' ? 'status-pending' : 'status-offline'}`} />
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 font-medium">To: Dr. {c.consultingDoctorId}</p>
                                                        {c.requestMessage && (
                                                            <p className="text-[9px] text-slate-400 mt-1 italic truncate">"{c.requestMessage}"</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {collaborations.incoming.length === 0 && collaborations.outgoing.length === 0 && (
                                        <div className="text-center py-10 px-4">
                                            <MailCheck className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                            <p className="text-xs text-slate-400">No consultation requests found</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Workspace */}
                            <div className="flex-1 flex flex-col glass-card p-0 overflow-hidden">
                                {selectedCollab ? (
                                    <>
                                        {/* Collab Header */}
                                        <div className="p-4 border-b border-slate-100 bg-slate-50/40 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center">
                                                    <MessageSquare className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-slate-900">Patient Workspace: {selectedCollab.patientId}</h3>
                                                    <p className="text-[10px] text-slate-500">
                                                        Access Context: <span className="font-bold text-blue-600">{selectedCollab.accessScope}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {selectedCollab.status === 'PENDING' && selectedCollab.consultingDoctorId === user.userId && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleRespondToCollab(selectedCollab._id, 'DECLINED')} className="px-3 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100">DECLINE</button>
                                                        <button onClick={() => handleRespondToCollab(selectedCollab._id, 'ACCEPTED')} className="px-3 py-1.5 text-[10px] font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">ACCEPT CONSULTATION</button>
                                                    </div>
                                                )}
                                                <span className={`badge text-[10px] ${selectedCollab.status === 'ACCEPTED' ? 'badge-active' : 'badge-pending'}`}>
                                                    {selectedCollab.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 flex overflow-hidden">
                                            {/* Chat Side */}
                                            <div className="flex-1 flex flex-col border-r border-slate-100">
                                                {/* Initial Request Reason */}
                                                <div className="p-4 bg-blue-50/50 border-b border-blue-100">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                            <AlertCircle className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Consultation Reason</p>
                                                            <p className="text-xs text-slate-700 italic">"{selectedCollab.requestMessage}"</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/20">
                                                    {collabMessages.map(m => (
                                                        <div key={m._id} className={`flex ${m.senderId === user.userId ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${m.senderId === user.userId ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 rounded-tl-none'}`}>
                                                                <p className="text-xs line-height-relaxed">{m.message}</p>
                                                                <p className={`text-[9px] mt-1 ${m.senderId === user.userId ? 'text-blue-100' : 'text-slate-400'}`}>
                                                                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="p-3 border-t border-slate-100 bg-white">
                                                    <form onSubmit={handleSendMessage} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={newMessage}
                                                            onChange={(e) => setNewMessage(e.target.value)}
                                                            placeholder="Type encrypted message..."
                                                            disabled={selectedCollab.status !== 'ACCEPTED'}
                                                            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                        <button type="submit" disabled={selectedCollab.status !== 'ACCEPTED'} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all">
                                                            <Send className="w-4 h-4" />
                                                        </button>
                                                    </form>
                                                </div>
                                            </div>

                                            {/* Data Scope Side */}
                                            <div className="w-80 overflow-y-auto p-4 bg-white">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <ShieldAlert className="w-3 h-3" /> Shared Patient Data
                                                </h4>
                                                {selectedCollab.status !== 'ACCEPTED' ? (
                                                    <div className="flex flex-col items-center justify-center h-40 text-center opacity-60">
                                                        <Clock className="w-8 h-8 text-slate-300 mb-2" />
                                                        <p className="text-[10px] text-slate-500">Records will be visible once the consultation is accepted.</p>
                                                    </div>
                                                ) : sharedRecords.length === 0 ? (
                                                    <div className="text-center py-10">
                                                        <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                                        <p className="text-[10px] text-slate-400">No records found within the "{selectedCollab.accessScope}" scope.</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {sharedRecords.map(rec => (
                                                            <div key={rec._id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="text-[8px] px-1.5 py-0.5 bg-white border border-slate-300 rounded text-slate-500 font-bold">{rec.recordType}</span>
                                                                    <span className="text-[8px] text-slate-400">{new Date(rec.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                                <p className="text-[10px] font-bold text-slate-900 truncate">{rec.title}</p>
                                                                <p className="text-[9px] text-slate-600 mt-1 line-clamp-2">{rec.diagnosis}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                                        <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center mb-6">
                                            <Stethoscope className="w-8 h-8 text-blue-400 animate-float" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800">Doctor-to-Doctor Consulting</h3>
                                        <p className="text-sm text-slate-500 max-w-sm mt-2">
                                            Securely request peer reviews, share diagnostic insights, and collaborate on patient care within a HIPAA-compliant encrypted workspace.
                                        </p>
                                        <button
                                            onClick={() => setShowRequestCollabModal(true)}
                                            className="mt-6 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
                                        >
                                            INITIATE NEW CONSULTATION
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ─── Patients Tab (Master-Detail) ─── */}
                    {activeTab === 'patients' && (
                        <div className="tab-content">
                            <div className="mb-6">
                                <h2 className="text-2xl font-heading font-bold text-slate-900">Patient Management</h2>
                                <p className="text-slate-500 mt-1">View and manage patient records</p>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                                </div>
                            ) : patients.length === 0 ? (
                                <div className="glass-card text-center py-16">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Users className="w-10 h-10 text-slate-400 animate-float" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-800">No Patients Found</h3>
                                </div>
                            ) : (
                                <div className="flex gap-6 h-[calc(100vh-220px)]">
                                    {/* Left: Patient List (Master) */}
                                    <div className="w-[380px] flex-shrink-0 flex flex-col glass-card p-0 overflow-hidden">
                                        <div className="p-4 border-b border-slate-100/60">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search patients..."
                                                    value={patientSearch}
                                                    onChange={(e) => setPatientSearch(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-400 mt-2 px-1">{filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}</p>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                            {filteredPatients.map((patient) => (
                                                <div
                                                    key={patient.userId}
                                                    onClick={() => handleViewPatientRecords(patient)}
                                                    className={`p-3.5 rounded-xl transition-all duration-200 cursor-pointer group ${selectedPatient?.userId === patient.userId
                                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm'
                                                        : 'hover:bg-slate-50 border border-transparent'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm ${selectedPatient?.userId === patient.userId
                                                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                                            : 'bg-gradient-to-br from-slate-400 to-slate-500'
                                                            }`}>
                                                            {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-slate-900 text-sm truncate">{patient.firstName} {patient.lastName}</p>
                                                            <p className="text-xs text-slate-500 font-mono truncate">{patient.userId}</p>
                                                        </div>
                                                        <div className="flex-shrink-0 flex items-center gap-2">
                                                            {patient.hasConsent ? (
                                                                <span className="status-dot status-active" title="Consent granted" />
                                                            ) : (pendingConsentIds.includes(patient.userId) || patient.consentPending) ? (
                                                                <span className="status-dot status-pending" title="Consent pending" />
                                                            ) : (
                                                                <span className="status-dot status-offline" title="No consent" />
                                                            )}
                                                            {selectedPatient?.userId === patient.userId && (
                                                                <ChevronRight className="w-4 h-4 text-blue-500" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right: Patient Detail (Detail) */}
                                    <div className="flex-1 glass-card p-0 overflow-hidden flex flex-col">
                                        {!selectedPatient ? (
                                            <div className="flex-1 flex items-center justify-center text-center p-8">
                                                <div>
                                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                                                        <Users className="w-10 h-10 text-blue-300 animate-float" />
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Select a Patient</h3>
                                                    <p className="text-slate-400 text-sm">Click on a patient from the list to view their records</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Patient Header */}
                                                <div className="p-6 border-b border-slate-100/60 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                                {selectedPatient.firstName?.charAt(0)}{selectedPatient.lastName?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h3 className="text-xl font-heading font-bold text-slate-900">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                                                                <p className="text-sm text-slate-500 font-mono">{selectedPatient.userId} · {selectedPatient.email}</p>
                                                            </div>
                                                        </div>
                                                        {selectedPatient.hasConsent ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className="badge badge-active mb-1">Consent Active</span>
                                                                {selectedPatient.consent?.expiresAt && (
                                                                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                                                        <Clock className="w-2.5 h-2.5" />
                                                                        Expires: {new Date(selectedPatient.consent.expiresAt).toLocaleDateString()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            (pendingConsentIds.includes(selectedPatient.userId) || selectedPatient.consentPending) ? (
                                                                <span className="badge badge-pending">Consent Pending</span>
                                                            ) : (
                                                                <button onClick={() => { setConsentSentPatient(selectedPatient); setConfirmConsentModal(true); }} className="btn-outline text-sm">
                                                                    Request Consent
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Records */}
                                                <div className="flex-1 overflow-y-auto p-6">
                                                    {accessInfo && !accessInfo.fullAccess && (
                                                        <div className="glass-card-l2 border-l-4 border-amber-400 bg-amber-50/50 mb-6 p-4">
                                                            <p className="text-amber-800 text-sm font-medium">{accessInfo.message}</p>
                                                            {accessInfo.hiddenRecordCount > 0 && (
                                                                <p className="text-amber-600 text-xs mt-1">{accessInfo.hiddenRecordCount} additional records require consent</p>
                                                            )}
                                                        </div>
                                                    )}

                                                    <h4 className="font-heading font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-blue-500" /> Medical Timeline
                                                    </h4>

                                                    {loadingPatientId === selectedPatient.userId ? (
                                                        <div className="text-center text-slate-400 py-12">
                                                            <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                                                            <p className="text-sm">Loading records...</p>
                                                        </div>
                                                    ) : patientRecords.length === 0 ? (
                                                        <div className="text-center text-slate-400 py-12">
                                                            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                                            <p className="font-medium">No records found for this patient</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {patientRecords.map((record, idx) => (
                                                                <div key={record._id} className={`flex gap-4 p-4 glass-card-l3 border-l-4 ${getRecordBorderColor(record.recordType)} stagger-item`}
                                                                    style={{ animationDelay: `${idx * 80}ms` }}
                                                                >
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className={`badge text-[10px] py-1 ${getRecordTypeBadge(record.recordType)}`}>{record.recordType}</span>
                                                                            <span className="text-xs text-slate-400">{new Date(record.createdAt).toLocaleDateString()}</span>
                                                                        </div>
                                                                        <p className="font-semibold text-slate-900">{record.title}</p>
                                                                        <p className="text-sm text-slate-600 mt-0.5">{record.diagnosis}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmConsentModal && consentSentPatient && (
                <Modal isOpen={confirmConsentModal} onClose={() => setConfirmConsentModal(false)} title="Request Access" icon={ShieldAlert} size="sm">
                    <div className="space-y-4">
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 text-left">
                            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-amber-900 text-sm">Consent Required</h4>
                                <p className="text-amber-700 text-xs mt-1">
                                    You are about to request access to medical records for <strong>{consentSentPatient.firstName} {consentSentPatient.lastName}</strong>.
                                    The patient determines what you can see.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-4">
                            <button onClick={() => setConfirmConsentModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors">Cancel</button>
                            <button onClick={handleConfirmRequest} className="btn-primary py-2.5 px-5 text-sm">Request Access</button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Consent Sent Modal */}
            {showConsentSentModal && consentSentPatient && (
                <Modal isOpen={showConsentSentModal} onClose={() => setShowConsentSentModal(false)} title="Consent Request Sent" icon={MailCheck} size="sm">
                    <div className="space-y-3 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center mb-2">
                                <MailCheck className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h4 className="text-lg font-semibold text-slate-900">Request Sent!</h4>
                            <p className="text-slate-600 text-sm">A consent request has been sent to <span className="font-bold">{consentSentPatient.firstName} {consentSentPatient.lastName}</span> (ID: {consentSentPatient.userId}).<br />They will need to approve it before you can view their records.</p>
                        </div>
                        <button onClick={() => setShowConsentSentModal(false)} className="btn-primary w-full mt-4">OK</button>
                    </div>
                </Modal>
            )}
            {/* Request Collaboration Modal */}
            {showRequestCollabModal && (
                <Modal
                    isOpen={showRequestCollabModal}
                    onClose={() => setShowRequestCollabModal(false)}
                    title="Initiate Peer Consultation"
                    icon={Users}
                >
                    <form onSubmit={handleRequestCollaboration} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Patient</label>
                                <select
                                    value={requestCollabForm.patientId}
                                    onChange={(e) => setRequestCollabForm({ ...requestCollabForm, patientId: e.target.value })}
                                    required
                                    className="input-field"
                                >
                                    <option value="">Select Patient</option>
                                    {patients.map(p => <option key={p.userId} value={p.userId}>{p.firstName} {p.lastName} ({p.userId})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label">Consulting Physician</label>
                                <select
                                    value={requestCollabForm.consultingDoctorId}
                                    onChange={(e) => setRequestCollabForm({ ...requestCollabForm, consultingDoctorId: e.target.value })}
                                    required
                                    className="input-field"
                                >
                                    <option value="">Select Specialist</option>
                                    {doctors.filter(d => d.userId !== user.userId).map(d => (
                                        <option key={d.userId} value={d.userId}>
                                            Dr. {d.firstName} {d.lastName} {d.specialty ? `(${d.specialty})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="label">Data Access Scope (HIPAA Privacy Rule)</label>
                            <select
                                value={requestCollabForm.accessScope}
                                onChange={(e) => setRequestCollabForm({ ...requestCollabForm, accessScope: e.target.value })}
                                className="input-field"
                            >
                                <option value="SUMMARY">Clinical Summary (Last 5 Records)</option>
                                <option value="LAB_REPORTS">Laboratory Results Only</option>
                                <option value="PRESCRIPTIONS">Medication & Prescription History</option>
                                <option value="RADIOLOGY">Radiology & Imaging</option>
                                <option value="FULL">Complete Medical Record Access</option>
                            </select>
                            <p className="text-[10px] text-slate-400 mt-1 italic">
                                * Minimum Necessary Standard: Only share data relevant to the consultation context.
                            </p>
                        </div>

                        <div>
                            <label className="label">Consultation Detail</label>
                            <textarea
                                value={requestCollabForm.message}
                                onChange={(e) => setRequestCollabForm({ ...requestCollabForm, message: e.target.value })}
                                required
                                rows="3"
                                className="input-field"
                                placeholder="State the purpose of this consultation and diagnostic questions..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Access Expiry (Optional)</label>
                                <input
                                    type="date"
                                    value={requestCollabForm.expiresAt}
                                    onChange={(e) => setRequestCollabForm({ ...requestCollabForm, expiresAt: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="button" onClick={() => setShowRequestCollabModal(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">CANCEL</button>
                            <button type="submit" className="flex-2 btn-primary py-2.5 px-8">SEND REQUEST</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default DoctorDashboard;
