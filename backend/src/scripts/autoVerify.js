const mongoose = require('mongoose');
const path = require('path');
// Use explicit paths
const LoggerService = require(path.join(__dirname, '../services/LoggerService'));
const AuditLog = require(path.join(__dirname, '../models/AuditLog'));
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

console.log("Starting Auto-Verification...");
console.log("DB URI:", process.env.MONGO_URI ? "Found" : "Missing");

const runAutoVerification = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("❌ Error: MONGO_URI not found in .env");
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🔌 Connected to MongoDB.");

        // 1. Reset
        console.log("\n🧹 Step 1: Cleaning old logs...");
        await AuditLog.deleteMany({});
        console.log("✅ Logs cleared.");

        // 2. Generate Valid Logs
        console.log("\n📝 Step 2: Generating 3 valid audit logs...");
        // Log 1
        await LoggerService.log({
            userId: "TEST_USER",
            action: "LOGIN",
            outcome: "SUCCESS",
            ipAddress: "127.0.0.1",
            complianceCategory: "SECURITY"
        });
        // Log 2
        await LoggerService.log({
            userId: "TEST_USER",
            action: "VIEW_RECORD",
            resource: "REC_123",
            details: { patientId: "P001" },
            complianceCategory: "HIPAA"
        });
        // Log 3
        await LoggerService.log({
            userId: "TEST_USER",
            action: "LOGOUT",
            outcome: "SUCCESS",
            complianceCategory: "SECURITY"
        });
        console.log("✅ Logs generated.");

        // 3. Verify (Should Pass)
        console.log("\n🔍 Step 3: Verifying integrity (Expect PASS)...");
        const initialCheck = await LoggerService.verifyChain();
        if (initialCheck.valid) {
            console.log(`✅ PASS: Chain is valid. (${initialCheck.count} logs verified)`);
        } else {
            console.error("❌ FAIL: Chain should be valid but failed!");
            initialCheck.errors.forEach(e => console.error(e));
            process.exit(1);
        }

        // 4. Tamper
        console.log("\n😈 Step 4: Simulating Attack (Tampering with 2nd log)...");
        const logs = await AuditLog.find().sort({ timestamp: 1 });
        if (logs.length < 2) {
            console.error("Not enough logs to tamper.");
            process.exit(1);
        }
        const targetLog = logs[1];

        // Direct DB update to bypass application logic
        await mongoose.connection.collection('auditlogs').updateOne(
            { _id: targetLog._id },
            { $set: { outcome: "TAMPERED_FAILURE" } }
        );
        console.log(`✅ Tampering complete on Log ID: ${targetLog._id}`);

        // 5. Verify (Should Fail)
        console.log("\n🔍 Step 5: Verifying integrity (Expect FAIL)...");
        const finalCheck = await LoggerService.verifyChain();
        if (!finalCheck.valid) {
            console.log("✅ PASS (Expected Failure): Integrity violations successfully detected!");
            console.log(`   - Detected ${finalCheck.errors.length} violations.`);
            console.log(`   - Sample Error: ${finalCheck.errors[0]}`);
        } else {
            console.error("❌ FAIL: System failed to detect tampering!");
            process.exit(1);
        }

        console.log("\n🎉 CONGRATULATIONS: Immutable Log System is Fully Functional!");
        process.exit(0);

    } catch (error) {
        console.error("Error during auto-verification:", error);
        process.exit(1);
    }
};

runAutoVerification();
