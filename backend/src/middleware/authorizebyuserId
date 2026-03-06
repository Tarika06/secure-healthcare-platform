const auditService = require("../services/auditService");

/**
 * Authorization middleware that checks if the user's role matches allowed prefixes.
 * Now uses the database role from req.user (set by authenticate middleware) 
 * instead of deriving role from userId prefix.
 */
module.exports = (allowedPrefixes) => {
  return (req, res, next) => {
    const user = req.user; // Full user object from authenticate middleware

    if (!user || !user.userId) {
      return res.status(403).json({ message: "Invalid user identity" });
    }

    // Map role to prefix for compatibility with existing route definitions
    const roleToPrefix = {
      "PATIENT": "P",
      "DOCTOR": "D",
      "NURSE": "N",
      "LAB_TECHNICIAN": "L",
      "ADMIN": "A"
    };

    const userPrefix = roleToPrefix[user.role];

    // Check if user's role (as prefix) is in the allowed list
    if (!userPrefix || !allowedPrefixes.includes(userPrefix)) {
      auditService.logAuditEvent({
        userId: user.userId,
        action: "ACCESS_API",
        resource: req.originalUrl,
        method: req.method,
        outcome: "DENIED",
        reason: "RBAC_DENIED"
      });

      return res.status(403).json({ message: "Access denied - Insufficient permissions" });
    }

    next();
  };
};
