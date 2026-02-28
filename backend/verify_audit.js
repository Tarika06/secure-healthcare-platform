const mongoose = require('mongoose');
const auditService = require('./src/services/auditService');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function runTest() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        // 1. Create a test user if not exists
        const testUserId = "TEST_AUDIT_USER";
        let user = await User.findOne({ userId: testUserId });
        if (!user) {
            console.log("Creating test user...");
            const hash = await bcrypt.hash("password123", 12);
            user = new User({
                userId: testUserId,
                email: "test@audit.com",
                passwordHash: hash,
                firstName: "Test",
                lastName: "User",
                role: "PATIENT"
            });
            await user.save();
        }

        console.log("\n--- TESTING AUDIT LOGS ---");

        // 2. Simulate Success Log
        console.log("Simulating LOGIN_SUCCESS...");
        await auditService.logLoginSuccess(testUserId, "127.0.0.1", "TestBot/1.0");

        // 3. Simulate Failure Log
        console.log("Simulating LOGIN_FAILED...");
        await auditService.logLoginFailure(testUserId, "Invalid credentials", "127.0.0.1", "TestBot/1.0");

        // 4. Verify Logs in DB
        console.log("\nVerifying logs in database...");
        const AuditLog = require('./src/models/AuditLog');
        const recentLogs = await AuditLog.find({ userId: testUserId })
            .sort({ timestamp: -1 })
            .limit(2);

        recentLogs.forEach(log => {
            console.log(`\nLog Details:`);
            console.log(`- Action: ${log.action}`);
            console.log(`- Outcome: ${log.outcome}`);
            console.log(`- Reason: ${log.reason || 'N/A'}`);
            console.log(`- Timestamp: ${log.timestamp}`);
            console.log(`- Hash: ${log.hash.substring(0, 10)}...`);
        });

        const successExists = recentLogs.some(l => l.action === "LOGIN_SUCCESS" && l.outcome === "SUCCESS");
        const failureExists = recentLogs.some(l => l.action === "LOGIN_FAILED" && l.outcome === "FAILURE");

        if (successExists && failureExists) {
            console.log("\n✅ VERIFICATION SUCCESSFUL: Both success and failure logs are recorded correctly.");
        } else {
            console.log("\n❌ VERIFICATION FAILED: One or more log types missing.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Test failed with error:", error);
        process.exit(1);
    }
}

runTest();
