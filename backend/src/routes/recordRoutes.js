/**
 * Medical Records Routes
 * 
 * HIPAA/GDPR Compliance:
 * - Records are encrypted at rest
 * - Decryption only for authorized users:
 *   1. Patient (owner) viewing their own records
 *   2. Doctor who created the record
 *   3. Doctor with active consent from patient
 * - All record access is audit logged
 */

const express = require("express");
const router = express.Router();
const MedicalRecord = require("../models/MedicalRecord");
const User = require("../models/User");
const Consent = require("../models/Consent");
const authenticate = require("../middleware/authenticate");
const authorizeByUserId = require("../middleware/authorizeByUserId");
const auditService = require("../services/auditService");
const { decryptRecord, encryptRecordFields } = require("../services/encryptionService");

/**
 * POST /api/records/create
 * Doctor creates a medical record for a patient (encrypted at rest)
 */
router.post(
    "/create",
    authenticate,
    authorizeByUserId(["D", "L"]),
    async (req, res) => {
        try {
            const { patientId, title, diagnosis, details, prescription, recordType } = req.body;
            const doctorId = req.user.userId;

            const patient = await User.findOne({ userId: patientId });
            if (!patient || !patientId.startsWith("P")) {
                return res.status(400).json({ message: "Invalid patient ID" });
            }

            // Encrypt sensitive fields before storage
            const encryptedData = encryptRecordFields({ diagnosis, details, prescription });

            const newRecord = new MedicalRecord({
                patientId,
                title,
                diagnosis: encryptedData.diagnosis,
                details: encryptedData.details,
                prescription: encryptedData.prescription,
                recordType: recordType || "GENERAL",
                createdBy: doctorId
            });

            await newRecord.save();

            await auditService.logAuditEvent({
                userId: doctorId,
                action: "RECORD_CREATED",
                resource: `/api/records/${newRecord._id}`,
                method: "POST",
                outcome: "SUCCESS",
                targetUserId: patientId,
                details: { recordType: newRecord.recordType, title }
            });

            // Return decrypted version to the creating doctor
            res.status(201).json({
                message: "Medical record created successfully",
                record: decryptRecord(newRecord.toObject())
            });
        } catch (error) {
            console.error("Error creating medical record:", error);
            res.status(500).json({ message: "Error creating medical record" });
        }
    }
);

/**
 * GET /api/records/my-records
 * Patient views their own medical records (DECRYPTED - they are the owner)
 */
router.get(
    "/my-records",
    authenticate,
    authorizeByUserId(["P"]),
    async (req, res) => {
        try {
            const patientId = req.user.userId;
            const records = await MedicalRecord.find({ patientId }).sort({ createdAt: -1 }).lean();

            // DECRYPT: Patient is the owner, full access to their own records
            const decryptedRecords = records.map(record => decryptRecord(record));

            await auditService.logAuditEvent({
                userId: patientId,
                action: "RECORD_VIEWED",
                resource: "/api/records/my-records",
                method: "GET",
                outcome: "SUCCESS",
                details: { recordCount: records.length }
            });

            res.json({
                message: "Records retrieved successfully",
                records: decryptedRecords
            });
        } catch (error) {
            console.error("Error fetching records:", error);
            res.status(500).json({ message: "Error fetching records" });
        }
    }
);

/**
 * GET /api/records/my-created-records
 * Doctor views records THEY CREATED (DECRYPTED - they are the author)
 */
router.get(
    "/my-created-records",
    authenticate,
    authorizeByUserId(["D", "L"]),
    async (req, res) => {
        try {
            const doctorId = req.user.userId;
            const records = await MedicalRecord.find({ createdBy: doctorId }).sort({ createdAt: -1 }).lean();

            // DECRYPT: Doctor created these records, they have access
            const decryptedRecords = records.map(record => decryptRecord(record));

            // Enrich with patient names
            const patientIds = [...new Set(records.map(r => r.patientId))];
            const patients = await User.find({ userId: { $in: patientIds } }).select("userId firstName lastName").lean();
            const patientMap = {};
            patients.forEach(p => { patientMap[p.userId] = `${p.firstName} ${p.lastName}`; });

            const enrichedRecords = decryptedRecords.map(r => ({
                ...r,
                patientName: patientMap[r.patientId] || "Unknown Patient"
            }));

            await auditService.logAuditEvent({
                userId: doctorId,
                action: "RECORD_VIEWED",
                resource: "/api/records/my-created-records",
                method: "GET",
                outcome: "SUCCESS",
                details: { recordCount: records.length, accessType: "SELF_CREATED" }
            });

            res.json({
                message: "Your created records retrieved successfully",
                records: enrichedRecords,
                totalCount: records.length
            });
        } catch (error) {
            console.error("Error fetching doctor's created records:", error);
            res.status(500).json({ message: "Error fetching records" });
        }
    }
);

