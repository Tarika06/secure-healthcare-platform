/**
 * IP Blocking Middleware
 * 
 * Checks if the request's IP address is in the BlockedIP blacklist.
 * If blocked, returns a 403 Forbidden response.
 */

const BlockedIP = require("../models/BlockedIP");

const checkBlockedIP = async (req, res, next) => {
    try {
        const ip = req.ip || req.connection.remoteAddress;

        const isBlocked = await BlockedIP.findOne({ ipAddress: ip });

        if (isBlocked) {
            console.log(`[SECURITY] Blocked request from IP: ${ip}`);
            return res.status(403).json({
                message: "Access Denied. Your IP address has been blocked due to suspicious activity.",
                blockedAt: isBlocked.blockedAt,
                reason: isBlocked.reason
            });
        }

        next();
    } catch (error) {
        console.error("IP Check Error:", error);
        // Fail open: if check fails, allow access but log error (safe for availability)
        next();
    }
};

module.exports = checkBlockedIP;
