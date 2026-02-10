import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Users, Plus, ShieldAlert, CheckCircle, AlertCircle, ClipboardList, Stethoscope, Calendar, Heart, TrendingUp, MailCheck } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Modal from '../../components/Modal';
import MedicalCard from '../../components/MedicalCard';
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

    const handleConfirmRequest = async () => {
        if (!consentSentPatient) return;
        setConfirmConsentModal(false);
        try {
            await consentApi.requestConsent(consentSentPatient.userId);
            setPendingConsentIds(ids => [...ids, consentSentPatient.userId]);
            /* Update local patient state to reflect pending immediately */
            setPatients(prev => prev.map(p =>
                p.userId === consentSentPatient.userId ? { ...p, consentPending: true } : p
            ));
            setShowConsentSentModal(true);
        } catch (e) {
            const msg = e?.response?.data?.message || 'Failed to send consent request';
            // If it says "already pending", we should still update UI
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

    useEffect(() => {
        setMounted(true);
    }, []);

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

    // Fetch patients and their consent status
    const fetchPatients = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/records/patients/list');
            const basePatients = response.data.patients || [];
            // For each patient, check consent status and pending status
            const patientsWithConsent = await Promise.all(
                basePatients.map(async (patient) => {
                    try {
                        // Check if doctor has consent
                        const consentRes = await consentApi.checkConsent(patient.userId);
                        // Check if there is a pending consent request
                        let pending = false;
                        if (!consentRes.hasConsent) {
                            // Check for pending consent
                            const pendingRes = await apiClient.get(`/consent/pending-status/${patient.userId}`);
                            pending = pendingRes.data.pending;
                        }
                        return {
                            ...patient,
                            hasConsent: consentRes.hasConsent,
                            consent: consentRes.consent,
                            consentPending: pending
                        };
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
        // Toggle: If clicking data for the already selected patient, verify if we should just close it.
        if (selectedPatient?.userId === patient.userId) {
            // Optional: Toggle close functionality if user wants to close by clicking again
            // setSelectedPatient(null); 
            // return;
            // For now, we will just refresh the data
        }

        setSelectedPatient(patient);
        setLoadingPatientId(patient.userId);
        setAccessError(null);
        setAccessInfo(null);
        setPatientRecords([]); // Clear previous records to avoid showing old data

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

    const StatCard = ({ icon: Icon, label, value, colorClass, delay }) => {
        const isConsent = label?.toLowerCase().includes('consent');
        const isPending = label?.toLowerCase().includes('pending') || label?.toLowerCase().includes('request');

        return (
            <div
                className={`card-stat group transition-all duration-700 relative overflow-hidden group-hover:bg-transparent ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${delay}ms` }}
            >
                {/* Active Consent Hover Image (Multiple People) */}
                {isConsent && (
                    <>
                        <img
                            src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-700 ease-out opacity-[0.08] group-hover:opacity-[0.45] group-hover:scale-110 !z-0"
                            style={{ mixBlendMode: 'normal', isolation: 'isolate' }}
                        />
                        <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 group-hover:bg-white/10 dark:group-hover:bg-slate-900/10 transition-colors duration-500 !z-[1]" />
                    </>
                )}

                {/* Pending Request Hover Image */}
                {isPending && (
                    <>
                        <img
                            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&v=2"
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-700 ease-out opacity-[0.10] group-hover:opacity-[0.40] group-hover:scale-105 !z-0"
                            style={{ mixBlendMode: 'normal', isolation: 'isolate' }}
                        />
                        <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 group-hover:bg-white/20 dark:group-hover:bg-slate-900/20 transition-colors duration-500 !z-[1]" />
                    </>
                )}

                <div className="relative z-10 flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${colorClass}`}>
                        <Icon className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value ?? 0}</p>
                    </div>
                </div>
            </div>
        );
    };

    const getRecordTypeBadge = (type) => {
        const styles = {
            PRESCRIPTION: 'bg-purple-100 text-purple-700 ring-1 ring-purple-200',
            LAB_RESULT: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
            DIAGNOSIS: 'bg-red-100 text-red-700 ring-1 ring-red-200',
            IMAGING: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
            VITALS: 'bg-green-100 text-green-700 ring-1 ring-green-200',
            GENERAL: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
        };
        return styles[type] || styles.GENERAL;
    };

    const tabs = [
        { id: 'overview', label: 'Dashboard', icon: TrendingUp },
        { id: 'myrecords', label: 'My Records', icon: ClipboardList },
        { id: 'create', label: 'Create Report', icon: Plus },
        { id: 'patients', label: 'Patients', icon: Users }
    ];

    return (
        <div className="flex h-screen overflow-hidden dashboard-bg-doctor bg-dots">
            <Sidebar role="DOCTOR" onLogout={handleLogout} />

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-full mx-auto px-6 py-8">

                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                            <StatCard icon={FileText} label="Records Created" value={dashboardStats?.recordsCreated} colorClass="icon-container-blue" delay={100} />
                            <StatCard icon={CheckCircle} label="Active Consents" value={dashboardStats?.activeConsents} colorClass="icon-container-green" delay={200} />
                            <StatCard icon={AlertCircle} label="Pending Requests" value={dashboardStats?.pendingRequests} colorClass="icon-container-amber" delay={300} />
                            <StatCard icon={Users} label="Patients Served" value={dashboardStats?.patientsServed} colorClass="icon-container-purple" delay={400} />
                        </div>
                    )}

                    {/* My Records Tab */}
                    {activeTab === 'myrecords' && (
                        <div className={`animate-fade-in transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Created Records</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">Records you have created for patients</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                                </div>
                            ) : myCreatedRecords.length === 0 ? (
                                <div className="card text-center py-16">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <ClipboardList className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Records Created Yet</h3>
                                    <p className="text-slate-500 dark:text-slate-400 mb-6">Start by creating a medical report for a patient</p>
                                    <button onClick={() => navigate('/doctor/dashboard?tab=create')} className="btn-primary">
                                        <Plus className="w-5 h-5 mr-2" />Create Report
                                    </button>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {myCreatedRecords.map((record) => (
                                        <MedicalCard key={record._id} record={record} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Create Report Tab */}
                    {activeTab === 'create' && (
                        <div className={`max-w-3xl animate-fade-in transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create Medical Report</h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">Generate a new medical record for a patient</p>
                            </div>

                            <form onSubmit={handleCreateReport} className="card space-y-6">
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
                                    <label className="label dark:text-slate-300">Prescription (Optional)</label>
                                    <textarea value={reportForm.prescription} onChange={(e) => setReportForm({ ...reportForm, prescription: e.target.value })} rows="3" className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="Medications, dosage, and instructions..." />
                                </div>

                                <button type="submit" disabled={loading} className="btn-glow w-full">
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Creating...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <Plus className="w-5 h-5" />
                                            Create Medical Report
                                        </span>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Patients Tab */}
                    {activeTab === 'patients' && (
                        <div className={`animate-fade-in transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Patient Management</h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">View and manage patient records</p>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                                </div>
                            ) : patients.length === 0 ? (
                                <div className="card text-center py-16">
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <Users className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Patients Found</h3>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {patients.map((patient, idx) => (
                                        <div
                                            key={patient.userId}
                                            className="card hover:shadow-xl transition-all duration-300"
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-white font-semibold">
                                                        {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{patient.firstName} {patient.lastName}</h3>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">ID: {patient.userId} • {patient.email}</p>
                                                    </div>
                                                </div>
                                                {patient.hasConsent ? (
                                                    <button onClick={() => handleViewPatientRecords(patient)} className="btn-primary">
                                                        View Records
                                                    </button>
                                                ) : (pendingConsentIds.includes(patient.userId) || patient.consentPending) ? (
                                                    <button
                                                        className="rounded-xl px-6 py-2 font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700 shadow-sm cursor-not-allowed transition-all duration-200"
                                                        style={{ minWidth: 140 }}
                                                        disabled
                                                    >
                                                        Consent Pending
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setConsentSentPatient(patient);
                                                            setConfirmConsentModal(true);
                                                        }}
                                                        className="btn-outline"
                                                    >
                                                        Request Consent
                                                    </button>
                                                )}
                                            </div>

                                            {selectedPatient?.userId === patient.userId && (
                                                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                                    {accessInfo && !accessInfo.fullAccess && (
                                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
                                                            <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">{accessInfo.message}</p>
                                                            {accessInfo.hiddenRecordCount > 0 && (
                                                                <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">{accessInfo.hiddenRecordCount} additional records require consent</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    <h4 className="font-bold text-slate-900 dark:text-white mb-4">Medical Timeline</h4>
                                                    {loadingPatientId === patient.userId ? (
                                                        <div className="text-center text-slate-400 py-8">
                                                            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-2" />
                                                            Loading records...
                                                        </div>
                                                    ) : patientRecords.length === 0 ? (
                                                        <div className="text-center text-slate-400 py-8">No records found for this patient.</div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {patientRecords.map(record => (
                                                                <MedicalCard key={record._id} record={record} />
                                                            ))}
                                                        </div>
                                                    )}
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

            {/* Confirmation Modal */}
            {
                confirmConsentModal && consentSentPatient && (
                    <Modal isOpen={confirmConsentModal} onClose={() => setConfirmConsentModal(false)} title="Request Access" icon={ShieldAlert} size="sm">
                        <div className="space-y-4">
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800 flex gap-3 text-left">
                                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">Consent Required</h4>
                                    <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                                        You are about to request access to medical records for <strong>{consentSentPatient.firstName} {consentSentPatient.lastName}</strong>.
                                        The patient determines what you can see.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end mt-4">
                                <button onClick={() => setConfirmConsentModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                                <button onClick={handleConfirmRequest} className="btn-primary py-2 px-4 text-sm">Request Access</button>
                            </div>
                        </div>
                    </Modal>
                )
            }

            {/* Consent Sent Modal */}
            {
                showConsentSentModal && consentSentPatient && (
                    <Modal isOpen={showConsentSentModal} onClose={() => setShowConsentSentModal(false)} title="Consent Request Sent" icon={MailCheck} size="sm">
                        <div className="space-y-3 text-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 flex items-center justify-center mb-2">
                                    <MailCheck className="w-8 h-8 text-green-600" />
                                </div>
                                <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Request Sent!</h4>
                                <p className="text-slate-600 dark:text-slate-400 text-sm">A consent request has been sent to <span className="font-bold">{consentSentPatient.firstName} {consentSentPatient.lastName}</span> (ID: {consentSentPatient.userId}).<br />They will need to approve it before you can view their records.</p>
                            </div>
                            <button onClick={() => setShowConsentSentModal(false)} className="btn-primary w-full mt-4">OK</button>
                        </div>
                    </Modal>
                )
            }
        </div >
    );
};

export default DoctorDashboard;
