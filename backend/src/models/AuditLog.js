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
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model("AuditLog", AuditLogSchema);
