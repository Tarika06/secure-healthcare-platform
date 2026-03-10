import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    FileText, Users, Plus, ShieldAlert, CheckCircle, AlertCircle,
    ClipboardList, Stethoscope, Calendar, TrendingUp, MailCheck,
    Search, Clock, Send, Target, Sparkles, ChevronRight
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import MedicalCard from '../../components/MedicalCard';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import consentApi from '../../api/consentApi';
import DoctorAppointmentsTab from '../../components/doctor/DoctorAppointmentsTab';
import appointmentApi from '../../api/appointmentApi';

// Helper Components
const StatCard = ({ iconComponent: IconComponent, label, value, colorType, delay, mounted }) => {
    const themes = {
        blue: {
            base: 'border-blue-100/50 dark:border-blue-900/20',
            iconBg: 'bg-blue-600/10 text-blue-600',
            decor: 'bg-blue-600/5',
            accent: 'bg-blue-600'
        },
        emerald: {
            base: 'border-emerald-100/50 dark:border-emerald-900/20',
            iconBg: 'bg-emerald-600/10 text-emerald-600',
            decor: 'bg-emerald-600/5',
            accent: 'bg-emerald-600'
        },
        amber: {
            base: 'border-amber-100/50 dark:border-amber-900/20',
            iconBg: 'bg-amber-600/10 text-amber-600',
            decor: 'bg-amber-600/5',
            accent: 'bg-amber-600'
        },
        purple: {
            base: 'border-purple-100/50 dark:border-purple-900/20',
            iconBg: 'bg-purple-600/10 text-purple-600',
            decor: 'bg-purple-600/5',
            accent: 'bg-purple-600'
        }
    }[colorType] || themes.blue;

    return (
        <div
            className={`card-premium group ${themes.base} ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${themes.decor} blur-3xl group-hover:scale-150 transition-transform duration-1000`}></div>

            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-2xl ${themes.iconBg} flex items-center justify-center mb-6 transform group-hover:rotate-6 transition-transform`}>
                    <IconComponent className="w-6 h-6" />
                </div>

                <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                    {value ?? '0'}
                </h3>

                <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    {label}
                    <span className={`w-1 h-1 rounded-full ${themes.accent}`}></span>
                </p>
            </div>

            <div className="absolute bottom-0 left-8 right-8 h-1 bg-slate-100 dark:bg-slate-800 rounded-t-full overflow-hidden">
                <div className={`h-full ${themes.accent} w-0 group-hover:w-full transition-all duration-1000 ease-out`}></div>
            </div>
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
    const [todayAppointments, setTodayAppointments] = useState([]);
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
            const [statsRes, aptRes] = await Promise.all([
                apiClient.get('/doctor/dashboard'),
                appointmentApi.listAppointments({ date: new Date().toISOString().split('T')[0] })
            ]);
            setDashboardStats(statsRes.data.stats);
            setTodayAppointments(aptRes.appointments || []);
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
        <div className="flex h-screen overflow-hidden dashboard-medical-bg font-sans text-slate-900 transition-colors duration-500">
            <Sidebar role="DOCTOR" onLogout={handleLogout} user={user} />

            <div className="flex-1 overflow-y-auto relative z-10">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="aurora-bg-teal doctor-banner-shape rounded-[2.5rem] px-10 py-10 mb-10 shadow-2xl flex items-center justify-between animate-fade-in relative overflow-hidden border border-white/20">
                        <div className="absolute top-0 left-0 w-full h-full shimmer-effect opacity-30 pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col gap-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-teal-300" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-100/60">Senior Consultant Portal</span>
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-white m-0">
                                Welcome, <span className="text-teal-300">Dr. {user?.lastName || user?.firstName || 'Doctor'}</span>
                            </h1>
                            <p className="text-teal-100/70 text-sm font-medium">Ready for your morning rounds? You have {todayAppointments.length} appointments scheduled.</p>
                        </div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black text-teal-300 uppercase tracking-widest mb-1 leading-none">Access Node</p>
                                <p className="text-sm font-black text-white leading-none">DC-ALPHA-{user?.userId?.slice(-4) || '001'}</p>
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-white font-black text-2xl shadow-2xl transform group-hover:scale-105 transition-transform">
                                    {user?.firstName?.[0] || 'D'}{user?.lastName?.[0] || 'O'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard iconComponent={FileText} label="Records Created" value={dashboardStats?.recordsCreated || 6} colorType="blue" delay={100} mounted={mounted} />
                                <StatCard iconComponent={CheckCircle} label="Active Consents" value={dashboardStats?.activeConsents || 6} colorType="emerald" delay={200} mounted={mounted} />
                                <StatCard iconComponent={AlertCircle} label="Pending Requests" value={dashboardStats?.pendingRequests || 1} colorType="amber" delay={300} mounted={mounted} />
                                <StatCard iconComponent={Users} label="Total Patients" value={dashboardStats?.patientsServed || 4} colorType="purple" delay={400} mounted={mounted} />
                            </div>

                            <div className="grid lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>Today's Schedule</h3>
                                                <p className="text-sm text-slate-500 font-medium">Your upcoming roster for today</p>
                                            </div>
                                            <button onClick={() => navigate('?tab=appointments')} className="text-teal-600 font-bold text-xs hover:underline flex items-center gap-1">
                                                VIEW FULL CALENDAR <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>

                                        {todayAppointments.filter(a => ['BOOKED', 'VERIFIED'].includes(a.status)).length === 0 ? (
                                            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] border border-dashed border-slate-200 dark:border-slate-700">
                                                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                                <p className="text-slate-500 font-medium text-sm">No appointments remaining for today.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {todayAppointments.filter(a => ['BOOKED', 'VERIFIED'].includes(a.status)).slice(0, 4).map((apt, idx) => (
                                                    <div key={apt.appointmentId} className="group flex items-center gap-5 p-4 rounded-[22px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                                        <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-900/20 flex flex-col items-center justify-center border border-teal-100 dark:border-teal-800/50">
                                                            <span className="text-[10px] font-black text-teal-600 uppercase">TIME</span>
                                                            <span className="text-sm font-black text-teal-700 dark:text-teal-300">{apt.timeSlot.split(' - ')[0]}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-bold text-slate-900 dark:text-white truncate">{apt.patient?.firstName} {apt.patient?.lastName}</h4>
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${apt.status === 'VERIFIED' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                                    {apt.status === 'VERIFIED' ? 'In Lobby' : 'Booked'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                                                                <FileText className="w-3 h-3" /> {apt.reason}
                                                            </p>
                                                        </div>
                                                        <button onClick={() => navigate('?tab=appointments')} className="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-teal-600 group-hover:border-teal-200 transition-all">
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="lg:col-span-1">
                                    <div className="bg-gradient-to-br from-[#0e503f] to-[#125c56] rounded-[32px] p-8 text-white h-full relative overflow-hidden shadow-xl">
                                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-400/20 rounded-full blur-3xl"></div>
                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="mb-8">
                                                <div className="w-12 h-12 rounded-2xl bg-teal-400/20 flex items-center justify-center mb-4">
                                                    <TrendingUp className="w-6 h-6 text-teal-300" />
                                                </div>
                                                <h4 className="text-lg font-black leading-tight mb-2">Performance<br />Insights</h4>
                                                <p className="text-xs text-teal-200/60 font-medium">Overview of your activity this week</p>
                                            </div>

                                            <div className="space-y-6 flex-1">
                                                <div>
                                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-teal-300/50 mb-2">
                                                        <span>Patient Satisfaction</span>
                                                        <span>98%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-teal-900/50 rounded-full overflow-hidden">
                                                        <div className="h-full bg-teal-400 w-[98%] rounded-full shadow-[0_0_10px_rgba(45,212,191,0.5)]"></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-teal-300/50 mb-2">
                                                        <span>Response Rate</span>
                                                        <span>84%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-teal-900/50 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#8bd8bd] w-[84%] rounded-full shadow-[0_0_10px_rgba(139,216,189,0.5)]"></div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button onClick={() => navigate('?tab=collaboration')} className="mt-8 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between">
                                                PEER REVIEW WORKSPACE <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center"><div><h3 className="text-sm font-bold">Workspace: {selectedCollab.patientId}</h3><p className="text-[10px] text-blue-600 font-bold">{selectedCollab.accessScope}</p></div>{selectedCollab.status === 'PENDING' && selectedCollab.consultingDoctorId === user.userId && (<div className="flex gap-2"><button onClick={() => handleRespondToCollab(selectedCollab._id, 'DECLINED')} className="px-3 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 rounded-lg">DECLINE</button><button onClick={() => handleRespondToCollab(selectedCollab._id, 'ACCEPTED')} className="px-3 py-1.5 text-[10px] font-bold text-white bg-blue-600 rounded-lg">ACCEPT</button></div>)}</div>
                                        <div className="flex-1 flex overflow-hidden">
                                            <div className="flex-1 flex flex-col border-r border-slate-100">
                                                <div className="flex-1 overflow-y-auto p-4 space-y-4">{collabMessages.map(m => (<div key={m._id} className={`flex ${m.senderId === user.userId ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-3 rounded-2xl ${m.senderId === user.userId ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}><p className="text-xs">{m.message}</p></div></div>))}</div>
                                                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                                                    <form onSubmit={handleSendMessage} className="flex gap-2"><input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type message..." disabled={selectedCollab.status !== 'ACCEPTED'} className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none dark:text-white" /><button type="submit" disabled={selectedCollab.status !== 'ACCEPTED'} className="p-2 bg-blue-600 text-white rounded-xl"><Send className="w-4 h-4" /></button></form></div>
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
        </div>
    );
};

export default DoctorDashboard;
