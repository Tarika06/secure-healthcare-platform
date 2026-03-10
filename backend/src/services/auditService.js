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
    action: "LOGIN_FAILED",
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

/**
 * Get Data Access Summary Report
 * Aggregates access events by role, action, and frequency.
 * Identifies unusual access patterns via threshold indicators.
 * 
 * User Story 9: Data Access Summary Report
 * HIPAA §164.312(b) — Audit Controls
 * GDPR Article 30 — Records of Processing Activities
 */
const getAccessSummaryReport = async (timeRangeHours = 168) => {
  const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000);

  // 1. Access counts by role
  const accessByRole = await AuditLog.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: {
          $switch: {
            branches: [
              { case: { $regexMatch: { input: "$userId", regex: /^A/i } }, then: "ADMIN" },
              { case: { $regexMatch: { input: "$userId", regex: /^D/i } }, then: "DOCTOR" },
              { case: { $regexMatch: { input: "$userId", regex: /^N/i } }, then: "NURSE" },
              { case: { $regexMatch: { input: "$userId", regex: /^L/i } }, then: "LAB_TECH" },
              { case: { $regexMatch: { input: "$userId", regex: /^P/i } }, then: "PATIENT" }
            ],
            default: "SYSTEM"
          }
        },
        totalAccess: { $sum: 1 },
        successCount: { $sum: { $cond: [{ $eq: ["$outcome", "SUCCESS"] }, 1, 0] } },
        deniedCount: { $sum: { $cond: [{ $eq: ["$outcome", "DENIED"] }, 1, 0] } },
        failureCount: { $sum: { $cond: [{ $eq: ["$outcome", "FAILURE"] }, 1, 0] } }
      }
    },
    { $sort: { totalAccess: -1 } }
  ]);

  // 2. Access counts by action type
  const accessByAction = await AuditLog.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: "$action",
        count: { $sum: 1 },
        successCount: { $sum: { $cond: [{ $eq: ["$outcome", "SUCCESS"] }, 1, 0] } },
        deniedCount: { $sum: { $cond: [{ $eq: ["$outcome", "DENIED"] }, 1, 0] } }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 15 }
  ]);

  // 3. Top active users
  const topActiveUsers = await AuditLog.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: "$userId",
        accessCount: { $sum: 1 },
        lastAccess: { $max: "$timestamp" },
        deniedCount: { $sum: { $cond: [{ $eq: ["$outcome", "DENIED"] }, 1, 0] } },
        actions: { $addToSet: "$action" }
      }
    },
    { $sort: { accessCount: -1 } },
    { $limit: 10 }
  ]);

  // 4. Hourly access frequency
  const hourlyFrequency = await AuditLog.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          hour: { $hour: "$timestamp" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.date": -1, "_id.hour": -1 } },
    { $limit: 168 }
  ]);

  // 5. Denied access events
  const deniedAccess = await AuditLog.aggregate([
    { $match: { timestamp: { $gte: since }, outcome: { $in: ["DENIED", "FAILURE"] } } },
    {
      $group: {
        _id: { userId: "$userId", action: "$action" },
        count: { $sum: 1 },
        lastOccurrence: { $max: "$timestamp" },
        reasons: { $addToSet: "$reason" }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // 6. Total counts
  const totalEvents = await AuditLog.countDocuments({ timestamp: { $gte: since } });
  const totalDenied = await AuditLog.countDocuments({ timestamp: { $gte: since }, outcome: { $in: ["DENIED", "FAILURE"] } });

  // 7. Threshold indicators
  const THRESHOLDS = {
    HIGH_ACCESS_PER_ROLE: 50,
    HIGH_DENIED_EVENTS: 10,
    HIGH_USER_FREQUENCY: 100,
    DENIED_RATIO_PERCENT: 20
  };

  const thresholdAlerts = [];

  accessByRole.forEach(role => {
    if (role.totalAccess > THRESHOLDS.HIGH_ACCESS_PER_ROLE) {
      thresholdAlerts.push({
        type: "HIGH_ROLE_ACTIVITY",
        severity: "MEDIUM",
        role: role._id,
        count: role.totalAccess,
        threshold: THRESHOLDS.HIGH_ACCESS_PER_ROLE,
        message: `Role ${role._id} has ${role.totalAccess} access events (threshold: ${THRESHOLDS.HIGH_ACCESS_PER_ROLE})`
      });
    }
    const deniedRatio = role.totalAccess > 0 ? (role.deniedCount / role.totalAccess) * 100 : 0;
    if (deniedRatio > THRESHOLDS.DENIED_RATIO_PERCENT && role.deniedCount > 3) {
      thresholdAlerts.push({
        type: "HIGH_DENIED_RATIO",
        severity: "HIGH",
        role: role._id,
        deniedRatio: deniedRatio.toFixed(1),
        deniedCount: role.deniedCount,
        message: `Role ${role._id} has ${deniedRatio.toFixed(1)}% denied access rate (${role.deniedCount} events)`
      });
    }
  });

  topActiveUsers.forEach(u => {
    if (u.accessCount > THRESHOLDS.HIGH_USER_FREQUENCY) {
      thresholdAlerts.push({
        type: "HIGH_USER_ACTIVITY",
        severity: "MEDIUM",
        userId: u._id,
        count: u.accessCount,
        threshold: THRESHOLDS.HIGH_USER_FREQUENCY,
        message: `User ${u._id} has ${u.accessCount} access events (threshold: ${THRESHOLDS.HIGH_USER_FREQUENCY})`
      });
    }
    if (u.deniedCount > THRESHOLDS.HIGH_DENIED_EVENTS) {
      thresholdAlerts.push({
        type: "HIGH_USER_DENIED",
        severity: "HIGH",
        userId: u._id,
        deniedCount: u.deniedCount,
        threshold: THRESHOLDS.HIGH_DENIED_EVENTS,
        message: `User ${u._id} has ${u.deniedCount} denied access events (threshold: ${THRESHOLDS.HIGH_DENIED_EVENTS})`
      });
    }
  });

  return {
    timeRange: { hours: timeRangeHours, since: since.toISOString(), until: new Date().toISOString() },
    totals: { totalEvents, totalDenied, deniedPercentage: totalEvents > 0 ? ((totalDenied / totalEvents) * 100).toFixed(1) : "0.0" },
    accessByRole,
    accessByAction,
    topActiveUsers,
    hourlyFrequency,
    deniedAccess,
    thresholdAlerts,
    thresholds: THRESHOLDS
  };
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
  getPatientAccessHistory,
  getAccessSummaryReport
};

