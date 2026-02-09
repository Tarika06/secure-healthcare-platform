const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
require('dotenv').config();

const checkStatus = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        const total = await AuditLog.countDocuments();
        const withHash = await AuditLog.countDocuments({ hash: { $exists: true } });

        console.log(`Total Logs: ${total}`);
        console.log(`Logs with Hash: ${withHash}`);

        if (total > 0 && withHash === 0) {
            console.log("WARNING: Existing logs detected without hash. Verification will fail.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkStatus();
