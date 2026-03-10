import apiClient from './client';

/**
 * Teleconsultation API Client
 * 
 * Wrapper around apiClient for all /api/consultation/* endpoints.
 * Used by EmergencyConsultation and VideoRoom components.
 */
const teleconsultationApi = {
    // Request emergency consultation (Patient)
    requestConsultation: async ({ symptoms, specialtyNeeded, type, triage }) => {
        const response = await apiClient.post('/consultation/request', {
            symptoms, specialtyNeeded, type, triage
        });
        return response.data;
    },

    // Get pending consultation requests (Doctor)
    getPendingConsultations: async () => {
        const response = await apiClient.get('/consultation/pending');
        return response.data;
    },

    // Get active sessions (Patient/Doctor)
    getActiveSessions: async () => {
        const response = await apiClient.get('/consultation/active');
        return response.data;
    },

    // Get consultation history (Patient/Doctor)
    getHistory: async () => {
        const response = await apiClient.get('/consultation/history');
        return response.data;
    },

    // Get session details
    getSession: async (sessionId) => {
        const response = await apiClient.get(`/consultation/${sessionId}`);
        return response.data;
    },

    // Accept consultation (Doctor)
    acceptConsultation: async (sessionId) => {
        const response = await apiClient.patch(`/consultation/${sessionId}/accept`);
        return response.data;
    },

    // Reject consultation (Doctor)
    rejectConsultation: async (sessionId) => {
        const response = await apiClient.patch(`/consultation/${sessionId}/reject`);
        return response.data;
    },

    // Start session
    startSession: async (sessionId) => {
        const response = await apiClient.patch(`/consultation/${sessionId}/start`);
        return response.data;
    },

    // End session (Doctor)
    endSession: async (sessionId, notes, followUp, metrics = {}) => {
        const response = await apiClient.patch(`/consultation/${sessionId}/end`, { notes, followUp, metrics });
        return response.data;
    },

    // Save live notes draft (Doctor)
    updateNotes: async (sessionId, notes) => {
        const response = await apiClient.patch(`/consultation/${sessionId}/notes`, { notes });
        return response.data;
    },

    // Escalate for emergency (Doctor)
    escalateSession: async (sessionId) => {
        const response = await apiClient.post(`/consultation/${sessionId}/escalate`);
        return response.data;
    },

    // Get documents
    getDocuments: async (sessionId) => {
        const response = await apiClient.get(`/consultation/${sessionId}/documents`);
        return response.data;
    },

    // Upload document
    uploadDocument: async (sessionId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post(`/consultation/${sessionId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Download document
    downloadDocument: async (sessionId, documentId, filename) => {
        const response = await apiClient.get(`/consultation/${sessionId}/documents/${documentId}/download`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `document-${documentId}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },

    // Cancel session
    cancelSession: async (sessionId) => {
        const response = await apiClient.patch(`/consultation/${sessionId}/cancel`);
        return response.data;
    },

    // Create prescription (Doctor)
    createPrescription: async (sessionId, { medications, diagnosis, additionalNotes }) => {
        const response = await apiClient.post(`/consultation/${sessionId}/prescription`, {
            medications, diagnosis, additionalNotes
        });
        return response.data;
    },

    // Get prescription
    getPrescription: async (sessionId) => {
        const response = await apiClient.get(`/consultation/${sessionId}/prescription`);
        return response.data;
    },

    // Download prescription PDF
    downloadPrescriptionPDF: async (sessionId) => {
        const response = await apiClient.get(`/consultation/${sessionId}/prescription/pdf`, {
            responseType: 'blob'
        });
        // Trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `prescription-${sessionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },

    // --- Admin Endpoints ---

    // Get Video Logs
    getVideoLogs: async (params = {}) => {
        const response = await apiClient.get(`/admin/video-consultations/logs`, { params });
        return response.data;
    },

    // Get specific Video Log Details
    getVideoLogDetails: async (sessionId) => {
        const response = await apiClient.get(`/admin/video-consultations/logs/${sessionId}`);
        return response.data;
    },

    // Get Video Log Stats
    getVideoLogStats: async () => {
        const response = await apiClient.get(`/admin/video-consultations/stats`);
        return response.data;
    }
};

export default teleconsultationApi;
