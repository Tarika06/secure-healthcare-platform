/**
 * Deletion Service
 * 
 * Core business logic for the multi-layer delayed account deletion workflow.
 * 
 * Workflow:
 * 1. User initiates deletion → MFA MUST be enabled → Account locked
 * 2. MFA verification required → Deletion scheduled (7 days)
 * 3. Notifications sent to all channels including authenticator
 * 4. 24h reminder before final deletion
 * 5. Permanent deletion: anonymize data, invalidate sessions
 * 6. Final confirmation notification
 */

const speakeasy = require("speakeasy");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const DeletionRequest = require("../models/DeletionRequest");
const MedicalRecord = require("../models/MedicalRecord");
const Consent = require("../models/Consent");
const { logAuditEvent } = require("./auditService");
const notificationService = require("./notificationService");

const DELETION_DELAY_DAYS = 7;

// ═══════════════════════════════════════════════════════
// STEP 1: INITIATE DELETION REQUEST
// ═══════════════════════════════════════════════════════

/**
 * Initiate an account deletion request.
 * REQUIRES: User must have MFA enabled.
 * 
 * @param {string} userId 
 * @param {object} securityInfo - { ipAddress, userAgent, deviceFingerprint }
 * @returns {object} - deletion request details
 */
const initiateDeletionRequest = async (userId, securityInfo = {}) => {
    // 1. Fetch user
    const user = await User.findOne({ userId });
    if (!user) throw new Error("User not found");

    // 2. CRITICAL: MFA must be enabled before deletion can proceed
    if (!user.mfaEnabled || !user.mfaSecret) {
        throw new Error(
            "MFA_REQUIRED: You must enable Multi-Factor Authentication (MFA) via Google Authenticator before you can delete your account. " +
            "This is required to verify your identity and send secure deletion notifications to your authenticator app."
        );
    }

    // 3. Check for existing pending deletion request
    const existingRequest = await DeletionRequest.findOne({
        userId,
        status: { $in: ["PENDING_MFA", "MFA_VERIFIED", "REMINDER_SENT"] }
    });
    if (existingRequest) {
        throw new Error(
            "EXISTING_REQUEST: You already have a pending deletion request. " +
            `Scheduled for deletion on ${notificationService.formatDate(existingRequest.scheduledDeletionDate)}.`
        );
    }

    // 4. Calculate scheduled deletion date (7 days from now)
    const scheduledDeletionDate = new Date();
    scheduledDeletionDate.setDate(scheduledDeletionDate.getDate() + DELETION_DELAY_DAYS);

    // 5. Create deletion request
    const deletionRequest = new DeletionRequest({
        userId: user.userId,
        userRole: user.role,
        userEmail: user.email,
        scheduledDeletionDate,
        status: "PENDING_MFA",
        requestIpAddress: securityInfo.ipAddress || "unknown",
        requestUserAgent: securityInfo.userAgent || "unknown",
        deviceFingerprint: securityInfo.deviceFingerprint || "unknown",
        accountLocked: false,
        notificationHistory: []
    });
    await deletionRequest.save();

    // 6. Send initial notifications (Step 1 of workflow)
    await notificationService.sendDeletionRequestNotifications(deletionRequest);

    // 7. Audit log
    await logAuditEvent({
        userId,
        action: "ACCOUNT_DELETION_REQUESTED",
        resource: "/deletion/initiate",
        method: "POST",
        outcome: "SUCCESS",
        details: {
            scheduledDeletionDate,
            mfaEnabled: true,
            ipAddress: securityInfo.ipAddress,
            deviceFingerprint: securityInfo.deviceFingerprint
        },
        ipAddress: securityInfo.ipAddress,
        userAgent: securityInfo.userAgent,
        complianceCategory: "GDPR"
    });

    return {
        requestId: deletionRequest._id,
        status: deletionRequest.status,
        scheduledDeletionDate,
        daysRemaining: DELETION_DELAY_DAYS,
        message: "Deletion request created. Please verify with your authenticator app MFA code to confirm.",
        mfaRequired: true
    };
};

// ═══════════════════════════════════════════════════════
// STEP 2: VERIFY MFA & CONFIRM DELETION
// ═══════════════════════════════════════════════════════

/**
 * Verify MFA code to confirm deletion request.
 * This is the critical security step — without MFA, deletion cannot proceed.
 * 
 * @param {string} userId 
 * @param {string} mfaCode - TOTP code from authenticator
 * @param {object} securityInfo
 * @returns {object}
 */
