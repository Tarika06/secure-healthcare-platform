const logAuditEvent = ({
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

  // For now: log to console
  console.log("AUDIT LOG:", auditEntry);

  // Later:
  // AuditLog.create(auditEntry);
};

module.exports = {
  logAuditEvent
};
