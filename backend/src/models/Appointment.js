const mongoose = require("mongoose");

/**
 * Appointment Schema
 * 
 * Supports the Smart Appointment & Hospital Entry Verification feature.
 * - Stores booking details (patient, doctor, date, time slot, reason)
 * - Holds the purpose-scoped QR JWT token (single-use, expires end-of-day)
 * - Tracks appointment status and entry verification state
 * - Compound index on (doctorId, date, timeSlot) prevents double-booking
 */
const AppointmentSchema = new mongoose.Schema({
  // Unique appointment identifier (e.g., APT-1708012345678-a1b2)
  appointmentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Patient who booked
  patientId: {
    type: String,
    required: true,
    ref: "User",
    index: true
  },

  // Doctor assigned (optional during request phase)
  doctorId: {
    type: String,
    ref: "User",
    index: true
  },

  // Appointment scheduling
  date: {
    type: String,       // ISO date string: "YYYY-MM-DD"
    required: true
  },
  timeSlot: {
    type: String       // e.g., "09:00", "09:30", "10:00" (optional during request)
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },

  // Appointment lifecycle status
  status: {
    type: String,
    enum: ["PENDING_ADMIN_APPROVAL", "CONFIRMED", "REJECTED", "BOOKED", "VERIFIED", "CANCELLED", "NO_SHOW", "COMPLETED"],
    default: "PENDING_ADMIN_APPROVAL",
    index: true
  },

  // Reason for rejection if denied by Admin
  rejectionReason: {
    type: String,
    default: null
  },

  // QR code data (base64 data URL)
  qrCode: {
    type: String
  },

  // Purpose-scoped JWT embedded in QR — single-use for hospital entry
  qrToken: {
    type: String
  },

  // Entry verification tracking
  entryVerifiedAt: {
    type: Date,
    default: null
  },
  entryVerifiedBy: {
    type: String,       // Nurse/Admin userId who scanned the QR
    default: null
  }
}, {
  timestamps: true      // adds createdAt, updatedAt
});

// Prevent double-booking: one doctor, one date, one time slot (only for confirmed)
AppointmentSchema.index(
  { doctorId: 1, date: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { status: "CONFIRMED" } }
);

module.exports = mongoose.model("Appointment", AppointmentSchema);
