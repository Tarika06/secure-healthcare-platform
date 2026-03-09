/**
 * Deletion Routes
 * 
 * API endpoints for the multi-layer delayed account deletion workflow.
 * All routes require authentication.
 * 
 * Endpoints:
 * POST /api/deletion/initiate         - Start deletion (requires MFA enabled)
 * POST /api/deletion/verify-mfa       - Verify MFA to confirm deletion
 * POST /api/deletion/cancel           - Cancel pending deletion
 * GET  /api/deletion/status           - Get deletion status for current user
 * GET  /api/deletion/notifications    - Get in-app notifications
 * GET  /api/deletion/auth-notifications - Get authenticator notifications
 * POST /api/deletion/notifications/:id/read  - Mark notification as read
 * GET  /api/deletion/admin/pending    - Admin: view all pending deletions
 * GET  /api/deletion/admin/history    - Admin: view deletion history
 */

const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const deletionService = require("../services/deletionService");
const notificationService = require("../services/notificationService");
const { logAuditEvent } = require("../services/auditService");

// All deletion routes require authentication
router.use(authenticate);

// ═══════════════════════════════════════════════════════
// USER ENDPOINTS
// ═══════════════════════════════════════════════════════

/**
 * POST /api/deletion/initiate
 * Initiate account deletion request.
 * User MUST have MFA enabled before this can proceed.
 */
router.post("/initiate", async (req, res) => {
    try {
        const userId = req.user.userId;
        const securityInfo = {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"],
            deviceFingerprint: req.body.deviceFingerprint || "unknown"
        };

        const result = await deletionService.initiateDeletionRequest(userId, securityInfo);
        res.json(result);
    } catch (error) {
        console.error("Deletion initiation error:", error);

        if (error.message.startsWith("MFA_REQUIRED")) {
            return res.status(400).json({
                error: error.message,
                code: "MFA_REQUIRED",
                setupUrl: "/mfa-setup"
            });
        }

        if (error.message.startsWith("EXISTING_REQUEST")) {
            return res.status(409).json({
                error: error.message,
                code: "EXISTING_REQUEST"
            });
        }

        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/deletion/verify-mfa
 * Verify MFA code to confirm the deletion request.
 * This is the critical step — without valid TOTP code, deletion won't proceed.
 */
router.post("/verify-mfa", async (req, res) => {
    try {
        const userId = req.user.userId;
        const { mfaCode } = req.body;

        if (!mfaCode) {
            return res.status(400).json({
                error: "MFA code is required",
                code: "MFA_CODE_MISSING"
            });
        }

        const securityInfo = {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"],
            deviceFingerprint: req.body.deviceFingerprint || "unknown"
        };

        const result = await deletionService.verifyMFAForDeletion(userId, mfaCode, securityInfo);
        res.json(result);
    } catch (error) {
        console.error("MFA verification for deletion error:", error);

        if (error.message.includes("Invalid MFA")) {
            return res.status(401).json({
                error: error.message,
                code: "INVALID_MFA"
            });
        }

        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/deletion/cancel
 * Cancel a pending deletion request.
 */
router.post("/cancel", async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await deletionService.cancelDeletionRequest(userId);

        res.json(result);
    } catch (error) {
        console.error("Deletion cancellation error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/deletion/status
 * Get the current deletion status for the logged-in user.
 */
router.get("/status", async (req, res) => {
    try {
        const userId = req.user.userId;
        const status = await deletionService.getDeletionStatus(userId);
        res.json(status);
    } catch (error) {
        console.error("Deletion status error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/deletion/notifications
 * Get in-app notifications for the current user.
 */
router.get("/notifications", async (req, res) => {
    try {
        const userId = req.user.userId;
        const notifications = notificationService.getInAppNotifications(userId);
        res.json({ notifications });
    } catch (error) {
        console.error("Notifications error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/deletion/auth-notifications
 * Get authenticator-linked notifications for the current user.
 */
router.get("/auth-notifications", async (req, res) => {
    try {
        const userId = req.user.userId;
        const notifications = notificationService.getAuthenticatorNotifications(userId);
        res.json({ notifications });
    } catch (error) {
        console.error("Auth notifications error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/deletion/auth-notifications/:id/acknowledge
 * Acknowledge an authenticator notification.
 */
router.post("/auth-notifications/:id/acknowledge", async (req, res) => {
    try {
        const userId = req.user.userId;
        const notifId = req.params.id;
        const notif = notificationService.acknowledgeAuthenticatorNotification(userId, notifId);

        if (!notif) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.json({ success: true, notification: notif });
    } catch (error) {
        console.error("Acknowledge error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/deletion/notifications/:id/read
 * Mark an in-app notification as read.
 */
router.post("/notifications/:id/read", async (req, res) => {
    try {
        const userId = req.user.userId;
        const notifId = req.params.id;
        const notif = notificationService.markNotificationRead(userId, notifId);

        if (!notif) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.json({ success: true, notification: notif });
    } catch (error) {
        console.error("Mark read error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ═══════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════

/**
 * GET /api/deletion/admin/pending
 * Admin: View all pending deletion requests.
 */
router.get("/admin/pending", authorize(["ADMIN"]), async (req, res) => {
    try {
        const pendingDeletions = await deletionService.getPendingDeletions();

        await logAuditEvent({
            userId: req.user.userId,
            action: "ADMIN_VIEW_PENDING_DELETIONS",
            resource: "/api/deletion/admin/pending",
            method: "GET",
            outcome: "SUCCESS",
            details: { count: pendingDeletions.length },
            complianceCategory: "SECURITY"
        });

        res.json({ pendingDeletions });
    } catch (error) {
        console.error("Admin pending deletions error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/deletion/admin/history
 * Admin: View deletion history (completed + cancelled).
 */
router.get("/admin/history", authorize(["ADMIN"]), async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const history = await deletionService.getDeletionHistory(parseInt(limit));

        res.json({ history });
    } catch (error) {
        console.error("Admin deletion history error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
