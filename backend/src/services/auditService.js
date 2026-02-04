const AuditLog = require("../models/AuditLog");

const logAuditEvent = async ({
  userId,
  action,
  resource,
  method,
  outcome,
  reason
}) => {
  const auditEntry = {
    userId,
    action,
    resource,
    httpMethod: method,
    outcome,
    reason,
    timestamp: new Date()
  };

  try {
    await AuditLog.create(auditEntry);
    console.log("AUDIT LOG SAVED:", auditEntry);
  } catch (error) {
    console.error("FAILED TO SAVE AUDIT LOG:", error);
  }
};

module.exports = {
  logAuditEvent
};
