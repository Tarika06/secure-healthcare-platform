import apiClient from './client';

const appointmentApi = {
    // Book a new appointment (Patient)
    bookAppointment: async (data) => {
        const response = await apiClient.post('/appointments', data);
        return response.data;
    },

    // Get available time slots for a specific doctor on a specific date (Patient)
    getAvailableSlots: async (doctorId, date) => {
        const response = await apiClient.get(`/appointments/slots/${doctorId}/${date}`);
        return response.data;
    },

    // List appointments with optional filters (status, date)
    listAppointments: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const response = await apiClient.get(`/appointments?${params}`);
        return response.data;
    },

    // Get a specific appointment by ID
    getAppointmentById: async (id) => {
        const response = await apiClient.get(`/appointments/${id}`);
        return response.data;
    },

    // Verify patient entry using QR token (Nurse/Admin)
    verifyEntry: async (qrToken) => {
        const response = await apiClient.post('/appointments/verify-entry', { qrToken });
        return response.data;
    },

    // Cancel an appointment (Patient)
    cancelAppointment: async (id) => {
        const response = await apiClient.put(`/appointments/${id}/cancel`);
        return response.data;
    },
};

export default appointmentApi;
