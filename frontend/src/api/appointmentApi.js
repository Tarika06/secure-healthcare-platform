import apiClient from './client';

const appointmentApi = {
    // Request a new appointment (Patient)
    requestAppointment: async (data) => {
        const response = await apiClient.post('/appointments', data);
        return response.data;
    },

    // Approve an appointment (Admin)
    approveAppointment: async (id, data) => {
        const response = await apiClient.put(`/appointments/${id}/approve`, data);
        return response.data;
    },

    // Reject an appointment (Admin)
    rejectAppointment: async (id, data) => {
        const response = await apiClient.put(`/appointments/${id}/reject`, data);
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
        let appointmentId;
        try {
            // Import dynamically or assume it's loaded to get the appointment ID from the payload
            const payloadBase64Url = qrToken.split('.')[1];
            const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(payloadBase64));
            appointmentId = payload.appointmentId;
        } catch (e) {
            throw new Error("Invalid Token Format");
        }

        const response = await apiClient.post('/appointments/verify-entry', { appointmentId, token: qrToken });
        return response.data;
    },

    // Cancel an appointment (Patient)
    cancelAppointment: async (id) => {
        const response = await apiClient.put(`/appointments/${id}/cancel`);
        return response.data;
    },
};

export default appointmentApi;
