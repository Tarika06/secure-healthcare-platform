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

    const handleLogout = () => { logout(); navigate('/login'); };

    const filteredPatients = patients.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sidebarItems = [
        { id: 'vitals', label: 'Patient Vitals', icon: Activity },
        { id: 'notes', label: 'Care Notes', icon: FileText }
    ];

    return (
        <div className="flex min-h-screen dashboard-glass-bg">
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
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                                    <Activity className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900">Nurse Dashboard</h1>
                                    <p className="text-slate-500">Welcome back, <span className="text-green-600 font-medium">{user?.firstName} {user?.lastName}</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Patient List */}
                            <div className={`card transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-teal-100 flex items-center justify-center">
                                        <User className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <h3 className="font-bold text-slate-900">Select Patient</h3>
                                </div>

                                <div className="relative mb-4">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search patients..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="input-field pl-11"
                                    />
                                </div>

                                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                    {filteredPatients.map((patient, idx) => (
                                        <button
                                            key={patient.userId}
                                            onClick={() => handleSelectPatient(patient)}
                                            className={`w-full text-left p-4 rounded-xl transition-all duration-300 border ${selectedPatient?.userId === patient.userId
                                                ? 'bg-gradient-to-r from-primary-50 to-teal-50 border-primary-200 shadow-md'
                                                : 'hover:bg-slate-50 border-slate-200 hover:border-slate-300'
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
                                                    <p className="font-semibold text-slate-900">{patient.firstName} {patient.lastName}</p>
                                                    <p className="text-xs text-slate-500">{patient.userId}</p>
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
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                                            <User className="w-10 h-10 text-slate-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a Patient</h3>
                                        <p className="text-slate-500">Choose a patient from the list to view their {activeTab === 'vitals' ? 'vitals' : 'care notes'}</p>
                                    </div>
                                ) : loading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                                    </div>
                                ) : activeTab === 'vitals' ? (
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center">
                                                <Heart className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">Vitals</h3>
                                                <p className="text-sm text-slate-500">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                                            </div>
                                        </div>

                                        {vitals.length === 0 ? (
                                            <div className="text-center py-12">
                                                <Thermometer className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                                <p className="text-slate-500">No vitals recorded for this patient</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {vitals.map((v, idx) => (
                                                    <div key={idx} className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100 hover:shadow-md transition-all duration-300">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className="px-3 py-1.5 bg-gradient-to-r from-primary-100 to-teal-100 text-primary-700 text-xs font-semibold rounded-full">
                                                                {v.recordType}
                                                            </span>
                                                            <span className="text-sm text-slate-500 flex items-center gap-1">
                                                                <Clock className="w-4 h-4" />
                                                                {new Date(v.createdAt).toLocaleString()}
                                                            </span>
                                                        </div>

                                                        {v.vitals && Object.keys(v.vitals).length > 0 ? (
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                                                                {Object.entries(v.vitals).map(([key, val]) => (
                                                                    <div key={key} className="bg-white p-3 rounded-xl border border-slate-100 hover:border-primary-200 transition-colors">
                                                                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                                                        <p className="text-lg font-bold text-slate-900">{val}</p>
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
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900">Care Notes</h3>
                                                <p className="text-sm text-slate-500">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                                            </div>
                                        </div>

                                        {careNotes.length === 0 ? (
                                            <div className="text-center py-12">
                                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                                <p className="text-slate-500">No care notes for this patient</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {careNotes.map((record) => (
                                                    <div key={record.recordId} className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <p className="font-bold text-slate-900">{record.title}</p>
                                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">{record.recordType}</span>
                                                        </div>

                                                        {record.careNotes?.length > 0 && (
                                                            <div className="space-y-3 mb-4">
                                                                {record.careNotes.map((note, idx) => (
                                                                    <div key={idx} className="ml-4 pl-4 border-l-2 border-primary-200">
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
                                                            <button
                                                                onClick={() => handleAddNote(record.recordId)}
                                                                className="btn-primary px-4"
                                                            >
                                                                <Plus className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Access Notice */}
                        <div className={`mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                    <Activity className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-amber-900">Access Level: Nurse</p>
                                    <p className="text-amber-700 text-sm mt-1">
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
