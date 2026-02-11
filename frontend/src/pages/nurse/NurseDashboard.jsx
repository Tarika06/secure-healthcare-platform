import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, FileText, Plus, Search, User } from 'lucide-react';
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

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await apiClient.get('/records/patients/list');
            if (response.data.patients && response.data.patients.length > 0) {
                setPatients(response.data.patients);
            } else {
                console.warn('Patient list is empty or undefined in response.');
                setPatients([]);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
            if (error.response) {
                console.error('Error Status:', error.response.status);
                console.error('Error Data:', error.response.data);
            }
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
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-slate-50">
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
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Nurse Dashboard</h1>
                        <p className="text-slate-600 mb-8">View patient vitals and manage care notes</p>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Patient List */}
                            <div className="card">
                                <h3 className="font-semibold text-slate-900 mb-4">Select Patient</h3>
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search patients..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="input-field pl-10"
                                    />
                                </div>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {filteredPatients.map(patient => (
                                        <button
                                            key={patient.userId}
                                            onClick={() => handleSelectPatient(patient)}
                                            className={`w-full text-left p-3 rounded-lg transition-all ${selectedPatient?.userId === patient.userId
                                                    ? 'bg-primary-100 border-primary-300'
                                                    : 'hover:bg-slate-50 border-slate-200'
                                                } border`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <User className="h-5 w-5 text-primary-600" />
                                                <div>
                                                    <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                                                    <p className="text-xs text-slate-500">{patient.userId}</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="lg:col-span-2 card">
                                {!selectedPatient ? (
                                    <div className="text-center text-slate-500 py-12">
                                        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Select a patient to view {activeTab === 'vitals' ? 'vitals' : 'care notes'}</p>
                                    </div>
                                ) : loading ? (
                                    <div className="text-center py-12">Loading...</div>
                                ) : activeTab === 'vitals' ? (
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-4">
                                            Vitals for {selectedPatient.firstName} {selectedPatient.lastName}
                                        </h3>
                                        {vitals.length === 0 ? (
                                            <p className="text-slate-500">No vitals recorded</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {vitals.map((v, idx) => (
                                                    <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                                                                {v.recordType}
                                                            </span>
                                                            <span className="text-sm text-slate-500">
                                                                {new Date(v.createdAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        {v.vitals && Object.keys(v.vitals).length > 0 ? (
                                                            <div className="grid grid-cols-2 gap-2 mt-3">
                                                                {Object.entries(v.vitals).map(([key, val]) => (
                                                                    <div key={key} className="bg-white p-2 rounded border">
                                                                        <p className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                                                        <p className="font-medium text-slate-900">{val}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-slate-400 italic mt-2">No vitals data in this record</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-4">
                                            Care Notes for {selectedPatient.firstName} {selectedPatient.lastName}
                                        </h3>
                                        {careNotes.length === 0 ? (
                                            <p className="text-slate-500">No records with care notes</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {careNotes.map((record) => (
                                                    <div key={record.recordId} className="p-4 bg-slate-50 rounded-lg">
                                                        <p className="font-medium">{record.title}</p>
                                                        <p className="text-xs text-slate-500 mb-2">{record.recordType}</p>
                                                        {record.careNotes?.map((note, idx) => (
                                                            <div key={idx} className="ml-4 border-l-2 border-primary-200 pl-3 mb-2">
                                                                <p className="text-sm">{note.note}</p>
                                                                <p className="text-xs text-slate-400">
                                                                    Added by {note.addedBy} on {new Date(note.addedAt).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        ))}
                                                        <div className="mt-3 flex gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="Add a care note..."
                                                                value={newNote}
                                                                onChange={(e) => setNewNote(e.target.value)}
                                                                className="input-field flex-1 text-sm"
                                                            />
                                                            <button
                                                                onClick={() => handleAddNote(record.recordId)}
                                                                className="btn-primary text-sm px-3"
                                                            >
                                                                <Plus className="h-4 w-4" />
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

                        {/* Access Restrictions Notice */}
                        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-amber-800 text-sm">
                                <strong>Note:</strong> As a nurse, you can view patient vitals and care notes only.
                                Diagnosis, prescriptions, and detailed medical history are restricted.
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default NurseDashboard;
