/**
 * Audit Service
 * 
 * HIPAA/GDPR Compliance: Centralized audit logging service
 * - Persists all audit events to MongoDB
 * - Provides immutable, append-only logging
 * - Supports querying for compliance reporting
 * - Fail-safe: logs to console if DB write fails
 */

const LoggerService = require("./LoggerService");
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
  outcome = "SUCCESS",
  reason,
  details = {},
  ipAddress,
  userAgent,
  targetUserId,
  complianceCategory = "INTERNAL"
}) => {
  try {
    const auditEntry = {
      userId: userId || "ANONYMOUS",
      action,
      resource,
      httpMethod: method,
      outcome,
      reason,
      details,
      ipAddress,
      userAgent,
      targetUserId,
      complianceCategory,
      // timestamp and hash handled by LoggerService
    };

    // Persist to database via Immutable Logger
    await LoggerService.log(auditEntry);

    // Log to console in dev mode
    if (process.env.NODE_ENV !== "production") {
      console.log("AUDIT:", {
        timestamp: new Date().toISOString(),
        userId: auditEntry.userId,
        action: auditEntry.action,
        outcome: auditEntry.outcome,
        complianceCategory: auditEntry.complianceCategory
      });
    }
  } catch (error) {
    // FAIL-SAFE: Log to console - NEVER fail silently for audit logs
    console.error("AUDIT LOG DB ERROR:", error.message);
    console.error("FAILED AUDIT ENTRY:", {
      userId,
      action,
      resource,
      outcome,
      complianceCategory,
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
    userAgent,
    complianceCategory: "SECURITY"
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
    userAgent,
    complianceCategory: "SECURITY"
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
    outcome: "SUCCESS",
    complianceCategory: "SECURITY"
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
    reason,
    complianceCategory: "SECURITY"
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
    details: { previousRole, newRole, reason }
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
    outcome,
    complianceCategory: "HIPAA"
  });
};

/**
 * Log data access for GDPR compliance
 */
const logDataAccess = async (userId, patientId, accessType, details = {}) => {
  await logAuditEvent({
    userId,
    action: "DATA_ACCESS",
    resource: `/api/patient/${patientId}`,
    method: "GET",
    outcome: "SUCCESS",
    targetUserId: patientId,
    details: { accessType, ...details },
    complianceCategory: "GDPR"
  });
};

/**
 * Log consent actions
 */
const logConsentAction = async (userId, patientId, action, details = {}) => {
  await logAuditEvent({
    userId,
    action,
    resource: `/api/consent`,
    method: "POST",
    outcome: "SUCCESS",
    targetUserId: patientId,
    details,
    complianceCategory: "GDPR"
  });
};

/**
 * Query audit logs (admin only)
 */
const queryAuditLogs = async (filters = {}, options = {}) => {
  const { limit = 100, skip = 0, sort = { timestamp: -1 } } = options;
  return AuditLog.find(filters).sort(sort).skip(skip).limit(limit).lean();
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

/**
 * Get patient data access history (for GDPR Right to Access)
 */
const getPatientAccessHistory = async (patientId, options = {}) => {
  return queryAuditLogs(
    { targetUserId: patientId, action: { $in: ["VIEW_EHR", "DATA_ACCESS", "RECORD_VIEWED"] } },
    options
  );
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
  logDataAccess,
  logConsentAction,
  queryAuditLogs,
  getUserAuditLogs,
  getLoginHistory,
  getAccessDeniedEvents,
  getPatientAccessHistory
};
