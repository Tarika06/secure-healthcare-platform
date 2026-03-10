import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    FileText, Users, Plus, ShieldAlert, CheckCircle, AlertCircle,
    ClipboardList, Stethoscope, Calendar, TrendingUp, MailCheck,
    Search, Clock, Send, Target, Sparkles
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import MedicalCard from '../../components/MedicalCard';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import consentApi from '../../api/consentApi';
import DoctorAppointmentsTab from '../../components/doctor/DoctorAppointmentsTab';
import ChatWidget from '../../components/ChatWidget';

// Helper Components
const StatCard = ({ iconComponent: IconComponent, label, value, gradient, delay, mounted }) => {
    return (
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
                    {React.createElement(IconComponent, { className: "w-7 h-7 text-white" })}
                </div>
            </div>
            <div className={`absolute top-0 right-0 w-28 h-28 rounded-bl-[80px] opacity-[0.04] bg-gradient-to-br ${gradient}`} />
        </div>
    );
};

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
    const [mounted, setMounted] = useState(false);
    const [showConsentSentModal, setShowConsentSentModal] = useState(false);
    const [confirmConsentModal, setConfirmConsentModal] = useState(false);
    const [consentSentPatient, setConsentSentPatient] = useState(null);
    const [pendingConsentIds, setPendingConsentIds] = useState([]);
    const [patientSearch, setPatientSearch] = useState('');

    // Main Branch State
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

    // Reports Branch State
    const [consentPurpose, setConsentPurpose] = useState('TREATMENT');

    const PURPOSE_OPTIONS = [
        { value: 'TREATMENT', label: 'Medical Treatment', icon: '🏥' },
        { value: 'PAYMENT', label: 'Payment / Billing', icon: '💳' },
        { value: 'RESEARCH', label: 'Medical Research', icon: '🔬' },
        { value: 'LEGAL', label: 'Legal Compliance', icon: '⚖️' },
        { value: 'EMERGENCY', label: 'Emergency Access', icon: '🚨' },
        { value: 'INSURANCE', label: 'Insurance Processing', icon: '📋' }
    ];

    const [reportForm, setReportForm] = useState({
        patientId: '', title: '', diagnosis: '', details: '', prescription: '', recordType: 'GENERAL', purpose: 'TREATMENT'
    });

    const fetchCollaborations = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/collaboration/my-requests');
            setCollaborations(response.data);
        } catch (error) { console.error('Error fetching collaborations:', error); }
        finally { setLoading(false); }
    }, []);

    const fetchDoctors = useCallback(async () => {
        try {
            const response = await apiClient.get('/doctor/list');
            setDoctors(response.data.doctors || []);
        } catch (error) { console.error('Error fetching doctors:', error); }
    }, []);

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

    const fetchDashboardStats = useCallback(async () => {
        try {
            const response = await apiClient.get('/doctor/dashboard');
            setDashboardStats(response.data.stats);
        } catch (error) { console.error('Error fetching dashboard stats:', error); }
    }, []);

    const fetchPatients = useCallback(async () => {
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
                        return {
                            ...patient,
                            hasConsent: consentRes.hasConsent,
                            consent: consentRes.consent,
                            consentPending: pending
                        };
                    } catch {
                        return { ...patient, hasConsent: false, consent: null, consentPending: false };
                    }
                })
            );
            setPatients(patientsWithConsent);
        } catch (error) { console.error('Error fetching patients:', error); }
        finally { setLoading(false); }
    }, []);

    const fetchMyCreatedRecords = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/records/my-created-records');
            setMyCreatedRecords(response.data.records || []);
        } catch (error) { console.error('Error fetching my records:', error); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        setMounted(true);
        if (activeTab === 'patients' || activeTab === 'create') fetchPatients();
        if (activeTab === 'myrecords') fetchMyCreatedRecords();
        if (activeTab === 'overview') fetchDashboardStats();
        if (activeTab === 'collaboration') {
            fetchPatients();
            fetchCollaborations();
            fetchDoctors();
        }
    }, [activeTab, fetchPatients, fetchMyCreatedRecords, fetchDashboardStats, fetchCollaborations, fetchDoctors]);

    const handleConfirmRequest = useCallback(async () => {
        if (!consentSentPatient) return;
        setConfirmConsentModal(false);
        try {
            await consentApi.requestConsent(consentSentPatient.userId, consentPurpose);
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
    }, [consentSentPatient, consentPurpose]);

    const handleCreateReport = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiClient.post('/records/create', reportForm);
            alert('Medical report created successfully!');
            setReportForm({ patientId: '', title: '', diagnosis: '', details: '', prescription: '', recordType: 'GENERAL', purpose: 'TREATMENT' });
        } catch (error) { alert(error.response?.data?.message || 'Failed to create report'); }
        finally { setLoading(false); }
    };

    const handleViewPatientRecords = async (patient) => {
        setSelectedPatient(patient);
        setPatientRecords([]);

        setLoading(true);
        try {
            const response = await apiClient.get(`/records/patient/${patient.userId}`);
            setPatientRecords(response.data.records || []);
        } catch (error) {
            if (error.response?.status === 403) {
                alert(error.response.data.message);
            } else { alert('Failed to fetch patient records'); }
        } finally { setLoading(false); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const filteredPatients = patients.filter(p => {
        const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
        const userId = (p.userId || '').toLowerCase();
        const search = patientSearch.toLowerCase();
        return fullName.includes(search) || userId.includes(search);
    });
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white transition-colors duration-500">
            <Sidebar role="DOCTOR" onLogout={handleLogout} user={user} />

            <div className="flex-1 overflow-y-auto relative z-10">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="bg-gradient-to-r from-teal-900 to-emerald-900 rounded-3xl p-8 mb-10 shadow-2xl relative overflow-hidden flex items-center justify-between animate-fade-in border border-teal-800/50">
                        {/* Decorative background blurs */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full mix-blend-screen filter blur-[80px] opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500 rounded-full mix-blend-screen filter blur-[60px] opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 text-teal-200">
                                <Sparkles className="w-5 h-5" />
                                <span className="text-sm font-bold uppercase tracking-widest">Doctor's Lounge</span>
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-white">
                                Welcome, <span className="text-teal-300">Dr. {user?.firstName}</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-4 group cursor-default relative z-10">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black text-teal-300/80 uppercase tracking-widest leading-none mb-1.5">Medical ID</p>
                                <p className="text-sm font-bold text-teal-50 leading-none shadow-sm">{user?.userId || 'MD-STAFF'}</p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-teal-800/50 border border-teal-700/50 flex items-center justify-center text-teal-50 font-black text-xl shadow-inner backdrop-blur-sm group-hover:rotate-6 group-hover:scale-105 transition-all duration-300">
                                {user?.firstName?.[0] || 'D'}{user?.lastName?.[0] || 'R'}
                            </div>
                        </div>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                            <StatCard iconComponent={FileText} label="Records Created" value={dashboardStats?.recordsCreated} gradient="from-blue-500 to-indigo-600" delay={100} mounted={mounted} />
                            <StatCard iconComponent={CheckCircle} label="Active Consents" value={dashboardStats?.activeConsents} gradient="from-emerald-500 to-teal-600" delay={200} mounted={mounted} />
                            <StatCard iconComponent={AlertCircle} label="Pending Requests" value={dashboardStats?.pendingRequests} gradient="from-amber-400 to-orange-500" delay={300} mounted={mounted} />
                            <StatCard iconComponent={Users} label="Total Patients" value={dashboardStats?.patientsServed} gradient="from-purple-500 to-indigo-600" delay={400} mounted={mounted} />
                        </div>
                    )}

                    {activeTab === 'appointments' && (
                        <div className="animate-fade-in">
                            <DoctorAppointmentsTab />
                        </div>
                    )}

                    {activeTab === 'myrecords' && (
                        <div className="animate-fade-in">
                            <div className="mb-6"><h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Created Records</h2></div>
                            {loading ? <div className="text-center py-12"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div> : myCreatedRecords.length === 0 ? <div className="glass-card text-center py-16"><ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">No records created by you yet.</p></div> : <div className="grid gap-4">{myCreatedRecords.map(record => <MedicalCard key={record._id} record={record} />)}</div>}
                        </div>
                    )}

                    {activeTab === 'create' && (
                        <div className="max-w-3xl animate-fade-in">
                            <div className="mb-6"><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create Medical Report</h2></div>
                            <form onSubmit={handleCreateReport} className="glass-card space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div><label className="label">Patient</label><select value={reportForm.patientId} onChange={(e) => setReportForm({ ...reportForm, patientId: e.target.value })} required className="input-field"><option value="">Select Patient</option>{patients.map(p => <option key={p.userId} value={p.userId}>{p.firstName} {p.lastName} ({p.userId})</option>)}</select></div>
                                    <div><label className="label">Record Type</label><select value={reportForm.recordType} onChange={(e) => setReportForm({ ...reportForm, recordType: e.target.value })} className="input-field"><option value="GENERAL">General</option><option value="LAB_RESULT">Lab Result</option><option value="PRESCRIPTION">Prescription</option><option value="DIAGNOSIS">Diagnosis</option><option value="IMAGING">Imaging</option><option value="VITALS">Vitals</option></select></div>
                                </div>
                                <div><label className="label flex items-center gap-2"><Target className="w-4 h-4 text-violet-500" /> Purpose (GDPR Art. 5)</label><select value={reportForm.purpose} onChange={(e) => setReportForm({ ...reportForm, purpose: e.target.value })} className="input-field">{PURPOSE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}</select><p className="text-xs text-slate-400 mt-1">Records are tagged with a purpose for regulatory compliance</p></div>
                                <div><label className="label">Title</label><input type="text" value={reportForm.title} onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })} required className="input-field" placeholder="Annual Checkup" /></div>
                                <div><label className="label">Diagnosis</label><input type="text" value={reportForm.diagnosis} onChange={(e) => setReportForm({ ...reportForm, diagnosis: e.target.value })} required className="input-field" placeholder="Primary diagnosis" /></div>
                                <div><label className="label">Details</label><textarea value={reportForm.details} onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })} required rows="4" className="input-field" placeholder="Detailed findings..." /></div>
                                <div><label className="label">Prescription (Optional)</label><textarea value={reportForm.prescription} onChange={(e) => setReportForm({ ...reportForm, prescription: e.target.value })} rows="3" className="input-field" placeholder="Medications..." /></div>
                                <button type="submit" disabled={loading} className="btn-glow w-full py-3">{loading ? 'Creating...' : 'Create Report'}</button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'collaboration' && (
                        <div className="h-[calc(100vh-180px)] flex gap-6 overflow-hidden animate-fade-in">
                            <div className="w-80 flex-shrink-0 flex flex-col glass-card p-0 overflow-hidden border-r border-slate-200/60">
                                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><h3 className="font-bold text-slate-800 text-sm">Consultations</h3><button onClick={() => setShowRequestCollabModal(true)} className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"><Plus className="w-4 h-4" /></button></div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-4">
                                    {collaborations.incoming.length > 0 && (<div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Incoming</p>{collaborations.incoming.map(c => (<div key={c._id} onClick={() => fetchCollabDetails(c)} className={`p-3 rounded-xl cursor-pointer ${selectedCollab?._id === c._id ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50'}`}><div className="flex justify-between items-center"><p className="text-xs font-bold">Patient: {c.patientId}</p><span className={`w-2 h-2 rounded-full ${c.status === 'ACCEPTED' ? 'bg-green-500' : 'bg-amber-500'}`} /></div><p className="text-[10px] text-slate-500">From: Dr. {c.requestingDoctorId}</p></div>))}</div>)}
                                    {collaborations.outgoing.length > 0 && (<div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Outgoing</p>{collaborations.outgoing.map(c => (<div key={c._id} onClick={() => fetchCollabDetails(c)} className={`p-3 rounded-xl cursor-pointer ${selectedCollab?._id === c._id ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-slate-50'}`}><div className="flex justify-between items-center"><p className="text-xs font-bold">Patient: {c.patientId}</p><span className={`w-2 h-2 rounded-full ${c.status === 'ACCEPTED' ? 'bg-green-500' : 'bg-amber-500'}`} /></div><p className="text-[10px] text-slate-500">To: Dr. {c.consultingDoctorId}</p></div>))}</div>)}
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col glass-card p-0 overflow-hidden">
                                {selectedCollab ? (
                                    <>
                                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><div><h3 className="text-sm font-bold">Workspace: {selectedCollab.patientId}</h3><p className="text-[10px] text-blue-600 font-bold">{selectedCollab.accessScope}</p></div>
                                        {selectedCollab.status === 'PENDING' && selectedCollab.consultingDoctorId === user.userId && (<div className="flex gap-2"><button onClick={() => handleRespondToCollab(selectedCollab._id, 'DECLINED')} className="px-3 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 rounded-lg">DECLINE</button><button onClick={() => handleRespondToCollab(selectedCollab._id, 'ACCEPTED')} className="px-3 py-1.5 text-[10px] font-bold text-white bg-blue-600 rounded-lg">ACCEPT</button></div>)}
                                        {selectedCollab.status !== 'PENDING' && selectedCollab.status !== 'ACCEPTED' && (
                                            <span className="px-3 py-1 bg-slate-200 text-slate-600 font-bold text-[10px] rounded-lg">{selectedCollab.status}</span>
                                        )}
                                        </div>
                                        <div className="flex-1 flex overflow-hidden">
                                            <div className="flex-1 flex flex-col border-r border-slate-100">
                                                <div className="flex-1 overflow-y-auto p-4 space-y-4">{collabMessages.map(m => (<div key={m._id} className={`flex ${m.senderId === user.userId ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-3 rounded-2xl ${m.senderId === user.userId ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}><p className="text-xs">{m.message}</p></div></div>))}</div>
                                                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                                                    <form onSubmit={handleSendMessage} className="flex gap-2"><input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={selectedCollab.status === 'ACCEPTED' ? "Type message..." : `Chat disabled (${selectedCollab.status.toLowerCase()})`} disabled={selectedCollab.status !== 'ACCEPTED'} className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none dark:text-white" /><button type="submit" disabled={selectedCollab.status !== 'ACCEPTED'} className={`p-2 rounded-xl text-white ${selectedCollab.status === 'ACCEPTED' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-400 cursor-not-allowed'}`}><Send className="w-4 h-4" /></button></form></div>
                                            </div>
                                            <div className="w-80 overflow-y-auto p-4 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800"><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Shared History</h4>{sharedRecords.map(rec => (<div key={rec._id} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mb-3"><p className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 mb-1">{rec.recordType}</p><p className="text-[10px] font-bold truncate dark:text-white">{rec.title}</p><p className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-2">{rec.diagnosis}</p></div>))}</div>
                                        </div>
                                    </>
                                ) : (<div className="flex-1 flex flex-col items-center justify-center text-center p-10"><MailCheck className="w-12 h-12 text-blue-300 dark:text-blue-500 mb-4 animate-float" /><h3 className="text-lg font-bold dark:text-white">Medical Collaboration</h3><p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-2">Connect with specialists for peer reviews and diagnostic consultations.</p><button onClick={() => setShowRequestCollabModal(true)} className="mt-6 btn-primary px-6 py-2">NEW CONSULTATION</button></div>)}
                            </div>
                        </div>
                    )}

                    {activeTab === 'patients' && (
                        <div className="animate-fade-in">
                            <div className="mb-6"><h2 className="text-2xl font-bold text-slate-900 dark:text-white">Patient Directory</h2><div className="mt-4 relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" /><input type="text" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder="Search name or ID..." className="input-field pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white" /></div></div>
                            {loading ? <div className="text-center py-12"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div> : (
                                <div className="grid gap-6">
                                    {filteredPatients.map((patient) => (
                                        <div key={patient.userId} className="glass-card hover:shadow-lg transition-all p-0 overflow-hidden">
                                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">{patient.firstName?.[0]}</div><div><h3 className="font-bold text-slate-900 dark:text-white">{patient.firstName} {patient.lastName}</h3><p className="text-xs text-slate-500 dark:text-slate-400">ID: {patient.userId}</p></div></div>
                                                <div className="flex gap-2">
                                                    {patient.hasConsent ? (<button onClick={() => handleViewPatientRecords(patient)} className="btn-primary py-2 px-4 text-xs font-bold font-heading">View Records</button>) : (patient.consentPending || pendingConsentIds.includes(patient.userId)) ? (<span className="px-3 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-800">Consent Pending</span>) : (<button onClick={() => { setConsentSentPatient(patient); setConfirmConsentModal(true); }} className="btn-outline py-2 px-4 text-xs font-bold font-heading text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">Request Access</button>)}
                                                </div>
                                            </div>
                                            {selectedPatient?.userId === patient.userId && (
                                                <div className="p-6 bg-slate-50/50">
                                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Medical Timeline</h4>
                                                    <div className="space-y-3">{patientRecords.map(record => <MedicalCard key={record._id} record={record} />)}</div>
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

            {/* Modals */}
            {confirmConsentModal && consentSentPatient && (
                <Modal isOpen={confirmConsentModal} onClose={() => setConfirmConsentModal(false)} title="HIPAA Authorization" icon={ShieldAlert} size="sm">
                    <div className="space-y-4">
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 text-left">
                            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-amber-900 text-sm">Purpose-Based Access (GDPR Art. 5)</h4>
                                <p className="text-amber-700 text-xs mt-1 leading-relaxed">Requesting clinical records for <strong>{consentSentPatient.firstName} {consentSentPatient.lastName}</strong>. Access is restricted to records tagged with the selected purpose.</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Select Access Purpose</label>
                            <div className="grid grid-cols-2 gap-2">
                                {PURPOSE_OPTIONS.map(p => (
                                    <button key={p.value} type="button" onClick={() => setConsentPurpose(p.value)} className={`p-4 rounded-2xl border-2 text-left transition-all ${consentPurpose === p.value ? 'border-violet-500 bg-violet-50 shadow-inner' : 'border-slate-100 hover:border-violet-200 bg-white'}`}>
                                        <span className="text-xl">{p.icon}</span>
                                        <p className={`font-black text-[10px] uppercase mt-1 ${consentPurpose === p.value ? 'text-violet-700' : 'text-slate-400'}`}>{p.label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4"><button onClick={() => setConfirmConsentModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-500">CANCEL</button><button onClick={handleConfirmRequest} className="flex-1 btn-primary py-3 text-sm shadow-lg">REQUEST ACCESS</button></div>
                    </div>
                </Modal>
            )}

            <Modal isOpen={showConsentSentModal} onClose={() => setShowConsentSentModal(false)} title="Request Transmitted" icon={CheckCircle} size="sm">
                <div className="text-center py-4"><CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" /><p className="text-sm font-medium">Authorization request sent successfully.</p><button onClick={() => setShowConsentSentModal(false)} className="btn-primary w-full mt-6 py-2.5">DISMISS</button></div>
            </Modal>

            <Modal isOpen={showRequestCollabModal} onClose={() => setShowRequestCollabModal(false)} title="Peer Consultation" icon={Users}>
                <form onSubmit={handleRequestCollaboration} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Patient ID</label>
                            <select value={requestCollabForm.patientId} onChange={(e) => setRequestCollabForm({ ...requestCollabForm, patientId: e.target.value })} required className="input-field dark:bg-slate-800 dark:text-white">
                                <option value="" disabled className="dark:bg-slate-900 dark:text-slate-400">Select Patient...</option>
                                {patients.map(p => <option key={p.userId} value={p.userId} className="dark:bg-slate-900 dark:text-white">{p.firstName} {p.lastName} ({p.userId})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Consulting Specialist</label>
                            <select value={requestCollabForm.consultingDoctorId} onChange={(e) => setRequestCollabForm({ ...requestCollabForm, consultingDoctorId: e.target.value })} required className="input-field dark:bg-slate-800 dark:text-white">
                                <option value="" disabled className="dark:bg-slate-900 dark:text-slate-400">Select Specialist...</option>
                                {doctors.filter(d => d.userId !== user?.userId).length === 0 ? (
                                    <option disabled className="dark:bg-slate-900 dark:text-slate-400">No other specialists available</option>
                                ) : (
                                    doctors.filter(d => d.userId !== user?.userId).map(d => <option key={d.userId} value={d.userId} className="dark:bg-slate-900 dark:text-white">Dr. {d.firstName} {d.lastName}</option>)
                                )}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="label">Access Scope</label>
                        <select value={requestCollabForm.accessScope} onChange={(e) => setRequestCollabForm({ ...requestCollabForm, accessScope: e.target.value })} className="input-field dark:bg-slate-800 dark:text-white">
                            <option value="SUMMARY" className="dark:bg-slate-900 dark:text-white">Clinical Summary</option>
                            <option value="FULL" className="dark:bg-slate-900 dark:text-white">Full Record</option>
                        </select>
                    </div>
                    <div><label className="label">Details</label><textarea value={requestCollabForm.message} onChange={(e) => setRequestCollabForm({ ...requestCollabForm, message: e.target.value })} required rows="3" className="input-field" placeholder="Diagnostic questions..." /></div>
                    <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowRequestCollabModal(false)} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors">CANCEL</button><button type="submit" className="flex-1 btn-primary py-2.5">SEND REQUEST</button></div>
                </form>
            </Modal>
            <ChatWidget />
        </div>
    );
};

export default DoctorDashboard;
