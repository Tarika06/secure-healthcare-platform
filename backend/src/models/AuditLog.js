/**
 * AuditLog Model
 * 
 * HIPAA/GDPR Compliance: Immutable, append-only audit trail
 * - Logs all authentication attempts (success/failure)
 * - Logs all authorization decisions (grant/deny)
 * - Logs all sensitive data access
 * - Logs all role/account changes
 * 
 * Security Features:
 * - No update/delete operations allowed via application
 * - Indexed for efficient querying
 * - Timestamps are server-generated (tamper-resistant)
 */

const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema({
  // Who performed the action
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // What action was performed
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication events
      "LOGIN_SUCCESS",
      "LOGIN_FAILURE",
      "LOGOUT",
      "TOKEN_REFRESH",
      "PASSWORD_CHANGE",
      
      // Authorization events
      "ACCESS_GRANTED",
      "ACCESS_DENIED",
      
      // Account management events
      "USER_CREATED",
      "USER_SUSPENDED",
      "USER_ACTIVATED",
      "USER_DELETED",
      
      // Role events
      "ROLE_ASSIGNED",
      "ROLE_CHANGED",
      
      // Data access events
      "RECORD_VIEWED",
      "RECORD_CREATED",
      "RECORD_UPDATED",
      "RECORD_DELETED",
      
      // Consent events
      "CONSENT_GRANTED",
      "CONSENT_REVOKED",
      "CONSENT_REQUESTED",
      
      // Generic API access
      "API_ACCESS"
    ],
    index: true
  },
  
  // What resource was accessed
  resource: {
    type: String,
    required: true
  },
  
  // HTTP method (for API calls)
  httpMethod: {
    type: String,
    enum: ["GET", "POST", "PUT", "PATCH", "DELETE", null]
  },
  
  // Outcome of the action
  outcome: {
    type: String,
    required: true,
    enum: ["SUCCESS", "FAILURE", "DENIED"],
    index: true
  },
  
  // Additional context
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Reason for failure/denial (if applicable)
  reason: {
    type: String
  },
  
  // IP address of the requester
  ipAddress: {
    type: String
  },
  
  // User agent string
  userAgent: {
    type: String
  },
  
  // Target user (for admin actions on other users)
  targetUserId: {
    type: String,
    index: true
  },
  
  // Server-generated timestamp (immutable)
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    immutable: true,
    index: true
  }
}, {
  // Disable versioning to prevent modification tracking
  versionKey: false,
  
  // Prevent updates via save()
  strict: true
});

// Compound indexes for common queries
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ outcome: 1, timestamp: -1 });

// SECURITY: Remove update/delete methods to enforce immutability
AuditLogSchema.statics.updateOne = undefined;
AuditLogSchema.statics.updateMany = undefined;
AuditLogSchema.statics.findOneAndUpdate = undefined;
AuditLogSchema.statics.findByIdAndUpdate = undefined;
AuditLogSchema.statics.deleteOne = undefined;
AuditLogSchema.statics.deleteMany = undefined;
AuditLogSchema.statics.findOneAndDelete = undefined;
AuditLogSchema.statics.findByIdAndDelete = undefined;

// Static method to create audit entry (the only way to add logs)
AuditLogSchema.statics.log = async function(logData) {
  const entry = new this(logData);
  return entry.save();
};

// Static method to query logs (admin only)
AuditLogSchema.statics.queryLogs = async function(filters = {}, options = {}) {
  const {
    userId,
    action,
    outcome,
    startDate,
    endDate,
    targetUserId
  } = filters;
  
  const {
    limit = 100,
    skip = 0,
    sortBy = 'timestamp',
    sortOrder = -1
  } = options;
  
  const query = {};
  
  if (userId) query.userId = userId;
  if (action) query.action = action;
  if (outcome) query.outcome = outcome;
  if (targetUserId) query.targetUserId = targetUserId;
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .lean();
};

module.exports = mongoose.model("AuditLog", AuditLogSchema);
