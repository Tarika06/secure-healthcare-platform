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
    }
});

module.exports = mongoose.model("MedicalRecord", MedicalRecordSchema);
