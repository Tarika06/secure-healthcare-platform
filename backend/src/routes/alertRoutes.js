const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");
const AuditLog = require("../models/AuditLog");
const BlockedIP = require("../models/BlockedIP");
const aiService = require("../services/aiService");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const auditService = require("../services/auditService");

// All alert routes require ADMIN role
router.use(authenticate);
router.use(authorize(["ADMIN"]));

/**
 * GET /api/alerts
 * Fetch all alerts
 */
router.get("/", async (req, res) => {
    try {
        const { status, severity, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status) query.status = status;
        if (severity) query.severity = severity;

        const alerts = await Alert.find(query)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Alert.countDocuments(query);

        res.json({
            alerts,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching alerts:", error);
        res.status(500).json({ message: "Error fetching alerts" });
    }
});

/**
 * POST /api/alerts/analyze
 * Manually trigger AI log analysis
 */
router.post("/analyze", async (req, res) => {
    try {
        // Fetch recent logs (last 24 hours or last 1000 logs)
        const logs = await AuditLog.find()
            .sort({ timestamp: -1 })
            .limit(500);

        if (logs.length === 0) {
            return res.json({ message: "No logs to analyze", alertsCreated: 0 });
        }

        const aiAlerts = await aiService.analyzeLogs(logs);

        const createdAlerts = [];
        for (const alertData of aiAlerts) {
            // Check if a similar open alert already exists to avoid duplication
            const existing = await Alert.findOne({
                type: alertData.type,
                description: alertData.description,
                status: "OPEN"
            });

            if (!existing) {
                const newAlert = new Alert({
                    ...alertData,
                    status: "OPEN"
                });
                await newAlert.save();
                createdAlerts.push(newAlert);
            }
        }

        await auditService.logAuditEvent({
            userId: req.user.userId,
            action: "AI_LOG_ANALYSIS_TRIGGERED",
            resource: "/api/alerts/analyze",
            method: "POST",
            outcome: "SUCCESS",
            details: { logsAnalyzed: logs.length, alertsFound: aiAlerts.length, alertsCreated: createdAlerts.length }
        });

        res.json({
            message: `Analysis complete. ${createdAlerts.length} new alerts created.`,
            alertsFound: aiAlerts.length,
            alertsCreated: createdAlerts.length,
            newAlerts: createdAlerts
        });
    } catch (error) {
        console.error("Analysis trigger error:", error);
        res.status(500).json({ message: "AI Analysis failed" });
    }
});

/**
 * PATCH /api/alerts/:id
 * Update alert status
 */
router.patch("/:id", async (req, res) => {
    try {
        const { status } = req.body;
        if (!["OPEN", "INVESTIGATING", "RESOLVED", "DISMISSED"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({ message: "Alert not found" });
        }

        await auditService.logAuditEvent({
            userId: req.user.userId,
            action: "ALERT_STATUS_UPDATE",
            resource: `/api/alerts/${req.params.id}`,
            method: "PATCH",
            outcome: "SUCCESS",
            details: { alertId: req.params.id, newStatus: status }
        });

        res.json(alert);
    } catch (error) {
        console.error("Alert update error:", error);
        res.status(500).json({ message: "Failed to update alert" });
    }
});

/**
 * POST /api/alerts/block-ip
 * Block a specific IP address
 */
router.post("/block-ip", async (req, res) => {
    try {
        const { ipAddress, reason, alertId } = req.body;
        if (!ipAddress) {
            return res.status(400).json({ message: "IP Address is required" });
        }

        // Check if already blocked
        const existing = await BlockedIP.findOne({ ipAddress });
        if (existing) {
            return res.status(400).json({ message: "IP Address is already blocked" });
        }

        const block = new BlockedIP({
            ipAddress,
            reason: reason || "Blocked due to suspicious activity detected by AI",
            blockedBy: req.user.userId
        });

        await block.save();

        // If an alertId was provided, automatically resolve the alert
        if (alertId) {
            await Alert.findByIdAndUpdate(alertId, { status: "RESOLVED" });
        }

        await auditService.logAuditEvent({
            userId: req.user.userId,
            action: "IP_BLOCKED",
            resource: `/api/alerts/block-ip`,
            method: "POST",
            outcome: "SUCCESS",
            details: { ipAddress, reason }
        });

        res.json({ message: `IP Address ${ipAddress} has been successfully blocked.` });
    } catch (error) {
        console.error("IP Block error:", error);
        res.status(500).json({ message: "Failed to block IP" });
    }
});

module.exports = router;
