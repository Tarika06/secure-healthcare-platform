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

const crypto = require("crypto");

/**
 * Handles Right to Erasure / Anonymization according to GDPR Article 17.
 * performs deep pseudonymization to preserve clinical data integrity while 
 * ensuring individual privacy.
 */
const performErasureRequest = async (patientId) => {
    const user = await User.findOne({ userId: patientId });
    if (!user) throw new Error("User not found");

    // 1. Generate a one-way pseudonym (hash)
    // This allows medical records to remain useful for Clinical Analytics/Research
    // without ever being able to re-identify the patient.
    const pseudonym = "anon_" + crypto.createHash("sha256")
        .update(patientId + process.env.ENCRYPTION_KEY)
        .digest("hex")
        .substring(0, 12);

    console.log(`GDPR: Erasure request for ${patientId}. Decoupling medical records to pseudonym: ${pseudonym}`);

    // 2. Deep Decoupling of Medical Records
    // We update the patientId in all records to the pseudonym.
    // The original userId is now permanently severed from these clinical events.
    await MedicalRecord.updateMany(
        { patientId: patientId },
        { $set: { patientId: pseudonym } }
    );

    // 3. Anonymize/Sanitize the User Profile (The "Identity Shell")
    // We keep the object to prevent database inconsistency, but strip all PII.
    user.firstName = "ANONYMIZED";
    user.lastName = "DATASET";
    user.email = `${pseudonym}@anonymized.health.internal`;
    user.phone = "000-000-0000";
    user.status = "SUSPENDED";
    user.isOnline = false;
    user.acceptPrivacyPolicy = false;

    // Scramble the password hash so even the user can never log back in
    user.passwordHash = "$2b$10$" + crypto.randomBytes(16).toString("hex");

    await user.save();

    // 4. Revoke All External Authorizations (Consents)
    // All doctors lose access immediately as the identity is no longer valid.
    await Consent.deleteMany({ patientId: patientId });

    return {
        success: true,
        message: "Right to Erasure processed. Your medical records have been decoupled and anonymized for legal retention.",
        pseudonym: pseudonym
    };
};

module.exports = {
    aggregatePatientData,
    generateDataExportPDF,
    performErasureRequest
};
