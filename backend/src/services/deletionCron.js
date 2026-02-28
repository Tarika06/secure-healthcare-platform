/**
 * Deletion Cron Job
 * 
 * Background job that runs periodically to:
 * 1. Send 24-hour reminder notifications for deletions expiring tomorrow
 * 2. Execute permanent deletions for requests past the 7-day window
 * 
 * In production, use node-cron or a task scheduler like Bull/Agenda.
 * This implementation uses setInterval for simplicity.
 */

const DeletionRequest = require("../models/DeletionRequest");
const deletionService = require("../services/deletionService");
const notificationService = require("../services/notificationService");
const archivalService = require("../services/archivalService");
const { logAuditEvent } = require("../services/auditService");

// Check interval: every 1 hour
const CRON_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Process 24-hour reminders
 * Find deletion requests that are due within the next 24 hours
 * and haven't had a reminder sent yet.
 */
const processReminders = async () => {
    try {
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Find requests that:
        // - Are MFA verified
        // - Scheduled deletion is within the next 24 hours
        // - Haven't had a reminder sent yet
        const dueForReminder = await DeletionRequest.find({
            status: "MFA_VERIFIED",
            scheduledDeletionDate: { $lte: in24Hours, $gt: now },
            lastReminderSentAt: null
        });

        console.log(`⏰ Deletion Cron: ${dueForReminder.length} accounts due for 24h reminder`);

        for (const request of dueForReminder) {
            try {
                await notificationService.sendReminderNotifications(request);
                console.log(`  📧 Reminder sent for user: ${request.userId}`);
            } catch (error) {
                console.error(`  ❌ Failed to send reminder for ${request.userId}:`, error);
            }
        }
    } catch (error) {
        console.error("❌ Cron: Error processing reminders:", error);
    }
};

/**
 * Process permanent deletions
 * Find deletion requests past the scheduled date and execute them.
 */
const processPermanentDeletions = async () => {
    try {
        const now = new Date();

        // Find requests that:
        // - Are verified or reminded
        // - Past the scheduled deletion date
        const dueForDeletion = await DeletionRequest.find({
            status: { $in: ["MFA_VERIFIED", "REMINDER_SENT"] },
            scheduledDeletionDate: { $lte: now }
        });

        console.log(`🗑️ Deletion Cron: ${dueForDeletion.length} accounts due for permanent deletion`);

        for (const request of dueForDeletion) {
            try {
                await deletionService.executePermanentDeletion(request._id);
                console.log(`  ✅ Permanently deleted user: ${request.userId}`);
            } catch (error) {
                console.error(`  ❌ Failed to delete ${request.userId}:`, error);
            }
        }
    } catch (error) {
        console.error("❌ Cron: Error processing permanent deletions:", error);
    }
};

/**
 * Process expired PENDING_MFA requests (no MFA verification after 48 hours)
 * Auto-cancel requests where user never confirmed with MFA
 */
const processExpiredPendingRequests = async () => {
    try {
        const expiryThreshold = new Date();
        expiryThreshold.setHours(expiryThreshold.getHours() - 48);

        const expiredPending = await DeletionRequest.find({
            status: "PENDING_MFA",
            requestedAt: { $lte: expiryThreshold }
        });

        console.log(`🕐 Deletion Cron: ${expiredPending.length} expired pending MFA requests`);

        for (const request of expiredPending) {
            try {
                request.status = "CANCELLED";
                request.cancelledAt = new Date();
                request.cancellationReason = "MFA verification expired (48 hours)";
                await request.save();

                await logAuditEvent({
                    userId: request.userId,
                    action: "DELETION_REQUEST_EXPIRED",
                    resource: "/deletion/cron",
                    method: "SYSTEM",
                    outcome: "SUCCESS",
                    details: { reason: "MFA not verified within 48 hours" },
                    complianceCategory: "GDPR"
                });

                console.log(`  ⏰ Auto-cancelled expired request for: ${request.userId}`);
            } catch (error) {
                console.error(`  ❌ Failed to expire request for ${request.userId}:`, error);
            }
        }
    } catch (error) {
        console.error("❌ Cron: Error processing expired requests:", error);
    }
};

/**
 * Process automated archival
 * Moves records inactive for 2+ years to cold storage
 */
const processAutomatedArchival = async () => {
    try {
        console.log("📦 Deletion Cron: Checking for inactive records to archive...");
        const result = await archivalService.archiveInactiveRecords(2); // Configurable threshold (2 years)
        if (result.archivedCount > 0) {
            console.log(`  ✅ Successfully moved ${result.archivedCount} records to cold storage.`);
        } else {
            console.log("  ℹ️ No inactive records found for archival.");
        }
    } catch (error) {
        console.error("❌ Cron: Error processing archival:", error);
    }
};

/**
 * Main cron job runner
 */
const runDeletionCron = async () => {
    console.log("\n═══════════════════════════════════════════");
    console.log("🔄 Deletion Cron Job Running:", new Date().toISOString());
    console.log("═══════════════════════════════════════════");

    await processReminders();
    await processPermanentDeletions();
    await processExpiredPendingRequests();
    await processAutomatedArchival();

    console.log("═══════════════════════════════════════════\n");
};

/**
 * Start the cron job with periodic intervals
 */
const startDeletionCron = () => {
    console.log("🕐 Deletion Cron Job scheduled (interval: 1 hour)");

    // Run immediately on startup
    setTimeout(() => runDeletionCron(), 5000);

    // Run periodically
    setInterval(runDeletionCron, CRON_INTERVAL_MS);
};

module.exports = {
    startDeletionCron,
    runDeletionCron,
    processReminders,
    processPermanentDeletions,
    processExpiredPendingRequests
};