/**
 * GET /api/records/patient/:patientId
 * Doctor views patient medical records
 * - Own records: DECRYPTED (doctor created them)
 * - Other records with consent: DECRYPTED
 * - Other records without consent: NOT VISIBLE
 */
router.get(
    "/patient/:patientId",
    authenticate,
    authorizeByUserId(["D"]),
    async (req, res) => {
        try {
            const { patientId } = req.params;
            const doctorId = req.user.userId;

            const patient = await User.findOne({ userId: patientId });
            if (!patient) {
                return res.status(404).json({ message: "Patient not found" });
            }

            const consent = await Consent.findOne({ patientId, doctorId, status: "ACTIVE" });
            const hasConsent = !!consent;

            const allRecords = await MedicalRecord.find({ patientId }).sort({ createdAt: -1 }).lean();

            const ownRecords = allRecords.filter(r => r.createdBy === doctorId);
            const otherRecords = allRecords.filter(r => r.createdBy !== doctorId);

            let accessibleRecords;
            let accessInfo;

            if (hasConsent) {
                const purposeMappings = {
                    TREATMENT: ["LAB_RESULT", "PRESCRIPTION", "DIAGNOSIS", "IMAGING", "VITALS", "GENERAL"],
                    DIAGNOSIS: ["DIAGNOSIS", "LAB_RESULT", "IMAGING", "GENERAL"],
                    PRESCRIPTION: ["PRESCRIPTION", "VITALS", "GENERAL"],
                    RESEARCH: ["LAB_RESULT", "DIAGNOSIS", "IMAGING"],
                    GENERAL: ["LAB_RESULT", "PRESCRIPTION", "DIAGNOSIS", "IMAGING", "VITALS", "GENERAL"]
                };

                const allowedTypes = purposeMappings[consent.purpose] || purposeMappings.GENERAL;

                // Filter records: Doctor sees own records OR records matching consent purpose
                accessibleRecords = allRecords
                    .filter(record => record.createdBy === doctorId || allowedTypes.includes(record.recordType))
                    .map(record => decryptRecord(record));

                const blockedCount = allRecords.length - accessibleRecords.length;

                accessInfo = {
                    consentStatus: "ACTIVE",
                    fullAccess: consent.purpose === "TREATMENT" || consent.purpose === "GENERAL",
                    purpose: consent.purpose,
                    message: `Access restricted to ${consent.purpose} related records.`,
                    hiddenRecordCount: blockedCount
                };
            } else {
                // Limited access: DECRYPT only own records
                accessibleRecords = ownRecords.map(record => decryptRecord(record));
                accessInfo = {
                    consentStatus: "NONE",
                    fullAccess: false,
                    message: "Showing only records you created. Request consent for full access.",
                    hiddenRecordCount: otherRecords.length
                };
            }

            await auditService.logAuditEvent({
                userId: doctorId,
                action: "RECORD_VIEWED",
                resource: `/api/records/patient/${patientId}`,
                method: "GET",
                outcome: "SUCCESS",
                targetUserId: patientId,
                details: {
                    hasConsent,
                    totalRecords: allRecords.length,
                    accessibleRecords: accessibleRecords.length,
                    accessType: hasConsent ? "FULL_CONSENT" : "OWN_RECORDS_ONLY"
                },
                complianceCategory: "HIPAA"
            });

            res.json({
                message: "Records retrieved successfully",
                records: accessibleRecords,
                accessInfo,
                patientInfo: {
                    userId: patient.userId,
                    name: `${patient.firstName} ${patient.lastName}`
                }
            });
        } catch (error) {
            console.error("Error fetching patient records:", error);
            res.status(500).json({ message: "Error fetching records" });
        }
    }
);

router.get(
    "/patients/list",
    authenticate,
    authorizeByUserId(["D", "N", "L"]),
    async (req, res) => {
        try {
            const patients = await User.find({
                $or: [
                    { role: "PATIENT" },
                    { userId: { $regex: /^P/i } }
                ]
            }).select("userId firstName lastName email");

            await auditService.logAuditEvent({
                userId: req.user.userId,
                action: "PATIENT_LIST_VIEWED",
                resource: "/api/records/patients/list",
                method: "GET",
                outcome: "SUCCESS",
                details: { patientCount: patients.length }
            });

            res.json({
                message: "Patients retrieved successfully",
                patients
            });
        } catch (error) {
            console.error("Error fetching patients:", error);
            res.status(500).json({ message: "Error fetching patients" });
        }
    }
);
/**
 * POST /api/records/:recordId/rectify
 * Patient requests rectification of a medical record (GDPR Article 16)
 */
