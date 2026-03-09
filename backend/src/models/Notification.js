const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
    {
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
        read: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Notification", NotificationSchema);
