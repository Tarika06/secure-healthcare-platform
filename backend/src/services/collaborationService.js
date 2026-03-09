const Collaboration = require("../models/Collaboration");
const CollaborationMessage = require("../models/CollaborationMessage");
const MedicalRecord = require("../models/MedicalRecord");
const { encrypt, decrypt, decryptRecord } = require("./encryptionService");
const { logAuditEvent } = require("./auditService");

/**
 * Collaboration Service
 * 
 * Handles Doctor-to-Doctor consultation and secure data sharing.
 * HIPAA/GDPR Compliant:
 * - Scoped data access
 * - Encrypted communication
 * - Full audit trail
 */

/**
 * Create a new consultation request
 */
exports.requestConsultation = async (requestData, requestingDoctorId) => {
    const { patientId, consultingDoctorId, accessScope, message, expiresAt } = requestData;

    const collaboration = new Collaboration({
        patientId,
        requestingDoctorId,
        consultingDoctorId,
        accessScope,
        requestMessage: encrypt(message),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: "PENDING"
    });

    await collaboration.save();

    await logAuditEvent({
        userId: requestingDoctorId,
        action: "CONSULTATION_REQUESTED",
        resource: "Collaboration",
        resourceId: collaboration._id,
        outcome: "SUCCESS",
        targetUserId: patientId,
        details: { consultingDoctorId, accessScope }
    });

    return { ...collaboration.toObject(), requestMessage: message };
};

/**
 * Get collaborations for a doctor (decrypted)
 */
exports.getMyCollaborations = async (userId) => {
    const incoming = await Collaboration.find({ consultingDoctorId: userId }).sort({ createdAt: -1 }).lean();
    const outgoing = await Collaboration.find({ requestingDoctorId: userId }).sort({ createdAt: -1 }).lean();

    const decryptCollab = (c) => ({
        ...c,
        requestMessage: decrypt(c.requestMessage)
    });

    return {
        incoming: incoming.map(decryptCollab),
        outgoing: outgoing.map(decryptCollab)
    };
};

/**
 * Accept or Decline a consultation request
 */
exports.respondToRequest = async (collaborationId, consultingDoctorId, status) => {
    if (!["ACCEPTED", "DECLINED"].includes(status)) {
        throw new Error("Invalid response status");
    }

    const collaboration = await Collaboration.findOne({
        _id: collaborationId,
        consultingDoctorId
    });

    if (!collaboration) throw new Error("Consultation request not found");
    if (collaboration.status !== "PENDING") throw new Error("Request already processed");

    collaboration.status = status;
    if (status === "ACCEPTED") {
        collaboration.acceptedAt = new Date();
    }
    await collaboration.save();

    await logAuditEvent({
        userId: consultingDoctorId,
        action: `CONSULTATION_${status}`,
        resource: "Collaboration",
        resourceId: collaborationId,
        outcome: "SUCCESS",
        targetUserId: collaboration.patientId
    });

    return collaboration;
};

/**
 * Send an encrypted message in a collaboration
 */
exports.sendMessage = async (collaborationId, senderId, messageData) => {
    const { message, attachmentUrl, attachmentName } = messageData;

    const collaboration = await Collaboration.findById(collaborationId);
    if (!collaboration) throw new Error("Collaboration not found");

    // Check if sender is part of this collaboration
    if (collaboration.requestingDoctorId !== senderId && collaboration.consultingDoctorId !== senderId) {
        throw new Error("Unauthorized: Not part of this collaboration");
    }

    if (collaboration.status !== "ACCEPTED") {
        throw new Error("Collaboration must be accepted to send messages");
    }

    const newMessage = new CollaborationMessage({
        collaborationId,
        senderId,
        message: encrypt(message),
        attachmentUrl,
        attachmentName
    });

    await newMessage.save();

    await logAuditEvent({
        userId: senderId,
        action: "CONSULTATION_MESSAGE_SENT",
        resource: "CollaborationMessage",
        resourceId: newMessage._id,
        outcome: "SUCCESS"
    });

    return newMessage;
};

/**
 * Get scoped patient data for a consulting doctor
 */
exports.getScopedPatientData = async (collaborationId, doctorId) => {
    const collaboration = await Collaboration.findById(collaborationId);
    if (!collaboration) throw new Error("Collaboration not found");

    // Check access
    if (collaboration.consultingDoctorId !== doctorId && collaboration.requestingDoctorId !== doctorId) {
        throw new Error("Access Denied");
    }

    if (collaboration.status !== "ACCEPTED") {
        throw new Error("Full access not yet granted");
    }

    // Check expiry
    if (collaboration.expiresAt && new Date() > collaboration.expiresAt) {
        collaboration.status = "EXPIRED";
        await collaboration.save();
        throw new Error("Access has expired");
    }

    const query = { patientId: collaboration.patientId };

    // Apply scope filters
    if (collaboration.accessScope === "LAB_REPORTS") {
        query.recordType = "LAB_RESULT";
    } else if (collaboration.accessScope === "PRESCRIPTIONS") {
        query.recordType = "PRESCRIPTION";
    } else if (collaboration.accessScope === "SUMMARY") {
        // Just recent summary, let's say last 5 records
    }

    let records = await MedicalRecord.find(query).sort({ createdAt: -1 });

    if (collaboration.accessScope === "SUMMARY") {
        records = records.slice(0, 5);
    }

    // Decrypt based on scope (some fields might be hidden if needed, 
    // but the decryptRecord tool returns full decryption for allowed doctors)
    const decryptedRecords = records.map(r => decryptRecord(r.toObject()));

    await logAuditEvent({
        userId: doctorId,
        action: "CONSULTATION_DATA_ACCESSED",
        resource: "MedicalRecord",
        outcome: "SUCCESS",
        targetUserId: collaboration.patientId,
        details: { collaborationId, scope: collaboration.accessScope }
    });

    return decryptedRecords;
};

/**
 * Get messages and decrypt them
 */
exports.getMessages = async (collaborationId, doctorId) => {
    const collaboration = await Collaboration.findById(collaborationId);
    if (!collaboration) throw new Error("Collaboration not found");

    if (collaboration.consultingDoctorId !== doctorId && collaboration.requestingDoctorId !== doctorId) {
        throw new Error("Access Denied");
    }

    const messages = await CollaborationMessage.find({ collaborationId }).sort({ createdAt: 1 }).lean();

    return messages.map(m => ({
        ...m,
        message: decrypt(m.message)
    }));
};
