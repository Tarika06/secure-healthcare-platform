const auditService = require("../services/auditService");

const auditLogger = (outcome, reason) => {
  return (req, res, next) => {
    try {
      console.log("AuditLogger triggered for:", req.originalUrl);
      auditService.logAuditEvent({
        userId: req.user?.userId || "UNKNOWN",
        action: "ACCESS_API",
        resource: req.originalUrl,
        method: req.method,
        outcome,
        reason
      });
    } catch (err) {
      console.error("AuditLogger Error:", err.message);
    }
    console.log("AuditLogger calling next()");
    next();
  };
};

module.exports = auditLogger;
