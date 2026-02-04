const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    action: { type: String, required: true },
    resource: { type: String },
    httpMethod: { type: String },
    outcome: { type: String },
    reason: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AuditLog", AuditLogSchema);
