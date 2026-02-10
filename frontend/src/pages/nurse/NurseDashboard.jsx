import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, FileText, Plus, Search, User, Heart, Thermometer, Clock, TrendingUp } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
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
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const fetchPatientVitals = async (patientId) => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/mgmt/nurse/vitals/${patientId}`);
            setVitals(response.data.vitals || []);
        } catch (error) {
            console.error('Error fetching vitals:', error);
            setVitals([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPatientNotes = async (patientId) => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/mgmt/nurse/notes/${patientId}`);
            setCareNotes(response.data.records || []);
        } catch (error) {
            console.error('Error fetching care notes:', error);
            setCareNotes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        if (activeTab === 'vitals') {
            fetchPatientVitals(patient.userId);
        } else {
            fetchPatientNotes(patient.userId);
        }
    };

    const handleAddNote = async (recordId) => {
        if (!newNote.trim()) return;
        try {
            await apiClient.post(`/mgmt/nurse/notes/${recordId}`, { note: newNote });
            setNewNote('');
            fetchPatientNotes(selectedPatient.userId);
        } catch (error) {
            console.error('Error adding note:', error);
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
        { id: 'vitals', label: 'Patient Vitals', icon: Activity },
        { id: 'notes', label: 'Care Notes', icon: FileText }
    ];

    return (
        <div className="flex h-screen overflow-hidden dashboard-glass-bg">
            <div className="flex">
                <Sidebar
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

                <main className="flex-1 p-8">
                    <div className="max-w-full mx-auto">

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Patient List */}
                            <div className={`card transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-teal-100 dark:from-primary-900/40 dark:to-teal-900/40 flex items-center justify-center">
                                        <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Select Patient</h3>
                                </div>

                                <div className="relative mb-4">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search patients..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="input-field pl-11 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    />
                                </div>

                                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                    {filteredPatients.map((patient, idx) => (
                                        <button
                                            key={patient.userId}
                                            onClick={() => handleSelectPatient(patient)}
                                            className={`w-full text-left p-4 rounded-xl transition-all duration-300 border ${selectedPatient?.userId === patient.userId
                                                ? 'bg-gradient-to-r from-primary-50 to-teal-50 dark:from-primary-900/20 dark:to-teal-900/20 border-primary-200 dark:border-primary-800 shadow-md'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${selectedPatient?.userId === patient.userId
                                                    ? 'bg-gradient-to-br from-primary-500 to-teal-500'
                                                    : 'bg-slate-400'
                                                    }`}>
                                                    {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{patient.firstName} {patient.lastName}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{patient.userId}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className={`lg:col-span-2 card transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                {!selectedPatient ? (
                                    <div className="text-center py-16">
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <User className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Select a Patient</h3>
                                        <p className="text-slate-500 dark:text-slate-400">Choose a patient from the list to view their {activeTab === 'vitals' ? 'vitals' : 'care notes'}</p>
                                    </div>
                                ) : loading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                                    </div>
                                ) : activeTab === 'vitals' ? (
                                    <div className="animate-fade-in">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40 flex items-center justify-center">
                                                <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">Vitals</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                                            </div>
                                        </div>

                                        {vitals.length === 0 ? (
                                            <div className="text-center py-12">
                                                <Thermometer className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                                <p className="text-slate-500 dark:text-slate-400">No vitals recorded for this patient</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {vitals.map((v, idx) => (
                                                    <div key={idx} className="p-5 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-300">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className="px-3 py-1.5 bg-gradient-to-r from-primary-100 to-teal-100 dark:from-primary-900/40 dark:to-teal-900/40 text-primary-700 dark:text-primary-300 text-xs font-semibold rounded-full">
                                                                {v.recordType}
                                                            </span>
                                                            <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                                <Clock className="w-4 h-4" />
                                                                {new Date(v.createdAt).toLocaleString()}
                                                            </span>
                                                        </div>

                                                        {v.vitals && Object.keys(v.vitals).length > 0 ? (
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                                                                {Object.entries(v.vitals).map(([key, val]) => (
                                                                    <div key={key} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                                                                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                                                        <p className="text-lg font-bold text-slate-900 dark:text-white">{val}</p>
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
                                    <div className="animate-fade-in">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">Care Notes</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                                            </div>
                                        </div>

                                        {careNotes.length === 0 ? (
                                            <div className="text-center py-12">
                                                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                                <p className="text-slate-500 dark:text-slate-400">No care notes for this patient</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {careNotes.map((record) => {
                                                    const isCheckup = record.title?.toLowerCase().replace(/[^a-z]/g, '').includes('checkup') ||
                                                        record.recordType?.toLowerCase().replace(/[^a-z]/g, '').includes('checkup');
                                                    const isLab = record.title?.toLowerCase().includes('lab') ||
                                                        record.recordType?.toLowerCase().includes('lab');

                                                    return (
                                                        <div key={record.recordId} className="p-5 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-300 relative overflow-hidden group hover:!bg-transparent">

                                                            {/* Hover Background Image - Checkup */}
                                                            {isCheckup && !isLab && (
                                                                <>
                                                                    <img
                                                                        src="https://images.unsplash.com/photo-1666214280557-f1b5022eb634?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                                                        alt=""
                                                                        className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-500 ease-out opacity-0 translate-x-8 group-hover:opacity-[0.55] group-hover:translate-x-0 !z-0"
                                                                        style={{ mixBlendMode: 'normal', isolation: 'isolate' }}
                                                                    />
                                                                    <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 group-hover:bg-white/40 dark:group-hover:bg-slate-900/40 transition-colors duration-500 !z-[1]" />
                                                                </>
                                                            )}

                                                            {/* Hover Background Image - Lab */}
                                                            {isLab && (
                                                                <>
                                                                    <img
                                                                        src="https://images.unsplash.com/photo-1579154204601-01588f351e67?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                                                        alt=""
                                                                        className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-500 ease-out opacity-0 translate-x-8 group-hover:opacity-50 group-hover:translate-x-0 !z-0"
                                                                        style={{ mixBlendMode: 'normal', isolation: 'isolate' }}
                                                                    />
                                                                    <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 group-hover:bg-white/50 dark:group-hover:bg-slate-900/50 transition-colors duration-500 !z-[1]" />
                                                                </>
                                                            )}

                                                            {/* Hover Background Image - General Medical Record */}
                                                            {!isCheckup && !isLab && (
                                                                <>
                                                                    <img
                                                                        src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                                                        alt=""
                                                                        className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-500 ease-out opacity-0 translate-x-8 group-hover:opacity-60 group-hover:translate-x-0 !z-0"
                                                                        style={{ mixBlendMode: 'normal', isolation: 'isolate' }}
                                                                    />
                                                                    <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 group-hover:bg-white/40 dark:group-hover:bg-slate-900/40 transition-colors duration-500 !z-[1]" />
                                                                </>
                                                            )}

                                                            {/* Content Wrapper */}
                                                            <div className="relative z-10">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <p className="font-bold text-slate-900 dark:text-white">{record.title}</p>
                                                                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-full">{record.recordType}</span>
                                                                </div>

                                                                {record.careNotes?.length > 0 && (
                                                                    <div className="space-y-3 mb-4">
                                                                        {record.careNotes.map((note, idx) => (
                                                                            <div key={idx} className="ml-4 pl-4 border-l-2 border-primary-200 dark:border-primary-800">
                                                                                <p className="text-slate-700 dark:text-slate-300">{note.note}</p>
                                                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
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
                                                                        className="input-field dark:bg-slate-800 dark:border-slate-700 dark:text-white flex-1"
                                                                    />
                                                                    <button
                                                                        onClick={() => handleAddNote(record.recordId)}
                                                                        className="btn-primary px-4"
                                                                    >
                                                                        <Plus className="w-5 h-5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Access Notice */}
                        <div className={`mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                                    <Activity className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-amber-900 dark:text-amber-200">Access Level: Nurse</p>
                                    <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                                        You can view patient vitals and manage care notes. Diagnosis, prescriptions, and detailed medical history are restricted to authorized personnel.
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

export default NurseDashboard;
