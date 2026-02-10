const mongoose = require("mongoose");

const BlockedIPSchema = new mongoose.Schema({
    ipAddress: { type: String, required: true, unique: true, index: true },
    reason: { type: String },
    blockedBy: { type: String }, // Admin User ID
    blockedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }, // Optional: for temporary blocks
}, { timestamps: true });

module.exports = mongoose.model("BlockedIP", BlockedIPSchema);
