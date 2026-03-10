const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        ref: "User",
        index: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["INFO", "SUCCESS", "WARNING", "ERROR"],
        default: "INFO"
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 30 * 24 * 60 * 60 // Auto-delete after 30 days
    }
});

module.exports = mongoose.model("Notification", NotificationSchema);
