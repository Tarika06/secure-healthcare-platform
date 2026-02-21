const mongoose = require("mongoose");

const MedicalRecordSchema = new mongoose.Schema({
    patientId: {
        type: String,
        required: true,
        index: true
    },
    recordType: {
        type: String,
        enum: ["LAB_RESULT", "PRESCRIPTION", "DIAGNOSIS", "IMAGING", "VITALS", "GENERAL"],
        default: "GENERAL"
    },
    title: {
        type: String,
        required: true
    },
    diagnosis: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    prescription: {
        type: String,
        default: ""
    },
    createdBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: Object,
        default: {}
    },
    careNotes: [{
        note: { type: String, required: true },
        addedBy: { type: String, required: true },
        addedAt: { type: Date, default: Date.now }
    }],
    rectification: {
        status: {
            type: String,
            enum: ["NONE", "REQUESTED", "FIXED", "DECLINED"],
            default: "NONE"
        },
        patientNote: String,
        doctorResponse: String,
        requestedAt: Date,
        resolvedAt: Date
    }
});

module.exports = mongoose.model("MedicalRecord", MedicalRecordSchema);
