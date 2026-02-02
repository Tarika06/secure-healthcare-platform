const express = require("express");
const router = express.Router();
const MedicalRecord = require("../models/MedicalRecord");
const User = require("../models/User");
const authenticate = require("../middleware/authenticate");
const authorizeByUserId = require("../middleware/authorizeByUserId");
const auditLogger = require("../middleware/auditLogger");
const encryptionService = require("../services/encryptionService");

// Doctor creates a medical record for a patient
router.post(
    "/create",
    authenticate,
    authorizeByUserId(["D"]),
    async (req, res) => {
        try {
            const { patientId, title, diagnosis, details, prescription, recordType } = req.body;

            // Verify patient exists
            const patient = await User.findOne({ userId: patientId });
            if (!patient || !patientId.startsWith("P")) {
                return res.status(400).json({ message: "Invalid patient ID" });
            }

            const newRecord = new MedicalRecord({
                patientId,
                title,
                diagnosis: encryptionService.encrypt(diagnosis),
                details: encryptionService.encrypt(details),
                prescription: prescription ? encryptionService.encrypt(prescription) : "",
                recordType: recordType || "GENERAL",
                createdBy: req.user.userId
            });

            await newRecord.save();

            res.status(201).json({
                message: "Medical record created successfully (Encrypted)",
                record: newRecord
            });
        } catch (error) {
            console.error("Error creating medical record:", error);
            res.status(500).json({
                message: "Error creating medical record",
                error: error.message
            });
        }
    }
);

// Patient views their own medical records
router.get(
    "/my-records",
    authenticate,
    authorizeByUserId(["P"]),
    async (req, res) => {
        try {
            const records = await MedicalRecord.find({ patientId: req.user.userId }).sort({ createdAt: -1 });

            // Decrypt records
            const decryptedRecords = records.map(r => {
                const doc = r.toObject();
                doc.diagnosis = encryptionService.decrypt(doc.diagnosis);
                doc.details = encryptionService.decrypt(doc.details);
                doc.prescription = encryptionService.decrypt(doc.prescription);
                return doc;
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

// Doctor views patient medical records (requires consent)
router.get(
    "/patient/:patientId",
    authenticate,
    authorizeByUserId(["D"]),
    async (req, res) => {
        try {
            const { patientId } = req.params;
            const doctorId = req.user.userId;

            // Import Consent model
            const Consent = require("../models/Consent");

            // Check if doctor has active consent
            const consent = await Consent.findOne({
                patientId,
                doctorId,
                status: "ACTIVE"
            });

            if (!consent) {
                return res.status(403).json({
                    error: "CONSENT_REQUIRED",
                    message: "Patient consent required to view medical records"
                });
            }

            const records = await MedicalRecord.find({ patientId }).sort({ createdAt: -1 });

            // Decrypt records
            const decryptedRecords = records.map(r => {
                const doc = r.toObject();
                doc.diagnosis = encryptionService.decrypt(doc.diagnosis);
                doc.details = encryptionService.decrypt(doc.details);
                doc.prescription = encryptionService.decrypt(doc.prescription);
                return doc;
            });

            res.json({ message: "Records retrieved successfully", records: decryptedRecords });
        } catch (error) {
            console.error("Error fetching patient records:", error);
            res.status(500).json({ message: "Error fetching records" });
        }
    }
);

// Get list of all patients (for doctor dropdown)
router.get(
    "/patients/list",
    authenticate,
    authorizeByUserId(["D"]),
    async (req, res) => {
        try {
            const patients = await User.find({ role: "PATIENT" }).select("userId firstName lastName email");

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
