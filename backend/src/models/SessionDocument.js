const mongoose = require("mongoose");

/**
 * Session Document Schema
 * 
 * Supports secure file uploads during teleconsultations (F3).
 * - Stores patient lab reports, X-rays, etc.
 * - Files are linked to a specific session and patient.
 * - encryptedData stores the file securely at rest.
 */
const SessionDocumentSchema = new mongoose.Schema({
  documentId: {
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
    ref: "User",
    index: true
  },

  filename: {
    type: String,
    required: true
  },

  fileType: {
    type: String,
    required: true
  },

  // Base64 or Buffer storing the encrypted file data (AES-256)
  encryptedData: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("SessionDocument", SessionDocumentSchema);
