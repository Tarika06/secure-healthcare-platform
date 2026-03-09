const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorizeByUserId = require("../middleware/authorizeByUserId");
const gdprService = require("../services/gdprService");
const { logAuditEvent } = require("../services/auditService");

/**
 * GET /api/gdpr/access
 * Right to Access: Returns all personal data in JSON.
 */
router.get("/access", authenticate, authorizeByUserId(["P"]), async (req, res) => {
    try {
        const patientId = req.user.userId;
        const data = await gdprService.aggregatePatientData(patientId);

        await logAuditEvent({
            userId: patientId,
            action: "GDPR_RIGHT_TO_ACCESS",
            resource: "ALL_PERSONAL_DATA",
            method: "GET",
            outcome: "SUCCESS",
            reason: "User requested personal data export (JSON)"
        });

        res.json({
            message: "Personal data retrieved successfully",
            data
        });
    } catch (error) {
        console.error("GDPR Access Error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/gdpr/export-pdf
 * Right to Access: Returns all personal data as a PDF.
 */
router.get("/export-pdf", authenticate, authorizeByUserId(["P"]), async (req, res) => {
    try {
        const patientId = req.user.userId;
        const data = await gdprService.aggregatePatientData(patientId);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=data_export_${patientId}.pdf`);

        gdprService.generateDataExportPDF(data, res);

        await logAuditEvent({
            userId: patientId,
            action: "GDPR_RIGHT_TO_ACCESS_PDF",
            resource: "ALL_PERSONAL_DATA_PDF",
            method: "GET",
            outcome: "SUCCESS",
            reason: "User requested personal data export (PDF)"
        });

    } catch (error) {
        console.error("GDPR PDF Export Error:", error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/gdpr/erasure
 * Right to Erasure: Now redirects to the delayed deletion workflow.
 * Requires MFA to be enabled. Account deletion is delayed 7 days.
 */
router.post("/erasure", authenticate, authorizeByUserId(["P"]), async (req, res) => {
    try {
        const patientId = req.user.userId;
        const deletionService = require("../services/deletionService");

        const securityInfo = {
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"],
            deviceFingerprint: req.body.deviceFingerprint || "unknown"
        };

        const result = await deletionService.initiateDeletionRequest(patientId, securityInfo);

        await logAuditEvent({
            userId: patientId,
            action: "GDPR_RIGHT_TO_ERASURE_INITIATED",
            resource: "DELAYED_DELETION",
            method: "POST",
            outcome: "SUCCESS",
            reason: "User initiated delayed account deletion (7-day window)",
            details: {
                scheduledDeletionDate: result.scheduledDeletionDate,
                mfaRequired: true
            },
            complianceCategory: "GDPR"
        });

        res.json({
            ...result,
            message: "Deletion request initiated. MFA verification required to confirm. " +
                "Your account will be permanently deleted after 7 days if not cancelled."
        });
    } catch (error) {
        console.error("GDPR Erasure Error:", error);

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

module.exports = router;
