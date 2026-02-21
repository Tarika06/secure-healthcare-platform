const express = require("express");
const router = express.Router();
const Consent = require("../models/Consent");
const User = require("../models/User");
const authenticate = require("../middleware/authenticate");
const authorizeByUserId = require("../middleware/authorizeByUserId");
const auditService = require("../services/auditService");

// Doctor requests consent from patient
router.post(
    "/request",
    authenticate,
    authorizeByUserId(["D"]),
    async (req, res) => {
        try {
            const { patientId, purpose } = req.body;
            const doctorId = req.user.userId;

            // Verify patient exists
            const patient = await User.findOne({ userId: patientId, role: "PATIENT" });
            if (!patient) {
                return res.status(404).json({ message: "Patient not found" });
            }

            // Check if consent already exists for THIS purpose
            const existingConsent = await Consent.findOne({
                patientId,
                doctorId,
                purpose: purpose || "GENERAL",
                status: { $in: ["PENDING", "ACTIVE"] }
            });

            if (existingConsent) {
                return res.status(400).json({
                    message: existingConsent.status === "ACTIVE"
                        ? `Consent for ${purpose || "GENERAL"} already granted`
                        : `Consent request for ${purpose || "GENERAL"} already pending`
                });
            }

            // Create new consent request
            const consent = new Consent({
                patientId,
                doctorId,
                purpose: purpose || "GENERAL",
                status: "PENDING"
            });

            await consent.save();

            await auditService.logConsentAction(doctorId, patientId, "CONSENT_REQUESTED", {
                consentId: consent._id
            });

            res.status(201).json({
                message: "Consent request sent successfully",
                consent
            });
        } catch (error) {
            console.error("Error requesting consent:", error);
            res.status(500).json({ message: "Error requesting consent" });
        }
    }
);

// Patient grants consent
router.post(
    "/grant/:consentId",
    authenticate,
    authorizeByUserId(["P"]),
    async (req, res) => {
        try {
            const { consentId } = req.params;
            const patientId = req.user.userId;

            const consent = await Consent.findOne({
                _id: consentId,
                patientId,
                status: "PENDING"
            });

            if (!consent) {
                return res.status(404).json({ message: "Consent request not found" });
            }

            consent.status = "ACTIVE";
            consent.respondedAt = new Date();
            // Set expiration to 1 year from now (optional)
            consent.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

            await consent.save();

            await auditService.logConsentAction(patientId, consent.doctorId, "CONSENT_GRANTED", {
                consentId: consent._id
            });

            res.json({
                message: "Consent granted successfully",
                consent
            });
        } catch (error) {
            console.error("Error granting consent:", error);
            res.status(500).json({ message: "Error granting consent" });
        }
    }
);

// Patient denies consent
router.post(
    "/deny/:consentId",
    authenticate,
    authorizeByUserId(["P"]),
    async (req, res) => {
        try {
            const { consentId } = req.params;
            const patientId = req.user.userId;

            const consent = await Consent.findOne({
                _id: consentId,
                patientId,
                status: "PENDING"
            });

            if (!consent) {
                return res.status(404).json({ message: "Consent request not found" });
            }

            consent.status = "DENIED";
            consent.respondedAt = new Date();

            await consent.save();

            await auditService.logConsentAction(patientId, consent.doctorId, "CONSENT_DENIED", {
                consentId: consent._id
            });

            res.json({
                message: "Consent denied",
                consent
            });
        } catch (error) {
            console.error("Error denying consent:", error);
            res.status(500).json({ message: "Error denying consent" });
        }
    }
);

