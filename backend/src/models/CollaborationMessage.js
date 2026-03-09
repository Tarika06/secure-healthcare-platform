const mongoose = require("mongoose");

const collaborationMessageSchema = new mongoose.Schema({
    collaborationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Collaboration",
        required: true
    },
    senderId: {
        type: String,
        required: true,
        ref: "User"
    },
    message: {
        type: String, // Encrypted
        required: true
    },
    attachmentUrl: {
        type: String
    },
    attachmentName: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for conversation performance
collaborationMessageSchema.index({ collaborationId: 1, createdAt: 1 });

module.exports = mongoose.model("CollaborationMessage", collaborationMessageSchema);