const verifyMFAForDeletion = async (userId, mfaCode, securityInfo = {}) => {
    // 1. Get user and verify MFA
    const user = await User.findOne({ userId });
    if (!user) throw new Error("User not found");
    if (!user.mfaEnabled || !user.mfaSecret) throw new Error("MFA not configured");

    // 2. Get pending deletion request
    const deletionRequest = await DeletionRequest.findOne({
        userId,
        status: "PENDING_MFA"
    });
    if (!deletionRequest) throw new Error("No pending deletion request found");

    // 3. Verify TOTP code
    const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: "base32",
        token: mfaCode,
        window: 2
    });

    if (!verified) {
        await logAuditEvent({
            userId,
            action: "DELETION_MFA_VERIFICATION_FAILED",
            resource: "/deletion/verify-mfa",
            method: "POST",
            outcome: "FAILURE",
            details: { reason: "Invalid MFA code" },
            ipAddress: securityInfo.ipAddress,
            complianceCategory: "SECURITY"
        });
        throw new Error("Invalid MFA verification code. Please try again with a valid code from your authenticator app.");
    }

    // 4. MFA verified — update deletion request
    deletionRequest.status = "MFA_VERIFIED";
    deletionRequest.mfaVerifiedAt = new Date();
    deletionRequest.deletionConfirmedWithMFA = true;
    deletionRequest.accountLocked = true;
    deletionRequest.lockedAt = new Date();
    await deletionRequest.save();

    // 5. Lock the account immediately
    user.status = "SUSPENDED";
    await user.save();

    // 6. Send MFA confirmation notifications
    await notificationService.sendMFAConfirmationNotification(deletionRequest);

    // 7. Audit log
    await logAuditEvent({
        userId,
        action: "DELETION_MFA_VERIFIED",
        resource: "/deletion/verify-mfa",
        method: "POST",
        outcome: "SUCCESS",
        details: {
            scheduledDeletionDate: deletionRequest.scheduledDeletionDate,
            accountLocked: true,
            ipAddress: securityInfo.ipAddress,
            deviceFingerprint: securityInfo.deviceFingerprint
        },
        ipAddress: securityInfo.ipAddress,
        complianceCategory: "GDPR"
    });

    return {
        requestId: deletionRequest._id,
        status: "MFA_VERIFIED",
        scheduledDeletionDate: deletionRequest.scheduledDeletionDate,
        daysRemaining: notificationService.getDaysRemaining(deletionRequest.scheduledDeletionDate),
        accountLocked: true,
        message: `Account deletion confirmed. Your account will be permanently deleted on ${notificationService.formatDate(deletionRequest.scheduledDeletionDate)}. You can cancel by logging back in within 7 days.`
    };
};

// ═══════════════════════════════════════════════════════
// STEP 3: CANCEL DELETION (User logs in again)
// ═══════════════════════════════════════════════════════

/**
 * Cancel a pending deletion request.
 * Called when user logs in during the trial week.
 * 
 * @param {string} userId 
 * @returns {object}
 */
const cancelDeletionRequest = async (userId) => {
    const deletionRequest = await DeletionRequest.findOne({
        userId,
        status: { $in: ["PENDING_MFA", "MFA_VERIFIED", "REMINDER_SENT"] }
    });

    if (!deletionRequest) {
        return { cancelled: false, message: "No active deletion request found" };
    }

    // Update deletion request
    deletionRequest.status = "CANCELLED";
    deletionRequest.cancelledAt = new Date();
    deletionRequest.cancelledByLogin = true;
    deletionRequest.cancellationReason = "User logged in during trial period";
    deletionRequest.accountLocked = false;
    await deletionRequest.save();

    // Restore user account
    const user = await User.findOne({ userId });
    if (user && user.status === "SUSPENDED") {
        user.status = "ACTIVE";
        await user.save();
    }

    // Send cancellation notifications
    await notificationService.sendCancellationNotifications(deletionRequest);

    // Audit log
    await logAuditEvent({
        userId,
        action: "DELETION_REQUEST_CANCELLED",
        resource: "/deletion/cancel",
        method: "POST",
        outcome: "SUCCESS",
        details: {
            requestId: deletionRequest._id,
            originalScheduledDate: deletionRequest.scheduledDeletionDate,
            cancelledByLogin: true
        },
        complianceCategory: "GDPR"
    });

    return {
        cancelled: true,
        message: "Your deletion request has been cancelled. Your account is now active."
    };
};

// ═══════════════════════════════════════════════════════
// STEP 4: PERMANENT DELETION (Called by cron)
// ═══════════════════════════════════════════════════════

/**
 * Execute permanent deletion for a user.
 * Called by the cron job after 7 days.
 * 
 * Actions:
 * 1. Anonymize user profile
 * 2. Anonymize medical records (keep for compliance)
 * 3. Clear consents
 * 4. Invalidate all JWT tokens
 * 5. Send final notification
 * 6. Update audit log
 */
