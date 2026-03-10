const mongoose = require("mongoose");

/**
 * Consultation Session Schema
 * 
 * Supports emergency teleconsultation and scheduled video visits.
 * - Tracks session lifecycle (PENDING → ASSIGNED → IN_PROGRESS → COMPLETED)
 * - Stores encrypted symptoms and consultation notes (AES-256)
 * - Room IDs auto-expire after 1 hour for security
 * - Full audit trail via auditService integration
 */
const ConsultationSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  patientId: {
    type: String,
    required: true,
    ref: "User",
    index: true
  },

  doctorId: {
    type: String,
    default: null,
    ref: "User",
    index: true
  },

  type: {
    type: String,
    enum: ["EMERGENCY", "TELECONSULTATION"],
    default: "EMERGENCY"
  },

  status: {
    type: String,
    enum: ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "EXPIRED"],
    default: "PENDING",
    index: true
  },

  // Encrypted via encryptionService (AES-256)
  symptoms: {
    type: String,
    default: ""
  },

  specialtyNeeded: {
    type: String,
    default: ""
  },

  // Advanced Telemedicine: Smart Triage (F1)
  triage: {
    painLevel: { type: Number, min: 1, max: 10, default: null },
    duration: { type: String, default: "" },
    existingConditions: { type: String, default: "" },
    medications: { type: String, default: "" },
    allergies: { type: String, default: "" },
    vitals: {
      temperature: { type: String, default: "" },
      bloodPressure: { type: String, default: "" }
    },
    severity: {
      type: String,
      enum: ["LOW", "MODERATE", "HIGH", "CRITICAL", "UNKNOWN"],
      default: "UNKNOWN"
    }
  },

  // Emergency Escalation (F8)
  escalated: {
    type: Boolean,
    default: false
  },

  // Secure video room
  roomId: {
    type: String,
    required: true,
    unique: true
  },

  roomExpiry: {
    type: Date,
    default: () => new Date(Date.now() + 60 * 60 * 1000) // 1 hour from creation
  },

  // Session timing
  startTime: {
    type: Date,
    default: null
  },

  endTime: {
    type: Date,
    default: null
  },

  duration: {
    type: Number, // seconds
    default: 0
  },

  // Doctor's consultation notes (encrypted)
  notes: {
    type: String,
    default: ""
  },

  // AI Generated Summary (encrypted) (F6)
  aiSummary: {
    type: String,
    default: ""
  },

  // Follow-up Recommendations (F7)
  followUp: {
    date: { type: Date, default: null },
    labTests: [{ type: String }]
  },

  // Consultation Timeline (F10)
  timeline: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes for common queries
ConsultationSessionSchema.index({ status: 1, type: 1 });
ConsultationSessionSchema.index({ patientId: 1, status: 1 });
ConsultationSessionSchema.index({ doctorId: 1, status: 1 });

module.exports = mongoose.model("ConsultationSession", ConsultationSessionSchema);
