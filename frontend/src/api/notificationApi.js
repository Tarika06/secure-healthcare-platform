import apiClient from './client';

const notificationApi = {
    // Get all notifications for the logged-in user
    getNotifications: async () => {
        const response = await apiClient.get('/notifications');
        return response.data;
    },

    // Get the count of unread notifications
    getUnreadCount: async () => {
        const response = await apiClient.get('/notifications/unread');
        return response.data;
    },

    // Mark a specific notification as read
    markAsRead: async (id) => {
        const response = await apiClient.put(`/notifications/${id}/read`);
        return response.data;
    },

    // Mark all notifications as read
    markAllAsRead: async () => {
        const response = await apiClient.put('/notifications/mark-all-read');
        return response.data;
    }
};

export default notificationApi;
