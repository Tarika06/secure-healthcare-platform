const mongoose = require("mongoose");

/**
 * Prescription Schema
 * 
 * Digital prescriptions generated during teleconsultation sessions.
 * - Linked to a ConsultationSession
 * - Diagnosis and notes are encrypted (AES-256)
 * - Medications stored as structured array
 * - PDF generation supported via PDFKit
 */
const PrescriptionSchema = new mongoose.Schema({
  prescriptionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  sessionId: {
    type: String,
    required: true,
    ref: "ConsultationSession",
    index: true
  },

  patientId: {
    type: String,
    required: true,
    ref: "User"
  },

  doctorId: {
    type: String,
    required: true,
    ref: "User"
  },

  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String, default: "" }
  }],

  // Encrypted fields (AES-256)
  diagnosis: {
    type: String,
    required: true
  },

  additionalNotes: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Prescription", PrescriptionSchema);
