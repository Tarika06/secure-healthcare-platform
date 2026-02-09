const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    role: { type: String },
    action: { type: String, required: true, index: true },
    resource: { type: String },
    httpMethod: { type: String },
    outcome: { type: String, index: true },
    reason: { type: String },
    targetUserId: { type: String, index: true },
    details: { type: mongoose.Schema.Types.Mixed },
    complianceCategory: { type: String, enum: ["HIPAA", "GDPR", "INTERNAL", "SECURITY"], index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
    // Immutable Log Fields
    hash: { type: String, required: true, unique: true },
    previousHash: { type: String, required: true }
}, { minimize: false });

// Prevent updates and deletes to ensure immutability
AuditLogSchema.pre('updateOne', function (next) {
    const err = new Error('Audit logs are append-only. Updates are not allowed.');
    next(err);
});

AuditLogSchema.pre('findOneAndUpdate', function (next) {
    const err = new Error('Audit logs are append-only. Updates are not allowed.');
    next(err);
});

AuditLogSchema.pre('deleteOne', function (next) {
    const err = new Error('Audit logs are append-only. Deletions are not allowed.');
    next(err);
});

AuditLogSchema.pre('findOneAndDelete', function (next) {
    const err = new Error('Audit logs are append-only. Deletions are not allowed.');
    next(err);
});

module.exports = mongoose.model("AuditLog", AuditLogSchema);
