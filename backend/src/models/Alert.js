const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ["SUSPICIOUS_LOGIN", "BRUTE_FORCE", "DATA_EXFILTRATION", "UNAUTHORIZED_ACCESS", "ANOMALY", "SYSTEM_HEALTH"],
        index: true
    },
    severity: {
        type: String,
        required: true,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        index: true
    },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    relatedLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AuditLog' }],
    status: {
        type: String,
        enum: ["OPEN", "INVESTIGATING", "RESOLVED", "DISMISSED"],
        default: "OPEN",
        index: true
    },
    aiAnalysis: {
        rawResponse: String,
        confidence: Number,
        detectedPatterns: [String],
        recommendation: String
    }
}, { timestamps: true });

module.exports = mongoose.model("Alert", AlertSchema);
