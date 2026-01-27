import apiClient from './client';

export const consentApi = {
    // Doctor requests consent from patient
    requestConsent: async (patientId) => {
        const response = await apiClient.post('/consent/request', { patientId });
        return response.data;
    },

    // Patient grants consent
    grantConsent: async (consentId) => {
        const response = await apiClient.post(`/consent/grant/${consentId}`);
        return response.data;
    },

    // Patient denies consent
    denyConsent: async (consentId) => {
        const response = await apiClient.post(`/consent/deny/${consentId}`);
        return response.data;
    },

    // Patient revokes consent
    revokeConsent: async (consentId) => {
        const response = await apiClient.post(`/consent/revoke/${consentId}`);
        return response.data;
    },

    // Get pending consent requests (for patient)
    getPendingConsents: async () => {
        const response = await apiClient.get('/consent/pending');
        return response.data;
    },

    // Get active consents (for patient)
    getActiveConsents: async () => {
        const response = await apiClient.get('/consent/active');
        return response.data;
    },

    // Check if doctor has consent for patient
    checkConsent: async (patientId) => {
        const response = await apiClient.get(`/consent/check/${patientId}`);
        return response.data;
    }
};

export default consentApi;
