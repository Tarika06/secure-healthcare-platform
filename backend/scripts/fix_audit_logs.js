const mongoose = require('mongoose');
const AuditLog = require('../src/models/AuditLog');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

const fixAuditLogs = async () => {
    try {
        console.log("Connecting to MongoDB...");
        // Use the connection string from process.env or default
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/securecare';
        await mongoose.connect(mongoURI);
        console.log("Connected to MongoDB.");

        console.log("Checking for invalid AuditLogs...");

        // Find logs where hash is missing or empty
        const invalidLogs = await AuditLog.find({
            $or: [
                { hash: { $exists: false } },
                { hash: null },
                { hash: "" }
            ]
        });

        console.log(`Found ${invalidLogs.length} invalid audit logs.`);

        if (invalidLogs.length > 0) {
            console.log("Deleting invalid logs...");
            const result = await AuditLog.deleteMany({
                $or: [
                    { hash: { $exists: false } },
                    { hash: null },
                    { hash: "" }
                ]
            });
            console.log(`Deleted ${result.deletedCount} logs.`);
        } else {
            console.log("No invalid logs found.");
        }

        // Optional: clear all logs to reset chain if it's broken beyond repair
        // await AuditLog.deleteMany({});
        // console.log("CLEARED ALL LOGS FOR RESET");

    } catch (error) {
        console.error("Error fixing audit logs:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
};

fixAuditLogs();
