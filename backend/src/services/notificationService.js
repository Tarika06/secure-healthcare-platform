/**
 * Notification Service
 * 
 * Multi-channel notification system for SecureCare+ account deletion workflow.
 * Supports: In-App, Email, Push Notification, and Authenticator App notifications.
 * 
 * Each notification is logged and tracked in the DeletionRequest's notificationHistory.
 */

const DeletionRequest = require("../models/DeletionRequest");
const User = require("../models/User");
const { logAuditEvent } = require("./auditService");

/**
 * Format a date for display in notifications
 */
const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

/**
 * Calculate days remaining until deletion
 */
const getDaysRemaining = (scheduledDate) => {
    const now = new Date();
    const scheduled = new Date(scheduledDate);
    const diffMs = scheduled - now;
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

// ═══════════════════════════════════════════════════════
// IN-APP NOTIFICATION SERVICE
// ═══════════════════════════════════════════════════════

/**
 * In-App Notification Store
 * In a production system, this would be a database collection 
 * or a real-time system like Socket.io / Firebase.
 * For now, we store in-memory and expose via API.
 */
const inAppNotifications = new Map(); // userId -> [notifications]

const addInAppNotification = (userId, notification) => {
    if (!inAppNotifications.has(userId)) {
        inAppNotifications.set(userId, []);
    }
    const notif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...notification,
        read: false,
        createdAt: new Date()
    };
    inAppNotifications.get(userId).push(notif);
    return notif;
};

const getInAppNotifications = (userId) => {
    return inAppNotifications.get(userId) || [];
};

const markNotificationRead = (userId, notifId) => {
    const notifs = inAppNotifications.get(userId) || [];
    const notif = notifs.find(n => n.id === notifId);
    if (notif) notif.read = true;
    return notif;
};

const clearUserNotifications = (userId) => {
    inAppNotifications.delete(userId);
};

// ═══════════════════════════════════════════════════════
// EMAIL NOTIFICATION SERVICE (Simulated)
// ═══════════════════════════════════════════════════════

/**
 * Send email notification
 * In production, integrate with SendGrid, AWS SES, or Nodemailer
 */
const sendEmailNotification = async (userEmail, subject, body) => {
    // Simulate email sending
    console.log(`📧 EMAIL SENT to ${userEmail}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${body.substring(0, 100)}...`);

    // In production:
    // await transporter.sendMail({ to: userEmail, subject, html: body });

    return { success: true, timestamp: new Date() };
};

// ═══════════════════════════════════════════════════════
// PUSH NOTIFICATION SERVICE (Simulated)
// ═══════════════════════════════════════════════════════

/**
 * Send push notification
 * In production, integrate with Firebase Cloud Messaging (FCM) or APNs
 */
const sendPushNotification = async (userId, title, body) => {
    console.log(`🔔 PUSH NOTIFICATION for ${userId}`);
    console.log(`   Title: ${title}`);
    console.log(`   Body: ${body}`);

    // In production:
    // await admin.messaging().send({ token: userFCMToken, notification: { title, body } });

    return { success: true, timestamp: new Date() };
};

// ═══════════════════════════════════════════════════════
// AUTHENTICATOR APP NOTIFICATION SERVICE
// ═══════════════════════════════════════════════════════

/**
 * Authenticator notification store
 * These are secure notifications that appear in the SecureCare+ 
 * authenticator-linked section, requiring MFA to acknowledge.
 */
const authenticatorNotifications = new Map(); // userId -> [notifications]

