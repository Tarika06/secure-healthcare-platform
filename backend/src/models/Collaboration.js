const mongoose = require("mongoose");

const collaborationSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true,
        ref: "User"
    },
    requestingDoctorId: {
        type: String,
        required: true,
        ref: "User"
    },
    consultingDoctorId: {
        type: String,
        required: true,
        ref: "User"
    },
    accessScope: {
        type: String,
        enum: ["SUMMARY", "LAB_REPORTS", "PRESCRIPTIONS", "RADIOLOGY", "FULL"],
        default: "SUMMARY"
    },
    status: {
        type: String,
        enum: ["PENDING", "ACCEPTED", "DECLINED", "REVOKED", "EXPIRED"],
        default: "PENDING"
    },
    requestMessage: {
        type: String, // Encrypted
        required: true
    },
    expiresAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    acceptedAt: {
        type: Date
    }
}, { timestamps: true });

// Index for performance
collaborationSchema.index({ consultingDoctorId: 1, status: 1 });
collaborationSchema.index({ requestingDoctorId: 1, status: 1 });
collaborationSchema.index({ patientId: 1 });

module.exports = mongoose.model("Collaboration", collaborationSchema);