router.post(
    "/:recordId/rectify",
    authenticate,
    authorizeByUserId(["P"]),
    async (req, res) => {
        try {
            const { recordId } = req.params;
            const { patientNote } = req.body;
            const patientId = req.user.userId;

            const record = await MedicalRecord.findOne({ _id: recordId, patientId });
            if (!record) {
                return res.status(404).json({ message: "Record not found" });
            }

            record.rectification = {
                status: "REQUESTED",
                patientNote,
                requestedAt: new Date()
            };

            await record.save();

            await auditService.logAuditEvent({
                userId: patientId,
                action: "RECTIFICATION_REQUESTED",
                resource: `/api/records/${recordId}/rectify`,
                method: "POST",
                outcome: "SUCCESS",
                details: { recordId }
            });

            res.json({ message: "Rectification request submitted successfully", record: decryptRecord(record.toObject()) });
        } catch (error) {
            console.error("Error requesting rectification:", error);
            res.status(500).json({ message: "Error submitting rectification request" });
        }
    }
);

/**
 * PUT /api/records/:recordId/rectify/resolve
 * Doctor resolves rectification request (FIXED or DECLINED)
 */
router.put(
    "/:recordId/rectify/resolve",
    authenticate,
    authorizeByUserId(["D"]),
    async (req, res) => {
        try {
            const { recordId } = req.params;
            const { status, doctorResponse, updatedData } = req.body;
            const doctorId = req.user.userId;

            const record = await MedicalRecord.findById(recordId);
            if (!record) {
                return res.status(404).json({ message: "Record not found" });
            }

            // Authorization: Only the creator of the record can resolve rectification
            if (record.createdBy !== doctorId) {
                return res.status(403).json({ message: "Not authorized to resolve rectification for this record" });
            }

            if (status === "FIXED" && updatedData) {
                const { diagnosis, details, prescription } = updatedData;
                const encryptedData = encryptRecordFields({ diagnosis, details, prescription });

                record.diagnosis = encryptedData.diagnosis;
                record.details = encryptedData.details;
                record.prescription = encryptedData.prescription;
            }

            record.rectification.status = status;
            record.rectification.doctorResponse = doctorResponse;
            record.rectification.resolvedAt = new Date();

            await record.save();

            await auditService.logAuditEvent({
                userId: doctorId,
                action: "RECTIFICATION_RESOLVED",
                resource: `/api/records/${recordId}/rectify/resolve`,
                method: "PUT",
                outcome: "SUCCESS",
                details: { recordId, status }
            });

            res.json({ message: `Rectification resolved with status: ${status}`, record: decryptRecord(record.toObject()) });
        } catch (error) {
            console.error("Error resolving rectification:", error);
            res.status(500).json({ message: "Error resolving rectification" });
        }
    }
);

/**
 * POST /api/records/emergency/:patientId
 * "Break-Glass" Emergency Access (HIPAA Security Rule)
 * Grants instant access but triggers a high-priority audit alert.
 */
router.post(
    "/emergency/:patientId",
    authenticate,
    authorizeByUserId(["D", "N"]),
    async (req, res) => {
        try {
            const { patientId } = req.params;
            const { justification } = req.body;
            const doctorId = req.user.userId;

            if (!justification || justification.length < 10) {
                return res.status(400).json({ message: "Mandatory clinical justification required (min 10 chars)" });
            }

            const patient = await User.findOne({ userId: patientId });
            if (!patient) {
                return res.status(404).json({ message: "Patient not found" });
            }

            const allRecords = await MedicalRecord.find({ patientId }).sort({ createdAt: -1 }).lean();
            const decryptedRecords = allRecords.map(record => decryptRecord(record));

            await auditService.logEmergencyAccess({
                userId: doctorId,
                patientId,
                justification,
                resource: `/api/records/emergency/${patientId}`
            });

            res.json({
                message: "EMERGENCY ACCESS GRANTED. This action has been logged for compliance review.",
                records: decryptedRecords,
                accessInfo: {
                    consentStatus: "EMERGENCY_OVERRIDE",
                    fullAccess: true,
                    message: "Emergency 'Break-Glass' access active. All records decrypted."
                }
            });
        } catch (error) {
            console.error("Emergency access error:", error);
            res.status(500).json({ message: "Error granting emergency access" });
        }
    }
);

module.exports = router;
