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
 * Right to Erasure: Anonymizes or deletes personal data.
 */
router.post("/erasure", authenticate, authorizeByUserId(["P"]), async (req, res) => {
    try {
        const patientId = req.user.userId;

        const result = await gdprService.performErasureRequest(patientId);

        await logAuditEvent({
            userId: patientId,
            action: "GDPR_RIGHT_TO_ERASURE",
            resource: "PROFILE_AND_CONSENTS",
            method: "POST",
            outcome: "SUCCESS",
            reason: "User requested right to erasure / anonymization"
        });

        res.json(result);
    } catch (error) {
        console.error("GDPR Erasure Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
