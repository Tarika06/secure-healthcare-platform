const express = require("express");
const router = express.Router();
const appointmentService = require("../services/appointmentService");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const auditService = require("../services/auditService");

// All routes require authentication
router.use(authenticate);

// ─── Request Appointment ────────────────────────────────────────────────
// POST /api/appointments
// Role: PATIENT only
router.post(
  "/",
  authorize(["PATIENT"]),
  async (req, res) => {
    try {
      const { doctorId, date, timeSlot, reason } = req.body;

      if (!date || !reason) {
        return res.status(400).json({
          message: "Date and reason are required"
        });
      }

      const appointment = await appointmentService.requestAppointment(
        req.user.userId,
        { doctorId, date, timeSlot, reason },
        req.ip
      );

      res.status(201).json({
        message: "Appointment requested successfully and is pending admin approval",
        appointment: {
          appointmentId: appointment.appointmentId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
          reason: appointment.reason,
          status: appointment.status,
          createdAt: appointment.createdAt
        }
      });
    } catch (err) {
      console.error("Request appointment error:", err.message);
      const status = err.message.includes("not found") ? 404
        : err.message.includes("already confirmed") ? 409
          : err.message.includes("past") ? 400
            : 400; // Default to 400 for validation errors
      res.status(status).json({ message: err.message });
    }
  }
);

// ─── Get Available Time Slots ─────────────────────────────────────────────
// GET /api/appointments/slots/:doctorId/:date
// Role: PATIENT, NURSE, ADMIN
router.get(
  "/slots/:doctorId/:date",
  authorize(["PATIENT", "NURSE", "ADMIN"]),
  async (req, res) => {
    try {
      const { doctorId, date } = req.params;

      if (!doctorId || !date) {
        return res.status(400).json({ message: "doctorId and date are required" });
      }

      const availableSlots = await appointmentService.getAvailableSlots(doctorId, date);
      res.json({ availableSlots });
    } catch (err) {
      console.error("Get available slots error:", err.message);
      const status = err.message.includes("Doctor not found") ? 404 : 500;
      res.status(status).json({ message: err.message });
    }
  }
);

// ─── List Appointments ────────────────────────────────────────────────────
// GET /api/appointments
// Role: PATIENT (view own), DOCTOR (view own), ADMIN/NURSE (view all, sort/filter)
router.get("/", async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      date: req.query.date,
      patientId: req.query.patientId,
      doctorId: req.query.doctorId
    };

    const appointments = await appointmentService.listAppointments(req.user, filters);

    res.json({ appointments });
  } catch (err) {
    console.error("List appointments error:", err.message);
    res.status(403).json({ message: err.message }); // Assuming mostly auth/access errors
  }
});

// ─── Get Appointment Details ──────────────────────────────────────────────
// GET /api/appointments/:id
// Role: Participant (Patient/Doctor), NURSE, ADMIN
router.get("/:id", async (req, res) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id, req.user);
    res.json({ appointment });
  } catch (err) {
    console.error("Get appointment error:", err.message);
    const status = err.message === "Appointment not found" ? 404
      : err.message === "Access denied" ? 403 : 500;
    res.status(status).json({ message: err.message });
  }
});

// ─── Approve Appointment ───────────────────────────────────────────
// PUT /api/appointments/:id/approve
// Role: ADMIN only
router.put(
  "/:id/approve",
  authorize(["ADMIN"]),
  async (req, res) => {
    try {
      const { doctorId, date, timeSlot } = req.body;

      if (!doctorId || !date || !timeSlot) {
        return res.status(400).json({
          message: "All fields required for approval: doctorId, date, timeSlot"
        });
      }

      const appointment = await appointmentService.approveAppointment(
        req.params.id,
        { doctorId, date, timeSlot },
        req.user.userId,
        req.ip
      );

      res.json({ message: "Appointment approved", appointment });
    } catch (err) {
      console.error("Approve appointment error:", err.message);
      res.status(400).json({ message: err.message });
    }
  }
);

// ─── Reject Appointment ───────────────────────────────────────────
// PUT /api/appointments/:id/reject
// Role: ADMIN only
router.put(
  "/:id/reject",
  authorize(["ADMIN"]),
  async (req, res) => {
    try {
      const { reason } = req.body;

      const appointment = await appointmentService.rejectAppointment(
        req.params.id,
        reason,
        req.user.userId,
        req.ip
      );

      res.json({ message: "Appointment rejected", appointment });
    } catch (err) {
      console.error("Reject appointment error:", err.message);
      res.status(400).json({ message: err.message });
    }
  }
);

// ─── Verify Hospital Entry (QR Scan) ────────────────────────────────
// POST /api/appointments/verify-entry
// Role: NURSE, ADMIN only
router.post(
  "/verify-entry",
  authorize(["NURSE", "ADMIN"]),
  async (req, res) => {
    try {
      const { appointmentId, token } = req.body;

      if (!appointmentId || !token) {
        return res.status(400).json({ message: "appointmentId and token are required" });
      }

      const appointment = await appointmentService.verifyEntryByNurse(
        appointmentId,
        token,
        req.user.userId,
        req.ip
      );

      res.json({
        message: "Entry verified successfully",
        appointment: {
          appointmentId: appointment.appointmentId,
          status: appointment.status,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          date: appointment.date,
          timeSlot: appointment.timeSlot
        }
      });
    } catch (err) {
      console.error("Verify entry error:", err.message);
      const status = err.message.includes("Token") ? 401
        : err.message.includes("not found") ? 404
          : err.message.includes("status") ? 400
            : 400; // Catch all for date/logic errors
      res.status(status).json({ message: err.message });
    }
  }
);

// ─── Cancel Appointment ───────────────────────────────────────────────────
// PUT /api/appointments/:id/cancel
// Role: PATIENT (own), DOCTOR (own)
router.put(
  "/:id/cancel",
  authorize(["PATIENT", "DOCTOR", "ADMIN", "NURSE"]), // Ensure broad access first, filter in service
  async (req, res) => {
    try {
      // Admins/Nurses shouldn't cancel directly via this endpoint typically (or maybe they can),
      // we'll let the service layer handle exact rules.
      const appointment = await appointmentService.cancelAppointment(
        req.params.id,
        req.user,
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
      const status = err.message.includes("not found") || err.message.includes("denied") ? 404
        : err.message.includes("Cannot cancel") ? 400
          : 500;
      res.status(status).json({ message: err.message });
    }
  }
);


module.exports = router;
