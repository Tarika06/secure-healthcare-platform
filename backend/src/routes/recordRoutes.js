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
const ArchivedRecord = require("../models/ArchivedRecord");
const archivalService = require("../services/archivalService");
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
 * PUT /api/records/:id
 * Doctor/Lab Tech edits a medical record they created
 */
router.put(
    "/:id",
    authenticate,
    authorizeByUserId(["D", "L"]),
    async (req, res) => {
        try {
            const { title, diagnosis, details, prescription, recordType } = req.body;
            const editorId = req.user.userId;
            const recordId = req.params.id;

            const record = await MedicalRecord.findById(recordId);
            if (!record) {
                return res.status(404).json({ message: "Record not found" });
            }

            // Authorization: Only the creator can edit the record
            if (record.createdBy !== editorId) {
                return res.status(403).json({ message: "Access denied. You can only edit records you created." });
            }

            // Re-encrypt sensitive fields
            const encryptedData = encryptRecordFields({ diagnosis, details, prescription });

            // Update record
            record.title = title || record.title;
            record.recordType = recordType || record.recordType;
            record.diagnosis = encryptedData.diagnosis;
            record.details = encryptedData.details;
            record.prescription = encryptedData.prescription;

            await record.save();

            // Audit logging
            await auditService.logAuditEvent({
                userId: editorId,
                action: "RECORD_EDITED",
                resource: `/api/records/${record._id}`,
                method: "PUT",
                outcome: "SUCCESS",
                targetUserId: record.patientId,
                details: { recordType: record.recordType, title: record.title }
            });

            res.json({
                message: "Medical record updated successfully",
                record: decryptRecord(record.toObject())
            });
        } catch (error) {
            console.error("Error updating medical record:", error);
            res.status(500).json({ message: "Error updating medical record" });
        }
    }
);

/**
 * GET /api/records/my-records
 * Patient views their own medical records
 */
router.get(
    "/my-records",
    authenticate,
    authorizeByUserId(["P"]),
    async (req, res) => {
        try {
            const patientId = req.user.userId;
            const records = await MedicalRecord.find({ patientId }).sort({ createdAt: -1 }).lean();
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
 * Doctor views records THEY CREATED
 */
router.get(
    "/my-created-records",
    authenticate,
    authorizeByUserId(["D", "L"]),
    async (req, res) => {
        try {
            const doctorId = req.user.userId;
            const records = await MedicalRecord.find({ createdBy: doctorId }).sort({ createdAt: -1 }).lean();
            const decryptedRecords = records.map(record => decryptRecord(record));

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
            if (!patient) return res.status(404).json({ message: "Patient not found" });

            const consent = await Consent.findOne({ patientId, doctorId, status: "ACTIVE" });
            const hasConsent = !!consent;
            const allRecords = await MedicalRecord.find({ patientId }).sort({ createdAt: -1 }).lean();

            let accessibleRecords;
            let accessInfo;

            if (hasConsent) {
                accessibleRecords = allRecords.map(record => decryptRecord(record));
                accessInfo = { consentStatus: "ACTIVE", fullAccess: true, message: "Full access granted via patient consent" };
            } else {
                accessibleRecords = allRecords.filter(r => r.createdBy === doctorId).map(record => decryptRecord(record));
                accessInfo = {
                    consentStatus: "NONE",
                    fullAccess: false,
                    message: "Showing only records you created.",
                    hiddenRecordCount: allRecords.length - accessibleRecords.length
                };
            }

            await auditService.logAuditEvent({
                userId: doctorId,
                action: "RECORD_VIEWED",
                resource: `/api/records/patient/${patientId}`,
                method: "GET",
                outcome: "SUCCESS",
                targetUserId: patientId,
                details: { hasConsent, totalRecords: allRecords.length, accessibleRecords: accessibleRecords.length }
            });

            res.json({ records: accessibleRecords, accessInfo, patientInfo: { userId: patient.userId, name: `${patient.firstName} ${patient.lastName}` } });
        } catch (error) {
            console.error("Error fetching patient records:", error);
            res.status(500).json({ message: "Error fetching records" });
        }
    }
);

/**
 * GET /api/records/patients/list
 * Get list of all patients
 */
router.get(
    "/patients/list",
    authenticate,
    authorizeByUserId(["D", "N", "L"]),
    async (req, res) => {
        try {
            const patients = await User.find({
                $or: [{ role: "PATIENT" }, { userId: { $regex: /^P/i } }]
            }).select("userId firstName lastName email");

            await auditService.logAuditEvent({
                userId: req.user.userId,
                action: "PATIENT_LIST_VIEWED",
                resource: "/api/records/patients/list",
                method: "GET",
                outcome: "SUCCESS",
                details: { patientCount: patients.length }
            });

            res.json({ message: "Patients retrieved successfully", patients });
        } catch (error) {
            console.error("Error fetching patients:", error);
            res.status(500).json({ message: "Error fetching patients" });
        }
    }
);

/**
 * GET /api/records/doctors/list
 * Get list of all doctors (for booking)
 */
router.get(
    "/doctors/list",
    authenticate,
    async (req, res) => {
        try {
            const doctors = await User.find({
                $or: [{ role: "DOCTOR" }, { userId: { $regex: /^D/i } }],
                status: "ACTIVE"
            }).select("userId firstName lastName specialty email");

            await auditService.logAuditEvent({
                userId: req.user.userId,
                action: "DOCTOR_LIST_VIEWED",
                resource: "/api/records/doctors/list",
                method: "GET",
                outcome: "SUCCESS"
            });

            res.json({ message: "Doctors retrieved successfully", doctors });
        } catch (error) {
            console.error("Error fetching doctors:", error);
            res.status(500).json({ message: "Error fetching doctors" });
        }
    }
);

/**
 * GET /api/records/admin/archived
 * Admin views all archived records
 */
router.get(
    "/admin/archived",
    authenticate,
    authorizeByUserId(["A"]),
    async (req, res) => {
        try {
            const archivedRecords = await ArchivedRecord.find().sort({ archivedAt: -1 }).lean();
            const decrypted = archivedRecords.map(r => decryptRecord(r));
            await auditService.logAuditEvent({
                userId: req.user.userId,
                action: "ARCHIVE_LIST_VIEWED",
                resource: "/api/records/admin/archived",
                method: "GET",
                outcome: "SUCCESS"
            });
            res.json({ records: decrypted });
        } catch (error) {
            res.status(500).json({ message: "Error fetching archive" });
        }
    }
);

/**
 * GET /api/records/admin/hot-storage
 * Admin views metadata of all active records
 */
router.get(
    "/admin/hot-storage",
    authenticate,
    authorizeByUserId(["A"]),
    async (req, res) => {
        try {
            const records = await MedicalRecord.find().select("patientId title createdAt").sort({ createdAt: -1 }).lean();
            res.json({ records });
        } catch (error) {
            res.status(500).json({ message: "Error fetching hot storage" });
        }
    }
);

/**
 * POST /api/records/admin/restore/:archiveId
 * Admin restores a record from cold storage
 */
router.post(
    "/admin/restore/:archiveId",
    authenticate,
    authorizeByUserId(["A"]),
    async (req, res) => {
        try {
            const record = await archivalService.restoreFromArchive(req.params.archiveId, req.user.userId);
            res.json({ message: "Record restored to active database", record: decryptRecord(record.toObject()) });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

module.exports = router;