// Patient revokes consent
router.post(
    "/revoke/:consentId",
    authenticate,
    authorizeByUserId(["P"]),
    async (req, res) => {
        try {
            const { consentId } = req.params;
            const patientId = req.user.userId;

            const consent = await Consent.findOne({
                _id: consentId,
                patientId,
                status: "ACTIVE"
            });

            if (!consent) {
                return res.status(404).json({ message: "Active consent not found" });
            }

            consent.status = "REVOKED";
            consent.respondedAt = new Date();

            await consent.save();

            await auditService.logConsentAction(patientId, consent.doctorId, "CONSENT_REVOKED", {
                consentId: consent._id
            });

            res.json({
                message: "Consent revoked successfully",
                consent
            });
        } catch (error) {
            console.error("Error revoking consent:", error);
            res.status(500).json({ message: "Error revoking consent" });
        }
    }
);

// Get pending consent requests for patient
router.get(
    "/pending",
    authenticate,
    authorizeByUserId(["P"]),
    async (req, res) => {
        try {
            const patientId = req.user.userId;

            const pendingConsents = await Consent.find({
                patientId,
                status: "PENDING"
            }).sort({ requestedAt: -1 });

            // Populate doctor information
            const consentsWithDoctors = await Promise.all(
                pendingConsents.map(async (consent) => {
                    const doctor = await User.findOne({ userId: consent.doctorId })
                        .select("userId firstName lastName specialty");
                    return {
                        ...consent.toObject(),
                        doctor
                    };
                })
            );

            res.json({
                message: "Pending consents retrieved successfully",
                consents: consentsWithDoctors
            });
        } catch (error) {
            console.error("Error fetching pending consents:", error);
            res.status(500).json({ message: "Error fetching pending consents" });
        }
    }
);

// Get active consents for patient
router.get(
    "/active",
    authenticate,
    authorizeByUserId(["P"]),
    async (req, res) => {
        try {
            const patientId = req.user.userId;

            const activeConsents = await Consent.find({
                patientId,
                status: "ACTIVE"
            }).sort({ respondedAt: -1 });

            // Populate doctor information
            const consentsWithDoctors = await Promise.all(
                activeConsents.map(async (consent) => {
                    const doctor = await User.findOne({ userId: consent.doctorId })
                        .select("userId firstName lastName specialty");
                    return {
                        ...consent.toObject(),
                        doctor
                    };
                })
            );

            res.json({
                message: "Active consents retrieved successfully",
                consents: consentsWithDoctors
            });
        } catch (error) {
            console.error("Error fetching active consents:", error);
            res.status(500).json({ message: "Error fetching active consents" });
        }
    }
);

// Check if doctor has consent for specific patient
router.get(
    "/check/:patientId",
    authenticate,
    authorizeByUserId(["D"]),
    async (req, res) => {
        try {
            const { patientId } = req.params;
            const doctorId = req.user.userId;

            const consent = await Consent.findOne({
                patientId,
                doctorId,
                status: "ACTIVE"
            });

            if (consent && consent.expiresAt && new Date() > consent.expiresAt) {
                // Auto-revoke if expired
                consent.status = "REVOKED";
                await consent.save();

                await auditService.logConsentAction("SYSTEM", patientId, "CONSENT_AUTO_REVOKED", {
                    consentId: consent._id,
                    reason: "Expired"
                });

                return res.json({
                    hasConsent: false,
                    consent: null,
                    message: "Consent has expired"
                });
            }

            res.json({
                hasConsent: !!consent,
                consent: consent || null
            });
        } catch (error) {
            console.error("Error checking consent:", error);
            res.status(500).json({ message: "Error checking consent" });
        }
    }
);

// Check if doctor has a pending consent request for specific patient
router.get(
    "/pending-status/:patientId",
    authenticate,
    authorizeByUserId(["D"]),
    async (req, res) => {
        try {
            const { patientId } = req.params;
            const doctorId = req.user.userId;

            const consent = await Consent.findOne({
                patientId,
                doctorId,
                status: "PENDING"
            });

            res.json({
                pending: !!consent,
                consent: consent || null
            });
        } catch (error) {
            console.error("Error checking pending consent:", error);
            res.status(500).json({ message: "Error checking pending consent" });
        }
    }
);

module.exports = router;
