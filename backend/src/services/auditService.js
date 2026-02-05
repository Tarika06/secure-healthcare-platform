/**
 * Audit Service
 * 
 * HIPAA/GDPR Compliance: Centralized audit logging service
 * - Persists all audit events to MongoDB
 * - Provides immutable, append-only logging
 * - Supports querying for compliance reporting
 * 
 * All authentication, authorization, and data access events
 * must be logged through this service.
 */

const AuditLog = require("../models/AuditLog");

/**
 * Log an audit event to the database
 * @param {Object} eventData - Audit event data
 */
const logAuditEvent = async ({
  userId,
  action,
  resource,
  method,
  outcome,
  reason,
  details,
  ipAddress,
  userAgent,
  targetUserId
}) => {
  try {
    const auditEntry = {
      userId: userId || "ANONYMOUS",
      action,
      resource,
      httpMethod: method,
      outcome,
      reason,
      details: details || {},
      ipAddress,
      userAgent,
      targetUserId
    };

    // Persist to database
    await AuditLog.log(auditEntry);
    
    // Also log to console for debugging (remove in production or use proper logger)
    if (process.env.NODE_ENV !== "production") {
      console.log("AUDIT:", {
        timestamp: new Date().toISOString(),
        ...auditEntry
      });
    }
  } catch (error) {
    // Log to console as fallback - NEVER fail silently for audit logs
    console.error("AUDIT LOG ERROR:", error);
    console.error("FAILED AUDIT ENTRY:", {
      userId,
      action,
      resource,
      outcome,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Log a successful login
 */
const logLoginSuccess = async (userId, ipAddress, userAgent) => {
  await logAuditEvent({
    userId,
    action: "LOGIN_SUCCESS",
    resource: "/api/auth/login",
    method: "POST",
    outcome: "SUCCESS",
    ipAddress,
    userAgent
  });
};

/**
 * Log a failed login attempt
 */
const logLoginFailure = async (userId, reason, ipAddress, userAgent) => {
  await logAuditEvent({
    userId: userId || "UNKNOWN",
    action: "LOGIN_FAILURE",
    resource: "/api/auth/login",
    method: "POST",
    outcome: "FAILURE",
    reason,
    ipAddress,
    userAgent
  });
};

/**
 * Log access granted
 */
const logAccessGranted = async (userId, resource, method) => {
  await logAuditEvent({
    userId,
    action: "ACCESS_GRANTED",
    resource,
    method,
    outcome: "SUCCESS"
  });
};

/**
 * Log access denied
 */
const logAccessDenied = async (userId, resource, method, reason) => {
  await logAuditEvent({
    userId,
    action: "ACCESS_DENIED",
    resource,
    method,
    outcome: "DENIED",
    reason
  });
};

/**
 * Log user account changes
 */
const logUserAccountChange = async (userId, targetUserId, action, details) => {
  await logAuditEvent({
    userId,
    action,
    resource: `/api/admin/users/${targetUserId}`,
    method: "PATCH",
    outcome: "SUCCESS",
    targetUserId,
    details
  });
};

/**
 * Log role changes
 */
const logRoleChange = async (userId, targetUserId, previousRole, newRole, reason) => {
  await logAuditEvent({
    userId,
    action: "ROLE_CHANGED",
    resource: `/api/admin/users/${targetUserId}/role`,
    method: "PATCH",
    outcome: "SUCCESS",
    targetUserId,
    details: {
      previousRole,
      newRole,
      reason
    }
  });
};

/**
 * Log record access
 */
const logRecordAccess = async (userId, recordId, action, outcome = "SUCCESS") => {
  await logAuditEvent({
    userId,
    action,
    resource: `/api/records/${recordId}`,
    method: "GET",
    outcome
  });
};

/**
 * Query audit logs (admin only)
 */
const queryAuditLogs = async (filters = {}, options = {}) => {
  return AuditLog.queryLogs(filters, options);
};

/**
 * Get audit logs for a specific user
 */
const getUserAuditLogs = async (userId, options = {}) => {
  return queryAuditLogs({ userId }, options);
};

/**
 * Get login history
 */
const getLoginHistory = async (options = {}) => {
  return queryAuditLogs(
    { action: { $in: ["LOGIN_SUCCESS", "LOGIN_FAILURE"] } },
    options
  );
};

/**
 * Get access denied events
 */
const getAccessDeniedEvents = async (options = {}) => {
  return queryAuditLogs({ outcome: "DENIED" }, options);
};

module.exports = {
  logAuditEvent,
  logLoginSuccess,
  logLoginFailure,
  logAccessGranted,
  logAccessDenied,
  logUserAccountChange,
  logRoleChange,
  logRecordAccess,
  queryAuditLogs,
  getUserAuditLogs,
  getLoginHistory,
  getAccessDeniedEvents
};
