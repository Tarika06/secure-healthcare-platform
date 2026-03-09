import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, FileText, Plus, Search, User, Heart, Thermometer, Clock, TrendingUp, X } from 'lucide-react';
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
    const [showNoteOverlay, setShowNoteOverlay] = useState(false);
    const [activeRecord, setActiveRecord] = useState(null);
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

    const handleAddNote = async (e) => {
        if (e) e.preventDefault();
        if (!newNote.trim() || !activeRecord) return;
        try {
            await apiClient.post(`/mgmt/nurse/notes/${activeRecord.recordId}`, { note: newNote });
            setNewNote('');
            setShowNoteOverlay(false);
            setActiveRecord(null);
            fetchPatientNotes(selectedPatient.userId);
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    const handleQuickTemplate = (template) => {
        setNewNote(prev => prev ? `${prev}\n${template}` : template);
    };

    const openNoteOverlay = (record) => {
        setActiveRecord(record);
        setShowNoteOverlay(true);
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
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40 flex items-center justify-center shadow-sm">
                                                    <Heart className="w-6 h-6 text-red-600 dark:text-red-400 animate-pulse" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Patient Vitals</h3>
                                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Monitoring: {selectedPatient.firstName} {selectedPatient.lastName}</p>
                                                </div>
                                            </div>

                                            {/* Primary "Update Chart" Button - Always Visible when patient is selected */}
                                            <button
                                                onClick={() => openNoteOverlay({ title: 'Manual Chart Update', recordId: 'DIRECT_UPDATE' })}
                                                className="flex items-center gap-2 px-6 py-3 bg-white/40 dark:bg-primary-900/30 backdrop-blur-md border border-white/60 dark:border-primary-800/50 rounded-2xl font-black text-primary-700 dark:text-primary-300 shadow-xl hover:shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest"
                                            >
                                                <Plus className="w-5 h-5" />
                                                Update Chart
                                            </button>
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
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center shadow-sm">
                                                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Care Notes</h3>
                                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => openNoteOverlay({ title: 'New Care Note', recordId: 'GENERAL_NOTE' })}
                                                className="flex items-center gap-2 px-6 py-3 bg-white/40 dark:bg-primary-900/30 backdrop-blur-md border border-white/60 dark:border-primary-800/50 rounded-2xl font-black text-primary-700 dark:text-primary-300 shadow-xl hover:shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest"
                                            >
                                                <Plus className="w-5 h-5" />
                                                Add Note
                                            </button>
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
                                                        <div key={record.recordId} className="p-5 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-300 relative overflow-hidden group">

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

                                                                <button
                                                                    onClick={() => openNoteOverlay(record)}
                                                                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary-100/50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg font-medium hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all border border-primary-200/50 dark:border-primary-800/50"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                    Add Care Note
                                                                </button>
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
            {/* Glassmorphism Note Overlay - Refined for High-Stress Medical Context */}
            {showNoteOverlay && activeRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-fade-in overflow-hidden">
                    {/* Background Blur Overlay (20px blur as per requirement) */}
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[20px] transition-all duration-500 ease-in-out"
                        onClick={() => setShowNoteOverlay(false)}
                    />

                    {/* Centered Glass Card */}
                    <div className="relative w-full max-w-2xl bg-white/20 dark:bg-slate-900/30 backdrop-blur-2xl border border-white/30 dark:border-white/10 rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] p-8 md:p-10 animate-slideUp overflow-hidden">
                        {/* Internal Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />

                        <div className="relative z-10 text-left">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white/30 dark:bg-primary-500/20 flex items-center justify-center shadow-inner border border-white/40">
                                        <FileText className="w-8 h-8 text-primary-700 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-950 dark:text-white tracking-tight leading-none">
                                            {selectedPatient.firstName} {selectedPatient.lastName}
                                        </h2>
                                        <p className="text-slate-800 dark:text-slate-300 font-bold mt-1.5 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
                                            Updating Chart: {activeRecord.title}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowNoteOverlay(false)}
                                    className="p-3 hover:bg-white/40 dark:hover:bg-slate-800/50 rounded-full transition-all text-slate-900 dark:text-slate-200 border border-transparent hover:border-white/20"
                                >
                                    <X className="w-7 h-7" />
                                </button>
                            </div>

                            {/* Live Context Bar (Contextual Awareness) */}
                            <div className="mb-8 p-5 rounded-[1.5rem] bg-white/20 dark:bg-white/5 border border-white/40 dark:border-white/10 shadow-sm backdrop-blur-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-[0.2em]">Real-Time Vitals Reference</h3>
                                    <div className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-bold">LIVE</div>
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    {vitals.length > 0 ? (
                                        Object.entries(vitals[0]?.vitals || {}).slice(0, 3).map(([key, val]) => (
                                            <div key={key} className="flex flex-col border-r border-white/20 last:border-0 pr-4">
                                                <span className="text-[10px] text-slate-900 dark:text-slate-400 uppercase font-black mb-1 leading-none">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                <span className="text-2xl font-black text-slate-950 dark:text-white tabular-nums drop-shadow-sm">{val}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-3 py-2 text-center text-slate-800 dark:text-slate-400 font-medium italic">Monitor vitals in blurred background...</div>
                                    )}
                                </div>
                            </div>

                            <form onSubmit={handleAddNote} className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-lg font-black text-slate-950 dark:text-white">Observation Note</label>
                                        <span className="text-[10px] font-bold text-slate-600 px-2 py-1 bg-white/40 rounded-md">AUTOSAVE ENABLED</span>
                                    </div>

                                    {/* Large Input Area */}
                                    <textarea
                                        autoFocus
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Type clinical observations, assessment findings, or actions taken..."
                                        className="w-full h-52 bg-white/40 dark:bg-slate-950/40 border-2 border-white/60 dark:border-slate-700/50 rounded-2xl p-6 text-slate-950 dark:text-white text-lg placeholder:text-slate-700/50 dark:placeholder:text-slate-500 focus:ring-4 focus:ring-primary-500/30 focus:border-primary-500/50 outline-none transition-all resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] font-medium leading-relaxed"
                                        required
                                    />

                                    {/* Quick Templates Buttons */}
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {[
                                            { label: "Medication Given", color: "bg-blue-500/20 text-blue-700 dark:text-blue-300" },
                                            { label: "Vitals Stable", color: "bg-green-500/20 text-green-700 dark:text-green-300" },
                                            { label: "Follow-up Required", color: "bg-amber-500/20 text-amber-700 dark:text-amber-300" }
                                        ].map((t) => (
                                            <button
                                                key={t.label}
                                                type="button"
                                                onClick={() => handleQuickTemplate(t.label)}
                                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 border border-white/40 ${t.color}`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowNoteOverlay(false)}
                                        className="flex-1 py-5 rounded-2xl font-black text-slate-950 dark:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-all border-2 border-white/60 dark:border-white/10 uppercase tracking-widest text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newNote.trim()}
                                        className="flex-1 py-5 rounded-2xl font-black text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:shadow-[0_20px_40px_-12px_rgba(37,99,235,0.4)] transition-all disabled:opacity-50 disabled:shadow-none uppercase tracking-widest text-sm"
                                    >
                                        Save Update
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NurseDashboard;
