const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const tamperLogs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        // Find a random log
        const log = await AuditLog.findOne();
        if (!log) {
            console.log("No logs found to tamper with. Generate some logs first!");
            process.exit(0);
        }

        console.log(`Original Outcome: ${log.outcome}`);

        // Bypass Mongoose middleware by using native driver or logic that might bypass (though our middleware is on schema)
        // Actually, our middleware throws error on 'updateOne'.
        // We need to use 'findOneAndUpdate' with bypass or direct mongo driver to simulate a "DB Admin" hacking it.
        // Or simpler: disable the middleware for a second? No, that requires code change.
        // Let's try to update using a method that might NOT trigger the specific hooks if we are not careful?
        // standard `updateOne` triggers it.

        // To simulate a REAL attack, someone would go to the DB directly.
        // We can simulate this by using the native driver which bypasses Mongoose middleware.

        const collection = mongoose.connection.collection('auditlogs');
        await collection.updateOne(
            { _id: log._id },
            { $set: { outcome: "HACKED_SUCCESS", reason: "Tampered by Script" } }
        );

        console.log(`😈 TAMPERING COMPLETE! Modified log ${log._id}`);
        console.log("Now run 'node src/scripts/verifyLogs.js' to detect this change.");

        process.exit(0);
    } catch (error) {
        console.error("Tampering failed:", error);
        process.exit(1);
    }
};

tamperLogs();
