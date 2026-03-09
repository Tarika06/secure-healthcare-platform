/**
 * Archival Service
 * 
 * Handles moving inactive patient records from primary database (Hot Storage)
 * to an ArchivedRecords collection (Warm/Cold Storage) to optimize performance.
 */

const MedicalRecord = require("../models/MedicalRecord");
const ArchivedRecord = require("../models/ArchivedRecord");
const { logAuditEvent } = require("./auditService");

/**
 * Archive records older than a specific duration
 * @param {Number} yearsInactive - Threshold for archival in years
 */
const archiveInactiveRecords = async (yearsInactive = 2) => {
    try {
        const thresholdDate = new Date();
        thresholdDate.setFullYear(thresholdDate.getFullYear() - yearsInactive);

        // Find records that haven't been touched/created before the threshold
        const recordsToArchive = await MedicalRecord.find({
            createdAt: { $lte: thresholdDate }
        });

        if (recordsToArchive.length === 0) {
            return { archivedCount: 0, message: "No records found for archival." };
        }

        console.log(`📦 Archival: Found ${recordsToArchive.length} records to move to cold storage.`);

        let successCount = 0;
        for (const record of recordsToArchive) {
            try {
                // 1. Map to archive model
                const archiveData = {
                    originalId: record._id,
                    patientId: record.patientId,
                    recordType: record.recordType,
                    title: record.title,
                    diagnosis: record.diagnosis,
                    details: record.details,
                    prescription: record.prescription,
                    createdBy: record.createdBy,
                    recordCreatedAt: record.createdAt,
                    metadata: record.metadata,
                    careNotes: record.careNotes,
                    archiveReason: `AUTO_ARCHIVE_INACTIVITY_${yearsInactive}Y`
                };

                // 2. Save to Archived storage (Warm/Cold Storage)
                const archived = new ArchivedRecord(archiveData);
                await archived.save();

                // 3. Remove from Active database (Hot Storage)
                await MedicalRecord.findByIdAndDelete(record._id);

                successCount++;
            } catch (err) {
                console.error(`  ❌ Failed to archive record ${record._id}:`, err.message);
            }
        }

        if (successCount > 0) {
            await logAuditEvent({
                userId: "SYSTEM_CRON",
                action: "AUTO_ARCHIVE_COMPLETED",
                resource: "MedicalRecord",
                outcome: "SUCCESS",
                details: { recordsArchived: successCount, thresholdYears: yearsInactive },
                complianceCategory: "HIPAA"
            });
        }

        return {
            archivedCount: successCount,
            message: `Successfully archived ${successCount} records.`
        };
    } catch (error) {
        console.error("❌ Archival Error:", error);
        throw error;
    }
};

/**
 * Retrieve an archived record back to active storage (Un-archive)
 */
const restoreFromArchive = async (archiveId, requestedBy) => {
    try {
        const archived = await ArchivedRecord.findById(archiveId);
        if (!archived) throw new Error("Archived record not found");

        const activeRecord = new MedicalRecord({
            _id: archived.originalId,
            patientId: archived.patientId,
            recordType: archived.recordType,
            title: archived.title,
            diagnosis: archived.diagnosis,
            details: archived.details,
            prescription: archived.prescription,
            createdBy: archived.createdBy,
            createdAt: archived.recordCreatedAt,
            metadata: archived.metadata,
            careNotes: archived.careNotes
        });

        await activeRecord.save();
        await ArchivedRecord.findByIdAndDelete(archiveId);

        await logAuditEvent({
            userId: requestedBy,
            action: "RECORD_RESTORED_FROM_ARCHIVE",
            resource: "MedicalRecord",
            resourceId: activeRecord._id,
            outcome: "SUCCESS",
            details: { originalId: archived.originalId },
            complianceCategory: "HIPAA"
        });

        return activeRecord;
    } catch (error) {
        console.error("❌ Restoration Error:", error);
        throw error;
    }
};

module.exports = {
    archiveInactiveRecords,
    restoreFromArchive
};
