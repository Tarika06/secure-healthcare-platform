const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');

class LoggerService {
    /**
     * Calculate SHA-256 hash of data
     * @param {Object} data - Data to hash
     * @returns {string} - Hex string of hash
     */
    // Simple Mutex for serialization
    static _logQueue = Promise.resolve();

    /**
     * Recursively sort object keys for deterministic stringification
     */
    static sortObject(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (obj instanceof Date) {
            return obj.toISOString();
        }
        if (Array.isArray(obj)) {
            return obj.map(this.sortObject.bind(this));
        }
        return Object.keys(obj).sort().reduce((sorted, key) => {
            sorted[key] = this.sortObject(obj[key]);
            return sorted;
        }, {});
    }

    /**
     * Calculate SHA-256 hash of data
     * @param {Object} data - Data to hash
     * @returns {string} - Hex string of hash
     */
    static calculateHash(data) {
        // Deep sort the object to ensure deterministic stringification
        const sortedData = this.sortObject(data);
        const jsonString = JSON.stringify(sortedData);
        // console.log("DEBUG_HASH:", jsonString); // Uncomment to debug creation vs verify
        return crypto.createHash('sha256').update(jsonString).digest('hex');
    }

    /**
     * Log an action with cryptographic chaining
     * @param {Object} logEntry - Log data (userId, action, etc.)
     */
    static async log(logEntry) {
        // Serialize execution to prevent race conditions (forked chains)
        this._logQueue = this._logQueue.then(async () => {
            try {
                // 1. Get the last log entry to retrieve its hash
                const lastLog = await AuditLog.findOne().sort({ timestamp: -1 });

                const previousHash = lastLog ? lastLog.hash : "0"; // Genesis hash is "0"

                // 2. Prepare data for hashing
                const timestamp = new Date();

                const entryToHash = {
                    ...logEntry,
                    timestamp: timestamp.toISOString(),
                    previousHash
                };

                const hash = this.calculateHash(entryToHash);

                // 3. Create the new log entry
                const newLog = new AuditLog({
                    ...logEntry,
                    timestamp,
                    previousHash,
                    hash
                });

                await newLog.save();
                console.log(`[LoggerService] Log created: ${hash}`);
                return newLog;

            } catch (error) {
                console.error("[LoggerService] Failed to create log:", error);
                throw error;
            }
        }).catch(err => {
            console.error("[LoggerService] Queue Error:", err);
        });

        return this._logQueue;
    }

    /**
     * Verify the integrity of the log chain
     * @returns {Promise<Object>} - Verification result
     */
    static async verifyChain() {
        // Use .lean() to get POJOs, avoiding Mongoose document wrapper issues with JSON.stringify
        const logs = await AuditLog.find().sort({ timestamp: 1 }).lean();
        let previousHash = "0";
        let valid = true;
        const errors = [];

        for (let i = 0; i < logs.length; i++) {
            const log = logs[i];

            // 1. Check if previousHash matches
            if (log.previousHash !== previousHash) {
                valid = false;
                errors.push(`Broken chain at index ${i} (ID: ${log._id}). Expected prevHash: ${previousHash}, Found: ${log.previousHash}`);
            }

            // 2. Re-calculate hash to check for content tampering
            // We need to reconstruct exactly what was hashed. 
            // Note: The 'hash' field in DB is the result of hashing fields.
            // We must exclude 'hash' '_id' '__v' from the object we verify, AND 'timestamp' must match formatted string if we formatted it before.
            // In log() we did: entryToHash = { ...logEntry, timestamp: isoString, previousHash }

            // Construct object from DB document
            const dataToVerify = {
                userId: log.userId,
                role: log.role,
                action: log.action,
                resource: log.resource,
                httpMethod: log.httpMethod,
                outcome: log.outcome,
                reason: log.reason,
                targetUserId: log.targetUserId,
                details: log.details,
                complianceCategory: log.complianceCategory,
                ipAddress: log.ipAddress,
                userAgent: log.userAgent,
                timestamp: log.timestamp.toISOString(),
                previousHash: log.previousHash
            };

            // Remove undefined fields that might not be in DB but were in original object? 
            // Actually, JSON.stringify(dbDocument) might include extra mongoose stuff.
            // safer to pick fields.
            // Also note: `logEntry` passed to `log()` might have had fewer fields.
            // `JSON.stringify(data, Object.keys(data).sort())` is key. 
            // We need to make sure we only hash non-null fields if the original `logEntry` only had non-nulls.
            // However, Mongoose might save nulls/defaults.
            // Let's rely on Mongoose document toObject() but be careful.

            // Refined approach for verify:
            // We need to know EXACTLY what fields were hashed.
            // Simplified for this implementation: We hash the properties that are stored.

            // Let's create a clean object of defined properties
            const cleanObj = {};
            const fields = ['userId', 'role', 'action', 'resource', 'httpMethod',
                'outcome', 'reason', 'targetUserId', 'details',
                'complianceCategory', 'ipAddress', 'userAgent', 'previousHash'];

            fields.forEach(f => {
                if (log[f] !== undefined) cleanObj[f] = log[f];
            });
            cleanObj.timestamp = log.timestamp.toISOString();

            const calculatedHash = this.calculateHash(cleanObj);

            if (calculatedHash !== log.hash) {
                valid = false;
                errors.push(`Data tampering at index ${i} (ID: ${log._id}). Calculated: ${calculatedHash}, Stored: ${log.hash}`);

                // Debug: Show what we verified vs what might have been stored
                console.log(`--- DEBUG MISMATCH Index ${i} ---`);
                console.log("Calculated String:", JSON.stringify(this.sortObject(cleanObj)));
                // We can't see the original stored string, but this shows what WE think it is.
            }

            previousHash = log.hash;
        }

        return { valid, count: logs.length, errors };
    }
}

module.exports = LoggerService;
