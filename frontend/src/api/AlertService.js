import apiClient from './client';

const getAlerts = async (status) => {
    const response = await apiClient.get('/alerts' + (status ? `?status=${status}` : ''));
    return response.data;
};

const analyzeLogs = async () => {
    const response = await apiClient.post('/alerts/analyze');
    return response.data;
};

const updateAlertStatus = async (id, status) => {
    const response = await apiClient.patch(`/alerts/${id}`, { status });
    return response.data;
};

const blockIP = async (ipAddress, alertId) => {
    const response = await apiClient.post('/alerts/block-ip', { ipAddress, alertId });
    return response.data;
};

export default {
    getAlerts,
    analyzeLogs,
    updateAlertStatus,
    blockIP
};
