/**
 * Authorization Middleware
 * 
 * RBAC middleware that checks if the user's role is allowed to access a route.
 * Follows deny-by-default principle - access is denied unless explicitly granted.
 * 
 * All authorization decisions are logged for compliance.
 */

const auditService = require("../services/auditService");

module.exports = (allowedRoles) => {
  return async (req, res, next) => {
    // Deny by default if no user
    if (!req.user) {
      await auditService.logAccessDenied(
        "UNKNOWN",
        req.originalUrl,
        req.method,
        "NO_USER_CONTEXT"
      );
      return res.status(403).json({ message: "Access denied" });
    }

    const userRole = req.user.role;
    
    // Check if user's role is in allowed list
    if (!allowedRoles.includes(userRole)) {
      await auditService.logAccessDenied(
        req.user.userId,
        req.originalUrl,
        req.method,
        `ROLE_NOT_ALLOWED: ${userRole} not in [${allowedRoles.join(", ")}]`
      );
      return res.status(403).json({ message: "Access denied - Insufficient permissions" });
    }

    // Access granted - log it
    await auditService.logAccessGranted(
      req.user.userId,
      req.originalUrl,
      req.method
    );
    
    next();
  };
};