const addAuthenticatorNotification = (userId, notification) => {
    if (!authenticatorNotifications.has(userId)) {
        authenticatorNotifications.set(userId, []);
    }
    const notif = {
        id: `auth_notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...notification,
        requiresMFA: true,
        acknowledged: false,
        createdAt: new Date()
    };
    authenticatorNotifications.get(userId).push(notif);
    return notif;
};

const getAuthenticatorNotifications = (userId) => {
    return authenticatorNotifications.get(userId) || [];
};

const acknowledgeAuthenticatorNotification = (userId, notifId) => {
    const notifs = authenticatorNotifications.get(userId) || [];
    const notif = notifs.find(n => n.id === notifId);
    if (notif) {
        notif.acknowledged = true;
        notif.acknowledgedAt = new Date();
    }
    return notif;
};

// ═══════════════════════════════════════════════════════
// STEP 1: IMMEDIATE NOTIFICATION (All Channels)
// ═══════════════════════════════════════════════════════

/**
 * Send initial deletion request notifications via all channels
 */
const sendDeletionRequestNotifications = async (deletionRequest) => {
    const { userId, userEmail, scheduledDeletionDate } = deletionRequest;
    const formattedDate = formatDate(scheduledDeletionDate);
    const notificationResults = [];

    const message = `Your account deletion request has been received. Your account will be permanently deleted on ${formattedDate}. You can cancel within 7 days by logging in again.`;

    // 1. In-App Notification
    try {
        const inAppNotif = addInAppNotification(userId, {
            type: "DELETION_REQUEST",
            title: "⚠️ Account Deletion Scheduled",
            message,
            severity: "critical",
            actionUrl: "/patient/dashboard?tab=privacy"
        });
        notificationResults.push({
            type: "IN_APP",
            stage: "INITIAL",
            sentAt: new Date(),
            message,
            delivered: true
        });
        console.log(`✅ In-app notification sent to ${userId}`);
    } catch (err) {
        console.error(`❌ In-app notification failed for ${userId}:`, err);
        notificationResults.push({ type: "IN_APP", stage: "INITIAL", sentAt: new Date(), message, delivered: false });
    }

    // 2. Email Notification
    try {
        await sendEmailNotification(
            userEmail,
            "⚠️ SecureCare+ Account Deletion Scheduled",
            `<h2>Account Deletion Request Received</h2>
       <p>${message}</p>
       <p><strong>Scheduled Deletion Date:</strong> ${formattedDate}</p>
       <p>If you did not request this, please log in immediately to cancel the deletion.</p>
       <hr/>
       <p style="color:#888;">SecureCare+ Healthcare System — Secure. Compliant. Private.</p>`
        );
        notificationResults.push({ type: "EMAIL", stage: "INITIAL", sentAt: new Date(), message, delivered: true });
    } catch (err) {
        console.error(`❌ Email notification failed for ${userId}:`, err);
        notificationResults.push({ type: "EMAIL", stage: "INITIAL", sentAt: new Date(), message, delivered: false });
    }

    // 3. Push Notification
    try {
        await sendPushNotification(
            userId,
            "⚠️ Account Deletion Scheduled",
            message
        );
        notificationResults.push({ type: "PUSH", stage: "INITIAL", sentAt: new Date(), message, delivered: true });
    } catch (err) {
        console.error(`❌ Push notification failed for ${userId}:`, err);
        notificationResults.push({ type: "PUSH", stage: "INITIAL", sentAt: new Date(), message, delivered: false });
    }

    // 4. Authenticator App Notification
    try {
        addAuthenticatorNotification(userId, {
            type: "DELETION_REQUEST",
            title: "🔐 Account Deletion Request",
            message: `Your SecureCare+ account is scheduled for deletion on ${formattedDate}. MFA verification required to confirm.`,
            severity: "critical",
            actionRequired: "VERIFY_MFA_TO_CONFIRM"
        });
        notificationResults.push({ type: "AUTHENTICATOR", stage: "INITIAL", sentAt: new Date(), message, delivered: true });
    } catch (err) {
        console.error(`❌ Authenticator notification failed for ${userId}:`, err);
        notificationResults.push({ type: "AUTHENTICATOR", stage: "INITIAL", sentAt: new Date(), message, delivered: false });
    }

    // Update deletion request with notification history
    deletionRequest.notificationHistory.push(...notificationResults);
    deletionRequest.deletionNotificationSent = true;
    await deletionRequest.save();

    // Audit log
    await logAuditEvent({
        userId,
        action: "DELETION_NOTIFICATIONS_SENT",
        resource: "/deletion/notifications",
        method: "POST",
        outcome: "SUCCESS",
        details: {
            channels: notificationResults.map(n => n.type),
            allDelivered: notificationResults.every(n => n.delivered),
            scheduledDeletionDate
        },
        complianceCategory: "GDPR"
    });

    return notificationResults;
};

// ═══════════════════════════════════════════════════════
// STEP 2: MFA CONFIRMATION NOTIFICATION
// ═══════════════════════════════════════════════════════

/**
 * Send MFA confirmation notification to authenticator
 */
const sendMFAConfirmationNotification = async (deletionRequest) => {
    const { userId, userEmail, scheduledDeletionDate } = deletionRequest;
    const formattedDate = formatDate(scheduledDeletionDate);
    const daysRemaining = getDaysRemaining(scheduledDeletionDate);

    // Authenticator notification
    addAuthenticatorNotification(userId, {
        type: "MFA_CONFIRMED",
        title: "✅ Deletion Confirmed via MFA",
        message: `Your account deletion has been confirmed with MFA verification. Account will be permanently deleted on ${formattedDate}. ${daysRemaining} days remaining.`,
        severity: "warning"
    });

    // In-App notification
    addInAppNotification(userId, {
        type: "MFA_CONFIRMED",
        title: "✅ Deletion Confirmed",
        message: `MFA verification successful. Your account will be deleted on ${formattedDate}.`,
        severity: "warning"
    });

    // Email confirmation
    await sendEmailNotification(
        userEmail,
        "✅ Deletion Confirmed — SecureCare+",
        `<h2>Deletion Confirmed with MFA</h2>
     <p>Your account deletion has been verified with your authenticator app.</p>
     <p><strong>Permanent deletion on:</strong> ${formattedDate}</p>
     <p>You can still cancel by logging in within the next ${daysRemaining} days.</p>`
    );

    // Update notification history
    deletionRequest.notificationHistory.push(
        { type: "AUTHENTICATOR", stage: "MFA_CONFIRMATION", sentAt: new Date(), message: "MFA confirmation sent", delivered: true },
        { type: "IN_APP", stage: "MFA_CONFIRMATION", sentAt: new Date(), message: "MFA confirmation sent", delivered: true },
        { type: "EMAIL", stage: "MFA_CONFIRMATION", sentAt: new Date(), message: "MFA confirmation email sent", delivered: true }
    );
    await deletionRequest.save();

    await logAuditEvent({
        userId,
        action: "DELETION_MFA_CONFIRMED_NOTIFICATIONS",
        resource: "/deletion/mfa-confirmed",
        method: "POST",
        outcome: "SUCCESS",
        complianceCategory: "GDPR"
    });
};

// ═══════════════════════════════════════════════════════
// STEP 3: 24-HOUR REMINDER NOTIFICATION
// ═══════════════════════════════════════════════════════

/**
 * Send 24-hour reminder before permanent deletion
 */
const sendReminderNotifications = async (deletionRequest) => {
    const { userId, userEmail, scheduledDeletionDate } = deletionRequest;
    const formattedDate = formatDate(scheduledDeletionDate);

    const message = "Your account will be permanently deleted tomorrow. This action cannot be undone.";

    // In-App
    addInAppNotification(userId, {
        type: "DELETION_REMINDER",
        title: "🚨 FINAL WARNING: Account Deletion Tomorrow",
        message,
        severity: "critical"
    });

    // Email
    await sendEmailNotification(
        userEmail,
        "🚨 FINAL WARNING: Your SecureCare+ Account Will Be Deleted Tomorrow",
        `<h2 style="color:red;">⚠️ Final Reminder</h2>
     <p><strong>${message}</strong></p>
     <p>Scheduled deletion: ${formattedDate}</p>
     <p>To cancel, log in to your account immediately.</p>
     <hr/>
     <p style="color:#888;">This is your last reminder. After deletion, all personal data will be anonymized.</p>`
    );

    // Push
    await sendPushNotification(userId, "🚨 Account Deletion Tomorrow", message);

    // Authenticator
    addAuthenticatorNotification(userId, {
        type: "DELETION_REMINDER",
        title: "🚨 Final Deletion Reminder",
        message: `${message} Scheduled: ${formattedDate}`,
        severity: "critical"
    });

    // Update deletion request
    deletionRequest.lastReminderSentAt = new Date();
    deletionRequest.status = "REMINDER_SENT";
    deletionRequest.notificationHistory.push(
        { type: "IN_APP", stage: "REMINDER_24H", sentAt: new Date(), message, delivered: true },
        { type: "EMAIL", stage: "REMINDER_24H", sentAt: new Date(), message, delivered: true },
        { type: "PUSH", stage: "REMINDER_24H", sentAt: new Date(), message, delivered: true },
        { type: "AUTHENTICATOR", stage: "REMINDER_24H", sentAt: new Date(), message, delivered: true }
    );
    await deletionRequest.save();

    await logAuditEvent({
        userId,
        action: "DELETION_24H_REMINDER_SENT",
        resource: "/deletion/reminder",
        method: "POST",
        outcome: "SUCCESS",
        details: { scheduledDeletionDate },
        complianceCategory: "GDPR"
    });
};

// ═══════════════════════════════════════════════════════
// STEP 4: FINAL DELETION CONFIRMATION NOTIFICATION
// ═══════════════════════════════════════════════════════

/**
 * Send final confirmation after permanent deletion
 */
const sendFinalDeletionNotifications = async (deletionRequest) => {
    const { userId, userEmail } = deletionRequest;

    const message = "Your SecureCare+ account has been permanently deleted. If this was not you, contact support immediately.";

    // Email (this is the only reliable channel after account deletion)
    await sendEmailNotification(
        userEmail,
        "Account Permanently Deleted — SecureCare+",
        `<h2>Account Permanently Deleted</h2>
     <p>${message}</p>
     <p>All personal data has been anonymized in accordance with GDPR and HIPAA regulations.</p>
     <p>Medical records have been anonymized for compliance retention.</p>
     <hr/>
     <p><strong>If this was not you:</strong> Contact support immediately at support@securecare.plus</p>
     <p style="color:#888;">SecureCare+ Healthcare System</p>`
    );

    // Update
    deletionRequest.finalDeletionNotificationSent = true;
    deletionRequest.notificationHistory.push(
        { type: "EMAIL", stage: "FINAL_DELETION", sentAt: new Date(), message, delivered: true }
    );
    await deletionRequest.save();

    await logAuditEvent({
        userId,
        action: "DELETION_FINAL_NOTIFICATION_SENT",
        resource: "/deletion/final",
        method: "POST",
        outcome: "SUCCESS",
        complianceCategory: "GDPR"
    });
};

// ═══════════════════════════════════════════════════════
// CANCELLATION NOTIFICATION
// ═══════════════════════════════════════════════════════

/**
 * Send notifications when deletion is cancelled
 */
const sendCancellationNotifications = async (deletionRequest) => {
    const { userId, userEmail } = deletionRequest;

    const message = "Your account deletion request has been successfully cancelled. Your account is now fully active.";

    addInAppNotification(userId, {
        type: "DELETION_CANCELLED",
        title: "✅ Deletion Cancelled",
        message,
        severity: "success"
    });

    await sendEmailNotification(
        userEmail,
        "✅ Account Deletion Cancelled — SecureCare+",
        `<h2>Deletion Request Cancelled</h2>
     <p>${message}</p>
     <p>Your account, data, and sessions remain intact.</p>`
    );

    addAuthenticatorNotification(userId, {
        type: "DELETION_CANCELLED",
        title: "✅ Deletion Cancelled",
        message,
        severity: "success"
    });

    await logAuditEvent({
        userId,
        action: "DELETION_CANCELLATION_NOTIFIED",
        resource: "/deletion/cancel",
        method: "POST",
        outcome: "SUCCESS",
        complianceCategory: "GDPR"
    });
};

module.exports = {
    // Notification senders
    sendDeletionRequestNotifications,
    sendMFAConfirmationNotification,
    sendReminderNotifications,
    sendFinalDeletionNotifications,
    sendCancellationNotifications,

    // In-App notification management
    addInAppNotification,
    getInAppNotifications,
    markNotificationRead,
    clearUserNotifications,

    // Authenticator notification management
    addAuthenticatorNotification,
    getAuthenticatorNotifications,
    acknowledgeAuthenticatorNotification,

    // Utility
    getDaysRemaining,
    formatDate
};
