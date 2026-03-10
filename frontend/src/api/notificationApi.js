import apiClient from './client';

const notificationApi = {
    getNotifications: async (limit = 20) => {
        const response = await apiClient.get(`/notifications?limit=${limit}`);
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await apiClient.get('/notifications/unread-count');
        return response.data;
    },

    markAsRead: async (id) => {
        const response = await apiClient.put(`/notifications/${id}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await apiClient.put('/notifications/read-all');
        return response.data;
    }
};

export default notificationApi;
