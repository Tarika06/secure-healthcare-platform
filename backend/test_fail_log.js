const mongoose = require('mongoose');
const auditService = require('./src/services/auditService');
require('dotenv').config();

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const testUserId = "NON_EXISTENT_USER_" + Date.now();
        console.log(`Simulating login failure for: ${testUserId}`);

        await auditService.logLoginFailure(testUserId, "Invalid credentials", "1.2.3.4", "TestAgent/1.0");

        const AuditLog = require('./src/models/AuditLog');
        const log = await AuditLog.findOne({ userId: testUserId });

        if (log) {
            console.log("✅ Success: Log found in MongoDB");
            console.log("Log Action:", log.action);
            console.log("Log IP:", log.ipAddress);
        } else {
            console.log("❌ Failure: Log NOT found in MongoDB");
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
runTest();