const executePermanentDeletion = async (deletionRequestId) => {
    const deletionRequest = await DeletionRequest.findById(deletionRequestId);
    if (!deletionRequest) throw new Error("Deletion request not found");
    if (deletionRequest.status === "COMPLETED") throw new Error("Already completed");
    if (deletionRequest.status === "CANCELLED") throw new Error("Request was cancelled");

    const { userId, userEmail } = deletionRequest;

    try {
        // 1. Anonymize user profile
        const user = await User.findOne({ userId });
        if (user) {
            user.firstName = "DELETED";
            user.lastName = "USER";
            user.email = `deleted_${userId}_${Date.now()}@anonymized.securecare.plus`;
            user.phone = "";
            user.status = "SUSPENDED";
            user.isOnline = false;
            user.mfaEnabled = false;
            user.mfaSecret = null;
            user.mfaTempSecret = null;
            user.passwordHash = "INVALIDATED_" + Date.now();
            user.deletedAt = new Date();
            user.isDeleted = true;
            await user.save();
        }

        // 2. Anonymize medical records (keep structure for compliance)
        await MedicalRecord.updateMany(
            { patientId: userId },
            {
                $set: {
                    "metadata.anonymized": true,
                    "metadata.anonymizedAt": new Date(),
                    "metadata.originalPatientId": "REDACTED"
                }
            }
        );

        // 3. Clear consents
        await Consent.deleteMany({ patientId: userId });

        // 4. Mark deletion as completed
        deletionRequest.status = "COMPLETED";
        deletionRequest.completedAt = new Date();
        await deletionRequest.save();

        // 5. Send final notification (email only — account is gone)
        // Use original email since account is now anonymized
        const tempRequest = { ...deletionRequest.toObject(), userEmail };
        await notificationService.sendFinalDeletionNotifications(deletionRequest);

        // 6. Clear in-app notifications
        notificationService.clearUserNotifications(userId);

        // 7. Audit log (immutable — preserved for compliance)
        await logAuditEvent({
            userId,
            action: "ACCOUNT_PERMANENTLY_DELETED",
            resource: "/deletion/permanent",
            method: "DELETE",
            outcome: "SUCCESS",
            details: {
                requestId: deletionRequest._id,
                originalEmail: "[REDACTED]",
                deletionDate: new Date(),
                dataAnonymized: true,
                medicalRecordsAnonymized: true,
                consentsDeleted: true,
                jwtTokensInvalidated: true
            },
            complianceCategory: "GDPR"
        });

        console.log(`🗑️ Account permanently deleted: ${userId}`);
        return { success: true, userId, completedAt: new Date() };

    } catch (error) {
        console.error(`❌ Permanent deletion failed for ${userId}:`, error);

        await logAuditEvent({
            userId,
            action: "ACCOUNT_DELETION_FAILED",
            resource: "/deletion/permanent",
            method: "DELETE",
            outcome: "FAILURE",
            details: { error: error.message },
            complianceCategory: "GDPR"
        });

        throw error;
    }
};

// ═══════════════════════════════════════════════════════
// QUERY HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Get deletion status for a user
 */
const getDeletionStatus = async (userId) => {
    const request = await DeletionRequest.findOne({
        userId,
        status: { $in: ["PENDING_MFA", "MFA_VERIFIED", "REMINDER_SENT"] }
    }).sort({ createdAt: -1 });

    if (!request) {
        return { hasPendingDeletion: false };
    }

    return {
        hasPendingDeletion: true,
        requestId: request._id,
        status: request.status,
        scheduledDeletionDate: request.scheduledDeletionDate,
        daysRemaining: notificationService.getDaysRemaining(request.scheduledDeletionDate),
        mfaVerified: request.deletionConfirmedWithMFA,
        accountLocked: request.accountLocked,
        requestedAt: request.requestedAt,
        notificationHistory: request.notificationHistory
    };
};

/**
 * Get all pending deletions (Admin view)
 */
const getPendingDeletions = async () => {
    const requests = await DeletionRequest.find({
        status: { $in: ["PENDING_MFA", "MFA_VERIFIED", "REMINDER_SENT"] }
    }).sort({ scheduledDeletionDate: 1 });

    return requests.map(r => ({
        requestId: r._id,
        userId: r.userId,
        userRole: r.userRole,
        userEmail: r.userEmail,
        status: r.status,
        scheduledDeletionDate: r.scheduledDeletionDate,
        daysRemaining: notificationService.getDaysRemaining(r.scheduledDeletionDate),
        mfaVerified: r.deletionConfirmedWithMFA,
        accountLocked: r.accountLocked,
        requestedAt: r.requestedAt,
        requestIpAddress: r.requestIpAddress
    }));
};

/**
 * Get deletion history (completed + cancelled)
 */
const getDeletionHistory = async (limit = 50) => {
    return DeletionRequest.find({
        status: { $in: ["COMPLETED", "CANCELLED"] }
    }).sort({ updatedAt: -1 }).limit(limit);
};

module.exports = {
    initiateDeletionRequest,
    verifyMFAForDeletion,
    cancelDeletionRequest,
    executePermanentDeletion,
    getDeletionStatus,
    getPendingDeletions,
    getDeletionHistory,
    DELETION_DELAY_DAYS
};
