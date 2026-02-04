import apiClient from './client';

const gdprApi = {
    // Right to Access: JSON
    getPersonalData: async () => {
        const response = await apiClient.get('/patient/gdpr/access');
        return response.data;
    },

    // Right to Access: PDF (returns blob for download)
    exportDataPDF: async () => {
        const response = await apiClient.get('/patient/gdpr/export-pdf', {
            responseType: 'blob'
        });
        return response.data;
    },

    // Right to Erasure
    requestErasure: async () => {
        const response = await apiClient.post('/patient/gdpr/erasure');
        return response.data;
    }
};

export default gdprApi;
