const User = require("../models/User");
const MedicalRecord = require("../models/MedicalRecord");
const Consent = require("../models/Consent");
const AuditLog = require("../models/AuditLog");
const encryptionService = require("./encryptionService");
const PDFDocument = require("pdfkit");

/**
 * Aggregates all personal and medical data for a patient.
 */
const aggregatePatientData = async (patientId) => {
    console.log(`Aggregating data for patient: ${patientId}. ENCRYPTION_KEY present: ${!!process.env.ENCRYPTION_KEY}`);
    try {
        const user = await User.findOne({ userId: patientId }).select("-passwordHash");
        const records = await MedicalRecord.find({ patientId }).sort({ createdAt: -1 });
        const consents = await Consent.find({ patientId });
        const auditLogs = await AuditLog.find({ userId: patientId });

        // Decrypt sensitive data in records
        const decryptedRecords = [];
        for (const record of records) {
            const doc = record.toObject();
            try {
                // Ensure we handle potentially null/undefined values correctly
                doc.diagnosis = doc.diagnosis ? encryptionService.decrypt(doc.diagnosis) : "N/A";
                doc.details = doc.details ? encryptionService.decrypt(doc.details) : "N/A";
                doc.prescription = doc.prescription ? encryptionService.decrypt(doc.prescription) : "";

                // Also decrypt lab results if they exist (newly added for completeness)
                if (doc.metadata?.labTest?.resultValue) {
                    doc.metadata.labTest.resultValue = encryptionService.decrypt(doc.metadata.labTest.resultValue);
                }
            } catch (decError) {
                console.error(`Decryption failed for record ${doc._id}:`, decError);
                doc.diagnosis = "[Decryption Error]";
                doc.details = "[Decryption Error]";
            }
            decryptedRecords.push(doc);
        }

        return {
            profile: user,
            medicalRecords: decryptedRecords,
            consents,
            auditLogs
        };
    } catch (error) {
        console.error("Error aggregating patient data:", error);
        throw error;
    }
};

/**
 * Generates a PDF version of the aggregated data.
 */
const generateDataExportPDF = (data, stream) => {
    const doc = new PDFDocument();
    doc.pipe(stream);

    doc.fontSize(20).text("Personal Data Export", { align: "center" });
    doc.moveDown();

    doc.fontSize(16).text("User Profile");
    doc.fontSize(12).text(`User ID: ${data.profile.userId}`);
    doc.text(`Name: ${data.profile.firstName} ${data.profile.lastName}`);
    doc.text(`Email: ${data.profile.email}`);
    doc.text(`Role: ${data.profile.role}`);
    doc.moveDown();

    doc.fontSize(16).text("Medical Records");
    data.medicalRecords.forEach((record, index) => {
        doc.fontSize(12).text(`${index + 1}. ${record.title} (${record.recordType})`);
        doc.fontSize(10).text(`Date: ${new Date(record.createdAt).toLocaleString()}`);
        doc.text(`Diagnosis: ${record.diagnosis || 'N/A'}`);
        doc.text(`Details: ${record.details || 'N/A'}`);
        if (record.prescription) {
            doc.text(`Prescription: ${record.prescription}`);
        }

        // Lab Results specifically
        if (record.recordType === 'LAB_RESULT' && record.metadata?.labTest) {
            const lab = record.metadata.labTest;
            doc.text(`Lab Test: ${lab.testName}`);
            doc.text(`Result: ${lab.resultValue} ${lab.unit || ''}`);
            doc.text(`Reference: ${lab.referenceRange || 'N/A'}`);
        }

        doc.moveDown();
    });

    doc.fontSize(16).text("Consents Given");
    data.consents.forEach((consent, index) => {
        doc.fontSize(10).text(`${index + 1}. Doctor: ${consent.doctorId}, Status: ${consent.status}, Date: ${consent.respondedAt || consent.requestedAt}`);
    });
    doc.moveDown();

    doc.end();
};

/**
 * Handles Right to Erasure / Anonymization.
 */
const performErasureRequest = async (patientId) => {
    const user = await User.findOne({ userId: patientId });
    if (!user) throw new Error("User not found");

    // Check data retention rules
    // For this implementation, we assume that profiles can be deleted 
    // but medical records must be anonymized (kept for legal reasons).

    // 1. Anonymize medical records
    // We keep the patientId as a pseudonym but remove identification from the user table
    // If we wanted to be even stricter, we'd replace patientId with a random hash.

    // 2. Anonymize/Delete User profile
    user.firstName = "ANONYMIZED";
    user.lastName = "USER";
    user.email = `deleted_${patientId}@example.com`;
    user.status = "SUSPENDED";
    await user.save();

    // 3. Clear consents
    await Consent.deleteMany({ patientId });

    return { success: true, message: "Identification data has been anonymized/erased where legally permissible." };
};

module.exports = {
    aggregatePatientData,
    generateDataExportPDF,
    performErasureRequest
};
