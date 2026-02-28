const mongoose = require("mongoose");

/**
 * DeletionRequest Model
 * 
 * Tracks account deletion requests through the multi-layer notification workflow.
 * Ensures MFA verification before deletion can proceed.
 * Maintains immutable audit trail for GDPR/HIPAA compliance.
 */
const DeletionRequestSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  userRole: { type: String, required: true },
  userEmail: { type: String, required: true },

  // Deletion workflow status
  status: {
    type: String,
    enum: [
      "PENDING_MFA",          // Awaiting MFA verification
      "MFA_VERIFIED",         // MFA verified, deletion scheduled
      "REMINDER_SENT",        // 24hr reminder sent
      "COMPLETED",            // Permanently deleted
      "CANCELLED"             // User cancelled (logged back in)
    ],
    default: "PENDING_MFA",
    index: true
  },

  // Dates
  requestedAt: { type: Date, default: Date.now },
  scheduledDeletionDate: { type: Date, required: true },  // 7 days from request
  mfaVerifiedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },

  // Notification tracking
  deletionNotificationSent: { type: Boolean, default: false },
  finalDeletionNotificationSent: { type: Boolean, default: false },
  lastReminderSentAt: { type: Date, default: null },
  deletionConfirmedWithMFA: { type: Boolean, default: false },

  // Notification history — tracks every notification sent
  notificationHistory: [{
    type: { type: String, enum: ["IN_APP", "EMAIL", "PUSH", "AUTHENTICATOR"] },
    stage: { type: String, enum: ["INITIAL", "MFA_CONFIRMATION", "REMINDER_24H", "FINAL_DELETION"] },
    sentAt: { type: Date, default: Date.now },
    message: { type: String },
    delivered: { type: Boolean, default: true }
  }],

  // Security tracking
  requestIpAddress: { type: String },
  requestUserAgent: { type: String },
  deviceFingerprint: { type: String },
  mfaMethod: { type: String, default: "TOTP" },  // TOTP via Google Authenticator

  // Account lock status
  accountLocked: { type: Boolean, default: false },
  lockedAt: { type: Date, default: null },

  // Cancellation details
  cancellationReason: { type: String },
  cancelledByLogin: { type: Boolean, default: false }
}, { timestamps: true });

// Index for cron job queries
DeletionRequestSchema.index({ status: 1, scheduledDeletionDate: 1 });
DeletionRequestSchema.index({ status: 1, lastReminderSentAt: 1 });

module.exports = mongoose.model("DeletionRequest", DeletionRequestSchema);
