import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, FileText, Plus, Search, User, Heart, Thermometer, Clock, ChevronRight, ScanLine } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import QRScannerTab from '../../components/nurse/QRScannerTab';
import IdentityCard from '../../components/IdentityCard';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';

const NurseDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('vitals');
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [vitals, setVitals] = useState([]);
    const [careNotes, setCareNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await apiClient.get('/records/patients/list');
            setPatients(response.data.patients || []);
        } catch (error) { console.error('Error fetching patients:', error); }
    };

    const fetchPatientVitals = async (patientId) => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/mgmt/nurse/vitals/${patientId}`);
            setVitals(response.data.vitals || []);
        } catch (error) { console.error('Error fetching vitals:', error); setVitals([]); }
        finally { setLoading(false); }
    };

    const fetchPatientNotes = async (patientId) => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/mgmt/nurse/notes/${patientId}`);
            setCareNotes(response.data.records || []);
        } catch (error) { console.error('Error fetching care notes:', error); setCareNotes([]); }
        finally { setLoading(false); }
    };

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        if (activeTab === 'vitals') fetchPatientVitals(patient.userId);
        else fetchPatientNotes(patient.userId);
    };

    const handleAddNote = async (recordId) => {
        if (!newNote.trim()) return;
        try {
            await apiClient.post(`/mgmt/nurse/notes/${recordId}`, { note: newNote });
            setNewNote('');
            fetchPatientNotes(selectedPatient.userId);
        } catch (error) { console.error('Error adding note:', error); }
    };

    const handleLogout = async () => { await logout(); navigate('/login'); };

    const filteredPatients = patients.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sidebarItems = [
        { id: 'vitals', label: 'Patient Vitals', icon: Activity },
        { id: 'notes', label: 'Care Notes', icon: FileText },
        { id: 'verify', label: 'Verify Entry', icon: ScanLine }
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white transition-colors duration-500">
            <Sidebar
                role="NURSE"
                items={sidebarItems}
                activeItem={activeTab}
                onItemClick={(id) => {
                    setActiveTab(id);
                    if (selectedPatient) {
                        if (id === 'vitals') fetchPatientVitals(selectedPatient.userId);
                        else fetchPatientNotes(selectedPatient.userId);
                    }
                }}
                user={user}
                onLogout={handleLogout}
            />

            {/* ═══ Two-Panel Split Workstation ═══ */}
            <div className="flex-1 flex overflow-hidden relative z-10">
                {/* Left Panel: Patient Roster */}
                <div className="w-[340px] flex-shrink-0 h-full flex flex-col border-r border-slate-200/40 bg-white/50 backdrop-blur-md dark:bg-slate-900/50 dark:border-white/10">
                    {/* Roster Header */}
                    <div className="p-5 border-b border-slate-100/60">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-heading font-bold text-slate-900 text-lg">Nurse Station</h2>
                                <p className="text-xs text-slate-500">{user?.firstName} {user?.lastName}</p>
                            </div>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search patients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-2 px-1">{filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Patient List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                        {filteredPatients.map((patient) => (
                            <button
                                key={patient.userId}
                                onClick={() => handleSelectPatient(patient)}
                                className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 flex items-center gap-3 group ${selectedPatient?.userId === patient.userId
                                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 shadow-sm'
                                    : 'hover:bg-slate-50 border border-transparent'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0 ${selectedPatient?.userId === patient.userId
                                    ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                                    : 'bg-gradient-to-br from-slate-400 to-slate-500'
                                    }`}>
                                    {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900 text-sm truncate">{patient.firstName} {patient.lastName}</p>
                                    <p className="text-xs text-slate-500 font-mono truncate">{patient.userId}</p>
                                </div>
                                {selectedPatient?.userId === patient.userId && (
                                    <ChevronRight className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Workspace */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                    {activeTab === 'verify' ? (
                        <QRScannerTab />
                    ) : !selectedPatient ? (
                        <div className="h-full flex flex-col">
                            <IdentityCard user={user} />
                            <div className="flex-1 flex flex-col items-center justify-center text-center mt-[-40px]">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center shadow-inner">
                                    <User className="w-10 h-10 text-emerald-300 animate-float" />
                                </div>
                                <h3 className="text-lg font-heading font-semibold text-slate-700 mb-2">Select a Patient</h3>
                                <p className="text-slate-400 text-sm">Choose a patient to view their {activeTab === 'vitals' ? 'vitals' : 'care notes'}</p>
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                        </div>
                    ) : activeTab === 'vitals' ? (
                        <div className="tab-content max-w-4xl">
                            {/* Patient Header */}
                            <div className="glass-card mb-6 bg-gradient-to-r from-emerald-50/50 to-green-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                        {selectedPatient.firstName?.charAt(0)}{selectedPatient.lastName?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-heading font-bold text-slate-900">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                                        <p className="text-sm text-slate-500 font-mono">{selectedPatient.userId}</p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2">
                                        <Heart className="w-5 h-5 text-rose-500" />
                                        <span className="text-sm font-semibold text-slate-700">Vitals</span>
                                    </div>
                                </div>
                            </div>

                            {vitals.length === 0 ? (
                                <div className="glass-card text-center py-12">
                                    <Thermometer className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-float" />
                                    <p className="text-slate-500 font-medium">No vitals recorded for this patient</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {vitals.map((v, idx) => (
                                        <div key={idx} className="glass-card stagger-item" style={{ animationDelay: `${idx * 80}ms` }}>
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="badge badge-medical">{v.recordType}</span>
                                                <span className="text-sm text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(v.createdAt).toLocaleString()}
                                                </span>
                                            </div>

                                            {v.vitals && Object.keys(v.vitals).length > 0 ? (
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                                                    {Object.entries(v.vitals).map(([key, val]) => (
                                                        <div key={key} className="glass-card-l3 p-3 hover:border-emerald-200 transition-colors">
                                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                                            <p className="text-lg font-bold text-slate-900 font-mono">{val}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400 italic mt-3">No detailed vitals data available</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="tab-content max-w-4xl">
                            {/* Patient Header */}
                            <div className="glass-card mb-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                        {selectedPatient.firstName?.charAt(0)}{selectedPatient.lastName?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-heading font-bold text-slate-900">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                                        <p className="text-sm text-slate-500 font-mono">{selectedPatient.userId}</p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-500" />
                                        <span className="text-sm font-semibold text-slate-700">Care Notes</span>
                                    </div>
                                </div>
                            </div>

                            {careNotes.length === 0 ? (
                                <div className="glass-card text-center py-12">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-float" />
                                    <p className="text-slate-500 font-medium">No care notes for this patient</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {careNotes.map((record) => (
                                        <div key={record.recordId} className="glass-card">
                                            <div className="flex items-center gap-2 mb-3">
                                                <p className="font-bold text-slate-900">{record.title}</p>
                                                <span className="badge badge-general">{record.recordType}</span>
                                            </div>

                                            {record.careNotes?.length > 0 && (
                                                <div className="space-y-3 mb-4">
                                                    {record.careNotes.map((note, idx) => (
                                                        <div key={idx} className="ml-4 pl-4 border-l-2 border-emerald-300">
                                                            <p className="text-slate-700">{note.note}</p>
                                                            <p className="text-xs text-slate-400 mt-1">
                                                                Added by {note.addedBy} on {new Date(note.addedAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex gap-2 mt-4">
                                                <input
                                                    type="text"
                                                    placeholder="Add a care note..."
                                                    value={newNote}
                                                    onChange={(e) => setNewNote(e.target.value)}
                                                    className="input-field flex-1"
                                                />
                                                <button onClick={() => handleAddNote(record.recordId)} className="btn-primary px-4 flex items-center gap-2">
                                                    <Plus className="w-4 h-4" /> Add
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Access Notice */}
                    {selectedPatient && (
                        <div className="max-w-4xl mt-8">
                            <div className="glass-card border-l-4 border-amber-400 bg-gradient-to-r from-amber-50/60 to-orange-50/40">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                        <Activity className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-amber-900 text-sm">Access Level: Nurse</p>
                                        <p className="text-amber-700 text-xs mt-1">
                                            You can view patient vitals and manage care notes. Diagnosis, prescriptions, and detailed medical history are restricted to authorized personnel.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NurseDashboard;
