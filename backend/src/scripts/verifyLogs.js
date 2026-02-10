const mongoose = require('mongoose');
const LoggerService = require('../services/LoggerService');
const AuditLog = require('../models/AuditLog');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const verifyLogs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/secure-healthcare");
        console.log("Connected to MongoDB for verification...");

        console.log("Starting Log Verification...");
        const result = await LoggerService.verifyChain();

        if (result.valid) {
            console.log(`✅ SUCCESS: All ${result.count} logs are valid. Chain is intact.`);
        } else {
            console.error(`❌ FAILURE: ${result.errors.length} integrity violations found!`);
            result.errors.forEach(err => console.error(`   - ${err}`));
        }

        process.exit(result.valid ? 0 : 1);
    } catch (error) {
        console.error("Verification script failed:", error);
        process.exit(1);
    }
};

verifyLogs();
