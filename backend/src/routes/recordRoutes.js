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
const { filterRecordsByPurpose, PURPOSE_LABELS } = require("../middleware/validatePurpose");

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
            const { patientId, title, diagnosis, details, prescription, recordType, purpose } = req.body;
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
                purpose: purpose || "TREATMENT",
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

            // Find ALL active consents for this doctor-patient pair (may have multiple purposes)
            const consents = await Consent.find({ patientId, doctorId, status: "ACTIVE" });
            const hasConsent = consents.length > 0;

            const allRecords = await MedicalRecord.find({ patientId }).sort({ createdAt: -1 }).lean();

            const ownRecords = allRecords.filter(r => r.createdBy === doctorId);

            let accessibleRecords;
            let accessInfo;

            if (hasConsent) {
                // PURPOSE-BASED FILTERING (GDPR Art. 5(1)(b))
                // Only show records whose purpose matches the consented purpose(s)
                const consentedPurposes = consents.map(c => c.purpose);
                const purposeFiltered = allRecords.filter(record => {
                    const recordPurpose = record.purpose || "TREATMENT";
                    return consentedPurposes.includes(recordPurpose);
                });
                const deniedByPurpose = allRecords.filter(record => {
                    const recordPurpose = record.purpose || "TREATMENT";
                    return !consentedPurposes.includes(recordPurpose);
                });

                accessibleRecords = purposeFiltered.map(record => decryptRecord(record));
                accessInfo = {
                    consentStatus: "ACTIVE",
                    fullAccess: deniedByPurpose.length === 0,
                    purposeFiltered: true,
                    consentedPurposes: consentedPurposes.map(p => ({ code: p, label: PURPOSE_LABELS[p] })),
                    message: deniedByPurpose.length === 0
                        ? `Full access granted for purpose(s): ${consentedPurposes.map(p => PURPOSE_LABELS[p]).join(", ")}`
                        : `Showing records for consented purpose(s): ${consentedPurposes.map(p => PURPOSE_LABELS[p]).join(", ")}`,
                    hiddenRecordCount: deniedByPurpose.length,
                    hiddenPurposes: [...new Set(deniedByPurpose.map(r => r.purpose || "TREATMENT"))]
                        .map(p => ({ code: p, label: PURPOSE_LABELS[p] }))
                };
            } else {
                // No consent: show only own records
                accessibleRecords = ownRecords.map(record => decryptRecord(record));
                accessInfo = {
                    consentStatus: "NONE",
                    fullAccess: false,
                    purposeFiltered: false,
                    message: "Showing only records you created. Request consent for full access.",
                    hiddenRecordCount: allRecords.length - ownRecords.length
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
                    consentedPurposes: hasConsent ? consents.map(c => c.purpose) : [],
                    totalRecords: allRecords.length,
                    accessibleRecords: accessibleRecords.length,
                    accessType: hasConsent ? "PURPOSE_FILTERED" : "OWN_RECORDS_ONLY",
                    purposeFilterApplied: hasConsent
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

/**
 * GET /api/records/patients/list
 * Get list of all patients (for doctor/nurse dropdown)
 */
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

module.exports = router;
