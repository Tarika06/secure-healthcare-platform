import apiClient from './client';

const gdprApi = {
    // ═══════════════════════════════════════════════════════
    // RIGHT TO ACCESS
    // ═══════════════════════════════════════════════════════

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

    // ═══════════════════════════════════════════════════════
    // DELAYED DELETION WORKFLOW
    // ═══════════════════════════════════════════════════════

    // Step 1: Initiate deletion request (requires MFA to be enabled)
    initiateDeletion: async (deviceFingerprint) => {
        const response = await apiClient.post('/deletion/initiate', { deviceFingerprint });
        return response.data;
    },

    // Step 2: Verify MFA code to confirm deletion
    verifyMFAForDeletion: async (mfaCode, deviceFingerprint) => {
        const response = await apiClient.post('/deletion/verify-mfa', {
            mfaCode,
            deviceFingerprint
        });
        return response.data;
    },

    // Cancel pending deletion
    cancelDeletion: async () => {
        const response = await apiClient.post('/deletion/cancel');
        return response.data;
    },

    // Get current deletion status
    getDeletionStatus: async () => {
        const response = await apiClient.get('/deletion/status');
        return response.data;
    },

    // Get in-app notifications
    getNotifications: async () => {
        const response = await apiClient.get('/deletion/notifications');
        return response.data;
    },

    // Get authenticator notifications
    getAuthNotifications: async () => {
        const response = await apiClient.get('/deletion/auth-notifications');
        return response.data;
    },

    // Mark notification as read
    markNotificationRead: async (notifId) => {
        const response = await apiClient.post(`/deletion/notifications/${notifId}/read`);
        return response.data;
    },

    // Acknowledge authenticator notification
    acknowledgeAuthNotification: async (notifId) => {
        const response = await apiClient.post(`/deletion/auth-notifications/${notifId}/acknowledge`);
        return response.data;
    },

    // Legacy: Right to Erasure (now redirects to delayed deletion)
    requestErasure: async () => {
        const response = await apiClient.post('/deletion/initiate');
        return response.data;
    },

    // ═══════════════════════════════════════════════════════
    // ADMIN ENDPOINTS
    // ═══════════════════════════════════════════════════════

    // Admin: Get all pending deletions
    getPendingDeletions: async () => {
        const response = await apiClient.get('/deletion/admin/pending');
        return response.data;
    },

    // Admin: Get deletion history
    getDeletionHistory: async (limit = 50) => {
        const response = await apiClient.get(`/deletion/admin/history?limit=${limit}`);
        return response.data;
    }
};

export default gdprApi;
