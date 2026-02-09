const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const resetLogs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        await AuditLog.deleteMany({});
        console.log("✅ Audit Logs collection cleared.");

        process.exit(0);
    } catch (error) {
        console.error("Error clearing logs:", error);
        process.exit(1);
    }
};

resetLogs();
