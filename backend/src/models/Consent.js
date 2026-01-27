const mongoose = require("mongoose");

const ConsentSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true,
        index: true
    },
    doctorId: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ["PENDING", "ACTIVE", "DENIED", "REVOKED"],
        default: "PENDING"
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    respondedAt: {
        type: Date
    },
    expiresAt: {
        type: Date
    },
    purpose: {
        type: String,
        default: "Access to medical records"
    }
});

// Compound index for efficient queries
ConsentSchema.index({ patientId: 1, doctorId: 1 });

module.exports = mongoose.model("Consent", ConsentSchema);
