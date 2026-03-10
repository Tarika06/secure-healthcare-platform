import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, FileText, Plus, Search, User, X, Sparkles } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import NurseAppointmentsTab from '../../components/nurse/NurseAppointmentsTab';
import { ScanLine } from 'lucide-react';

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

    const fetchPatients = useCallback(async () => {
        try {
            const response = await apiClient.get('/records/patients/list');
            setPatients(response.data.patients || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    }, []);

    const fetchPatientVitals = useCallback(async (patientId) => {
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
    }, []);

    const fetchPatientNotes = useCallback(async (patientId) => {
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
    }, []);

    useEffect(() => {
        setMounted(true);
        fetchPatients();
    }, [fetchPatients]);

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
        { id: 'verify', label: 'Verify Entry', icon: ScanLine },
        { id: 'notes', label: 'Care Notes', icon: FileText }
    ];

    return (
        <div className="flex h-screen overflow-hidden dashboard-glass-bg">
            <div className="flex w-full">
                <Sidebar
                    items={sidebarItems}
                    activeItem={activeTab}
                    onItemClick={(id) => {
                        setActiveTab(id);
                        if (selectedPatient && id !== 'verify') {
                            if (id === 'vitals') fetchPatientVitals(selectedPatient.userId);
                            else fetchPatientNotes(selectedPatient.userId);
                        }
                    }}
                    user={user}
                    onLogout={handleLogout}
                />

                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-full mx-auto">
                        
                        {/* Header */}
                        <div className="bg-gradient-to-r from-teal-900 to-emerald-900 rounded-3xl p-8 mb-10 shadow-2xl relative overflow-hidden flex items-center justify-between animate-fade-in border border-teal-800/50">
                            {/* Decorative background blurs */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full mix-blend-screen filter blur-[80px] opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500 rounded-full mix-blend-screen filter blur-[60px] opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2 text-teal-200">
                                    <Sparkles className="w-5 h-5" />
                                    <span className="text-sm font-bold uppercase tracking-widest">Nursing Station</span>
                                </div>
                                <h1 className="text-4xl font-black tracking-tight text-white">
                                    Welcome, <span className="text-teal-300">{user?.firstName || 'Nurse'}</span>
                                </h1>
                            </div>
                            <div className="flex items-center gap-4 group cursor-default relative z-10">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-black text-teal-300/80 uppercase tracking-widest leading-none mb-1.5">Nurse ID</p>
                                    <p className="text-sm font-bold text-teal-50 leading-none shadow-sm">{user?.userId || 'NURSE'}</p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-teal-800/50 border border-teal-700/50 flex items-center justify-center text-teal-50 font-black text-xl shadow-inner backdrop-blur-sm group-hover:rotate-6 group-hover:scale-105 transition-all duration-300">
                                    {user?.firstName?.[0] || 'N'}{user?.lastName?.[0] || 'U'}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className={`card transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                                <h3 className="font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5" /> Select Patient</h3>
                                <div className="relative mb-4">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="input-field pl-11"
                                    />
                                </div>
                                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                    {filteredPatients.map((patient) => (
                                        <button
                                            key={patient.userId}
                                            onClick={() => handleSelectPatient(patient)}
                                            className={`w-full text-left p-4 rounded-xl transition-all border ${selectedPatient?.userId === patient.userId ? 'bg-primary-50 border-primary-200 shadow-md' : 'hover:bg-slate-50 border-slate-200'}`}
                                        >
                                            <p className="font-semibold">{patient.firstName} {patient.lastName}</p>
                                            <p className="text-xs text-slate-500">{patient.userId}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={`lg:col-span-2 card transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                                {!selectedPatient ? (
                                    <div className="text-center py-16">
                                        <h3 className="text-xl font-semibold">Select a Patient</h3>
                                        <p className="text-slate-500">Choose a patient to view their {activeTab === 'vitals' ? 'vitals' : 'care notes'}</p>
                                    </div>
                                ) : loading ? (
                                    <div className="flex flex-col items-center justify-center py-24">
                                        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                                        <p className="text-slate-500 mt-4">Loading secure data...</p>
                                    </div>
                                ) : activeTab === 'vitals' ? (
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-black uppercase tracking-tight">Patient Vitals</h3>
                                            <button
                                                onClick={() => openNoteOverlay({ title: 'Manual Chart Update', recordId: 'DIRECT_UPDATE' })}
                                                className="btn-primary text-xs"
                                            >
                                                <Plus className="w-4 h-4 mr-1" /> Update Chart
                                            </button>
                                        </div>
                                        {vitals.length === 0 ? <p>No vitals recorded.</p> : (
                                            <div className="space-y-4">
                                                {vitals.map((v, idx) => (
                                                    <div key={idx} className="p-4 border rounded-xl bg-slate-50">
                                                        <div className="flex justify-between text-xs text-slate-500 mb-2">
                                                            <span>{v.recordType}</span>
                                                            <span>{new Date(v.createdAt).toLocaleString()}</span>
                                                        </div>
                                                        {v.vitals && (
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm font-bold">
                                                                {Object.entries(v.vitals).map(([k, val]) => (
                                                                    <div key={k}>{k}: {val}</div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : activeTab === 'verify' ? (
                                    <div className="animate-fade-in">
                                        <NurseAppointmentsTab />
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-black uppercase tracking-tight">Care Notes</h3>
                                            <button
                                                onClick={() => openNoteOverlay({ title: 'New Care Note', recordId: 'GENERAL_NOTE' })}
                                                className="btn-primary text-xs"
                                            >
                                                <Plus className="w-4 h-4 mr-1" /> Add Note
                                            </button>
                                        </div>
                                        {careNotes.length === 0 ? <p>No care notes.</p> : (
                                            <div className="space-y-4">
                                                {careNotes.map((record) => (
                                                    <div key={record.recordId} className="p-4 border rounded-xl bg-slate-50">
                                                        <p className="font-bold mb-2">{record.title}</p>
                                                        {record.careNotes?.map((note, idx) => (
                                                            <div key={idx} className="ml-4 pl-4 border-l-2 text-sm mb-2">
                                                                <p>{note.note}</p>
                                                                <p className="text-[10px] text-slate-400">By {note.addedBy} - {new Date(note.addedAt).toLocaleString()}</p>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => openNoteOverlay(record)}
                                                            className="text-primary-600 text-xs mt-2"
                                                        >
                                                            + Add Note
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`mt-8 p-6 bg-amber-50 rounded-2xl ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="flex items-start gap-4 text-sm">
                                <Activity className="w-6 h-6 text-amber-600" />
                                <div>
                                    <p className="font-semibold">Access Level: Nurse</p>
                                    <p className="text-amber-700 mt-1">Manage vitals and care notes securely.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {showNoteOverlay && activeRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
                    <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative">
                        <button onClick={() => setShowNoteOverlay(false)} className="absolute top-4 right-4"><X /></button>
                        <h2 className="text-2xl font-black mb-6">Update Chart: {activeRecord.title}</h2>
                        <form onSubmit={handleAddNote} className="space-y-6">
                            <textarea
                                autoFocus
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                className="w-full h-40 p-4 border rounded-xl"
                                placeholder="Enter observations..."
                                required
                            />
                            <div className="flex flex-wrap gap-2">
                                {["Medication Given", "Vitals Stable"].map(t => (
                                    <button key={t} type="button" onClick={() => handleQuickTemplate(t)} className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold">{t}</button>
                                ))}
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowNoteOverlay(false)} className="flex-1 py-4 border rounded-xl font-bold uppercase tracking-widest text-sm">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-primary-600 text-white rounded-xl font-bold uppercase tracking-widest text-sm">Save Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NurseDashboard;
