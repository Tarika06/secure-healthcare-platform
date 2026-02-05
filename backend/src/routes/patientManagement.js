const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorizeByUserId = require('../middleware/authorizeByUserId');
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const Consent = require('../models/Consent');
const encryptionService = require('../services/encryptionService');
const { logAuditEvent } = require('../services/auditService');

// ============================================================
// 1. DOCTOR: Create EHR Entry (Encrypted)
// ============================================================
router.post('/doctor/ehr', authenticate, authorizeByUserId(['D']), async (req, res) => {
    try {
        const { patientId, title, diagnosis, details, prescription, recordType, vitals } = req.body;

        // Verify patient exists
        const patient = await User.findOne({ userId: patientId, role: 'PATIENT' });
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Create encrypted record
        const record = new MedicalRecord({
            patientId,
            title,
            diagnosis: encryptionService.encrypt(diagnosis),
            details: encryptionService.encrypt(details),
            prescription: prescription ? encryptionService.encrypt(prescription) : '',
            recordType: recordType || 'GENERAL',
            createdBy: req.user.userId,
            metadata: { vitals: vitals || {} }
        });

        await record.save();

        logAuditEvent({
            userId: req.user.userId,
            action: 'CREATE_EHR',
            resource: patientId,
            outcome: 'SUCCESS',
            method: 'POST'
        });

        res.status(201).json({
            message: 'EHR record created successfully (Encrypted)',
            record
        });
    } catch (error) {
        console.error('Error creating EHR:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 2. DOCTOR: View Patient EHR (Consent Required + Decrypted)
// ============================================================
router.get('/doctor/ehr/:patientId', authenticate, authorizeByUserId(['D']), async (req, res) => {
    try {
        const { patientId } = req.params;
        const doctorId = req.user.userId;

        // Check for active, non-expired consent
        const consent = await Consent.findOne({
            patientId,
            doctorId,
            status: 'ACTIVE',
            $or: [
                { expiresAt: { $gt: new Date() } },
                { expiresAt: null }
            ]
        });

        if (!consent) {
            logAuditEvent({
                userId: doctorId,
                action: 'VIEW_EHR',
                resource: patientId,
                outcome: 'DENIED',
                reason: 'NO_ACTIVE_CONSENT',
                method: 'GET'
            });
            return res.status(403).json({
                error: 'CONSENT_REQUIRED',
                message: 'No active consent from patient. Please request consent first.'
            });
        }

        // Fetch and decrypt records
        const records = await MedicalRecord.find({ patientId }).sort({ createdAt: -1 });
        const decryptedRecords = records.map(r => {
            const doc = r.toObject();
            doc.diagnosis = encryptionService.decrypt(doc.diagnosis);
            doc.details = encryptionService.decrypt(doc.details);
            doc.prescription = encryptionService.decrypt(doc.prescription);
            return doc;
        });

        logAuditEvent({
            userId: doctorId,
            action: 'VIEW_EHR',
            resource: patientId,
            outcome: 'SUCCESS',
            method: 'GET'
        });

        res.json({
            message: 'EHR records retrieved successfully',
            patientId,
            records: decryptedRecords
        });
    } catch (error) {
        console.error('Error fetching EHR:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 3. NURSE: View Vitals Only (Read-only, No Sensitive Data)
// ============================================================
router.get('/nurse/vitals/:patientId', authenticate, authorizeByUserId(['N']), async (req, res) => {
    try {
        const { patientId } = req.params;

        const records = await MedicalRecord.find({ patientId }).sort({ createdAt: -1 });

        // Only return vitals and timestamps - NO diagnosis, details, or prescription
        const vitalsOnly = records.map(r => ({
            recordId: r._id,
            recordType: r.recordType,
            vitals: r.metadata?.vitals || {},
            createdAt: r.createdAt
        }));

        logAuditEvent({
            userId: req.user.userId,
            action: 'VIEW_VITALS',
            resource: patientId,
            outcome: 'SUCCESS',
            method: 'GET'
        });

        res.json({
            message: 'Vitals retrieved successfully',
            patientId,
            vitals: vitalsOnly
        });
    } catch (error) {
        console.error('Error fetching vitals:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 4. LAB TECH: Upload Lab Results
// ============================================================
router.post('/lab/upload', authenticate, authorizeByUserId(['L']), async (req, res) => {
    try {
        const { patientId, testName, resultValue, unit, referenceRange, notes } = req.body;

        // Verify patient exists
        const patient = await User.findOne({ userId: patientId, role: 'PATIENT' });
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const labRecord = new MedicalRecord({
            patientId,
            title: `Lab Result: ${testName}`,
            diagnosis: encryptionService.encrypt(`Test: ${testName}`),
            details: encryptionService.encrypt(`Result: ${resultValue} ${unit || ''}\nReference: ${referenceRange || 'N/A'}`),
            prescription: notes ? encryptionService.encrypt(notes) : '',
            recordType: 'LAB_RESULT',
            createdBy: req.user.userId,
            metadata: {
                labTest: {
                    testName,
                    resultValue: encryptionService.encrypt(resultValue),
                    unit,
                    referenceRange
                }
            }
        });

        await labRecord.save();

        logAuditEvent({
            userId: req.user.userId,
            action: 'UPLOAD_LAB_RESULT',
            resource: patientId,
            outcome: 'SUCCESS',
            method: 'POST'
        });

        res.status(201).json({
            message: 'Lab result uploaded successfully',
            record: labRecord
        });
    } catch (error) {
        console.error('Error uploading lab result:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 5. PATIENT: View Own Records (Full Access, Decrypted)
// ============================================================
router.get('/patient/my-records', authenticate, authorizeByUserId(['P']), async (req, res) => {
    try {
        const patientId = req.user.userId;

        const records = await MedicalRecord.find({ patientId }).sort({ createdAt: -1 });

        // Decrypt all records for the patient
        const decryptedRecords = records.map(r => {
            const doc = r.toObject();
            doc.diagnosis = encryptionService.decrypt(doc.diagnosis);
            doc.details = encryptionService.decrypt(doc.details);
            doc.prescription = encryptionService.decrypt(doc.prescription);
            return doc;
        });

        logAuditEvent({
            userId: patientId,
            action: 'VIEW_OWN_RECORDS',
            resource: patientId,
            outcome: 'SUCCESS',
            method: 'GET'
        });

        res.json({
            message: 'Your records retrieved successfully',
            records: decryptedRecords
        });
    } catch (error) {
        console.error('Error fetching patient records:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 6. PATIENT: View Who Has Access (Active Consents)
// ============================================================
router.get('/patient/access-list', authenticate, authorizeByUserId(['P']), async (req, res) => {
    try {
        const patientId = req.user.userId;

        const activeConsents = await Consent.find({
            patientId,
            status: 'ACTIVE'
        });

        // Get doctor details for each consent
        const accessList = await Promise.all(
            activeConsents.map(async (consent) => {
                const doctor = await User.findOne({ userId: consent.doctorId })
                    .select('userId firstName lastName specialty');
                return {
                    consentId: consent._id,
                    doctor: doctor || { userId: consent.doctorId },
                    grantedAt: consent.respondedAt,
                    expiresAt: consent.expiresAt
                };
            })
        );

        res.json({
            message: 'Access list retrieved',
            accessList
        });
    } catch (error) {
        console.error('Error fetching access list:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================
// 7. ADMIN/DOCTOR: View Anonymized Health Trends (AI Analysis)
// ============================================================
router.get('/analysis/trends', authenticate, authorizeByUserId(['A', 'D']), async (req, res) => {
    try {
        // Aggregate anonymized statistics
        const totalRecords = await MedicalRecord.countDocuments();
        const recordsByType = await MedicalRecord.aggregate([
            { $group: { _id: '$recordType', count: { $sum: 1 } } }
        ]);

        const totalPatients = await User.countDocuments({ role: 'PATIENT' });
        const totalDoctors = await User.countDocuments({ role: 'DOCTOR' });

        // Recent activity (last 7 days)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentRecords = await MedicalRecord.countDocuments({
            createdAt: { $gte: weekAgo }
        });

        logAuditEvent({
            userId: req.user.userId,
            action: 'VIEW_TRENDS_ANALYSIS',
            resource: 'GLOBAL_STATS',
            outcome: 'SUCCESS',
            method: 'GET'
        });

        res.json({
            message: 'Anonymized health trends',
            stats: {
                totalRecords,
                recordsByType,
                totalPatients,
                totalDoctors,
                recentRecordsLast7Days: recentRecords,
                generatedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Error generating trends:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
