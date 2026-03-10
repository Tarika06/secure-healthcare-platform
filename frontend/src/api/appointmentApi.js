import apiClient from './client';
import { jwtDecode } from 'jwt-decode';

const appointmentApi = {
    // Book an appointment (Patient)
    requestAppointment: async (appointmentData) => {
        const response = await apiClient.post('/appointments', appointmentData);
        return response.data;
    },

    // Get all appointments (with optional filters)
    getAppointments: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const response = await apiClient.get(`/appointments?${params.toString()}`);
        return response.data;
    },

    // Get specific appointment by ID
    getAppointmentById: async (id) => {
        const response = await apiClient.get(`/appointments/${id}`);
        return response.data;
    },

    // Get available time slots for a doctor on a specific date
    // Note: The backend route is /slots/:doctorId/:date
    getAvailableSlots: async (doctorId, date) => {
        const response = await apiClient.get(`/appointments/slots/${doctorId}/${date}`);
        return response.data;
    },

    // Verify patient entry using QR token (Nurse/Admin)
    verifyEntry: async (qrToken) => {
        let appointmentId;
        try {
            const decoded = jwtDecode(qrToken);
            appointmentId = decoded.appointmentId;
        } catch {
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

    // Admin: Approve an appointment
    approveAppointment: async (id, data) => {
        const response = await apiClient.put(`/appointments/${id}/approve`, data);
        return response.data;
    },

    // Admin: Reject an appointment
    rejectAppointment: async (id, reason) => {
        const response = await apiClient.put(`/appointments/${id}/reject`, { reason });
        return response.data;
    }
};

export default appointmentApi;
