const mongoose = require("mongoose");
const { encrypt, decrypt } = require("../services/encryptionService");

const VideoConsultationLogSchema = new mongoose.Schema({
  // Session Information
  sessionId: { type: String, required: true, index: true },
  patientId: { type: String, required: true, index: true },
  doctorId: { type: String, index: true },
  consultationType: { type: String, enum: ["EMERGENCY", "SCHEDULED"], required: true },

  // Session Timing
  requestTimestamp: { type: Date, required: true },
  doctorAssignedTimestamp: { type: Date },
  callStartTimestamp: { type: Date },
  callEndTimestamp: { type: Date },
  totalCallDurationSeconds: { type: Number, default: 0 },
  waitingTimeSeconds: { type: Number, default: 0 },

  // Connection Information
  connectionEstablished: { type: Boolean, default: false },
  networkType: { type: String, enum: ["wifi", "cellular", "unknown", "ethernet", ""] },
  signalingServerId: { type: String },
  iceExchangeSuccess: { type: Boolean, default: false },

  // Call Quality Metrics
  averageLatencyMs: { type: Number, default: 0 },
  packetLossPercentage: { type: Number, default: 0 },
  averageBitrateKbps: { type: Number, default: 0 },
  connectionQualityRating: { type: String, enum: ["excellent", "good", "fair", "poor", "unknown"], default: "unknown" },

  // Media Details
  videoEnabled: { type: Boolean, default: false },
  audioEnabled: { type: Boolean, default: false },
  audioOnlyFallbackUsed: { type: Boolean, default: false },
  screenShareUsed: { type: Boolean, default: false },

  // Session Activity
  filesUploadedCount: { type: Number, default: 0 },
  prescriptionsGenerated: { type: Boolean, default: false },
  consultationNotesAdded: { type: Boolean, default: false },
  emergencyEscalationTriggered: { type: Boolean, default: false },

  // Security Metadata
  encryptionProtocol: { type: String, default: "DTLS-SRTP" },
  unauthorizedAccessAttempts: { type: Number, default: 0 },

  // System Events Timeline
  systemEvents: [{
    eventType: { type: String, required: true }, // e.g., PATIENT_JOINED, DOCTOR_JOINED, CONNECTION_DROPPED, RECONNECTED
    timestamp: { type: Date, default: Date.now },
    details: { type: mongoose.Schema.Types.Mixed }
  }],

  callTerminatedBy: { type: String, enum: ["DOCTOR", "PATIENT", "SYSTEM", "UNKNOWN"], default: "UNKNOWN" }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

// Setup indexes for Admin Dashboard query performance
VideoConsultationLogSchema.index({ sessionId: 1 });
VideoConsultationLogSchema.index({ doctorId: 1 });
VideoConsultationLogSchema.index({ patientId: 1 });
VideoConsultationLogSchema.index({ created_at: -1 });

module.exports = mongoose.model("VideoConsultationLog", VideoConsultationLogSchema);
