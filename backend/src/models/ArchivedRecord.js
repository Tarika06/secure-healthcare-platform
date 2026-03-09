const mongoose = require("mongoose");

const ArchivedRecordSchema = new mongoose.Schema({
    originalId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    patientId: {
        type: String,
        required: true,
        index: true
    },
    recordType: String,
    title: String,
    diagnosis: String,
    details: String,
    prescription: String,
    createdBy: String,
    recordCreatedAt: Date,
    archivedAt: {
        type: Date,
        default: Date.now
    },
    metadata: Object,
    careNotes: Array,
    archiveReason: {
        type: String,
        default: "INACTIVITY_AUTO_ARCHIVE"
    }
}, { timestamps: true });

module.exports = mongoose.model("ArchivedRecord", ArchivedRecordSchema);
