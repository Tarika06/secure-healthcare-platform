import axios from 'axios';

const API_URL = 'http://localhost:5000/api/alerts';

const getAlerts = async (status) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(API_URL + (status ? `?status=${status}` : ''), {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const analyzeLogs = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/analyze`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const updateAlertStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    const response = await axios.patch(`${API_URL}/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const blockIP = async (ipAddress, alertId) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/block-ip`, { ipAddress, alertId }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export default {
    getAlerts,
    analyzeLogs,
    updateAlertStatus,
    blockIP
};
