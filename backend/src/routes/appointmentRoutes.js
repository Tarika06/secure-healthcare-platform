const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const appointmentService = require("../services/appointmentService");

/**
 * Appointment Routes
 * 
 * All routes require authentication (JWT).
 * RBAC is enforced via the authorize middleware.
 * 
 * POST   /                       → Book appointment (PATIENT)
 * GET    /                       → List own appointments (PATIENT, DOCTOR, ADMIN)
 * GET    /slots/:doctorId/:date  → Get available slots (PATIENT)
 * GET    /:id                    → Get appointment by ID (PATIENT, DOCTOR, ADMIN)
 * POST   /verify-entry           → Verify QR code at reception (NURSE, ADMIN)
 * PUT    /:id/cancel             → Cancel appointment (PATIENT)
 */

// All routes require authentication
router.use(authenticate);

// ─── Book Appointment ────────────────────────────────────────────────
// POST /api/appointments
// Role: PATIENT only
router.post(
  "/",
  authorize(["PATIENT"]),
  async (req, res) => {
    try {
      const { doctorId, date, timeSlot, reason } = req.body;

      if (!doctorId || !date || !timeSlot || !reason) {
        return res.status(400).json({
          message: "All fields required: doctorId, date, timeSlot, reason"
        });
      }

      // Date format validation (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          message: "Date must be in YYYY-MM-DD format"
        });
      }

      const appointment = await appointmentService.bookAppointment(
        req.user.userId,
        { doctorId, date, timeSlot, reason },
        req.ip
      );

      res.status(201).json({
        message: "Appointment booked successfully",
        appointment: {
          appointmentId: appointment.appointmentId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
          reason: appointment.reason,
          status: appointment.status,
          qrCode: appointment.qrCode,
          createdAt: appointment.createdAt
        }
      });
    } catch (err) {
      console.error("Book appointment error:", err.message);
      const status = err.message.includes("not found") ? 404
        : err.message.includes("already booked") ? 409
        : err.message.includes("past") ? 400
        : err.message.includes("Invalid time") ? 400
        : 500;
      res.status(status).json({ message: err.message });
    }
  }
);

// ─── Get Available Slots ─────────────────────────────────────────────
// GET /api/appointments/slots/:doctorId/:date
// Role: PATIENT (to see open slots before booking)
router.get(
  "/slots/:doctorId/:date",
  authorize(["PATIENT"]),
  async (req, res) => {
    try {
      const { doctorId, date } = req.params;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          message: "Date must be in YYYY-MM-DD format"
        });
      }

      const availableSlots = await appointmentService.getAvailableSlots(doctorId, date);

      res.json({
        doctorId,
        date,
        availableSlots,
        totalSlots: appointmentService.VALID_TIME_SLOTS.length,
        bookedSlots: appointmentService.VALID_TIME_SLOTS.length - availableSlots.length
      });
    } catch (err) {
      console.error("Get slots error:", err.message);
      const status = err.message.includes("not found") ? 404 : 500;
      res.status(status).json({ message: err.message });
    }
  }
);

// ─── List Appointments ───────────────────────────────────────────────
// GET /api/appointments
// Role: PATIENT (own), DOCTOR (own schedule), ADMIN (all)
// Query params: ?status=BOOKED&date=2026-03-01
router.get(
  "/",
  authorize(["PATIENT", "DOCTOR", "ADMIN"]),
  async (req, res) => {
    try {
      const { status, date } = req.query;
      const appointments = await appointmentService.listAppointments(
        req.user,
        { status, date }
      );

      res.json({ count: appointments.length, appointments });
    } catch (err) {
      console.error("List appointments error:", err.message);
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Get Appointment By ID ───────────────────────────────────────────
// GET /api/appointments/:id
// Role: PATIENT (own), DOCTOR (own), ADMIN (all)
router.get(
  "/:id",
  authorize(["PATIENT", "DOCTOR", "ADMIN"]),
  async (req, res) => {
    try {
      const appointment = await appointmentService.getAppointmentById(
        req.params.id,
        req.user
      );

      res.json({ appointment });
    } catch (err) {
      console.error("Get appointment error:", err.message);
      const status = err.message.includes("not found") ? 404
        : err.message.includes("Access denied") ? 403
        : 500;
      res.status(status).json({ message: err.message });
    }
  }
);

// ─── Verify Hospital Entry (QR Scan) ────────────────────────────────
// POST /api/appointments/verify-entry
// Role: NURSE, ADMIN only
// Body: { qrToken: "<JWT string from QR code>" }
router.post(
  "/verify-entry",
  authorize(["NURSE", "ADMIN"]),
  async (req, res) => {
    try {
      const { qrToken } = req.body;

      if (!qrToken) {
        return res.status(400).json({
          message: "qrToken is required — scan the patient's QR code"
        });
      }

      const result = await appointmentService.verifyEntry(
        qrToken,
        req.user,
        req.ip
      );

      res.json(result);
    } catch (err) {
      console.error("Verify entry error:", err.message);
      const status = err.message.includes("expired") ? 410
        : err.message.includes("already been used") ? 409
        : err.message.includes("not found") ? 404
        : err.message.includes("cancelled") ? 410
        : err.message.includes("not valid today") ? 403
        : err.message.includes("Invalid") ? 401
        : 500;
      res.status(status).json({ message: err.message });
    }
  }
);

// ─── Cancel Appointment ──────────────────────────────────────────────
// PUT /api/appointments/:id/cancel
// Role: PATIENT only (own appointments)
router.put(
  "/:id/cancel",
  authorize(["PATIENT"]),
  async (req, res) => {
    try {
      const appointment = await appointmentService.cancelAppointment(
        req.params.id,
        req.user.userId,
        req.ip
      );

      res.json({
        message: "Appointment cancelled successfully",
        appointment: {
          appointmentId: appointment.appointmentId,
          status: appointment.status
        }
      });
    } catch (err) {
      console.error("Cancel appointment error:", err.message);
      const status = err.message.includes("not found") ? 404
        : err.message.includes("Cannot cancel") ? 400
        : 500;
      res.status(status).json({ message: err.message });
    }
  }
);

module.exports = router;
