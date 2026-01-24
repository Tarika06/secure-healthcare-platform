const auditService = require("../services/auditService");

const auditLogger = (outcome, reason) => {
  return (req, res, next) => {
    auditService.logAuditEvent({
      userId: req.user?.userId || "UNKNOWN",
      action: "ACCESS_API",
      resource: req.originalUrl,
      method: req.method,
      outcome,
      reason
    });
    next();
  };
};

module.exports = auditLogger;
