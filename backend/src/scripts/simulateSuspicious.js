const mongoose = require('mongoose');
const path = require('path');
const LoggerService = require('../services/LoggerService');
const AuditLog = require('../models/AuditLog');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const simulateSuspiciousActivity = async () => {
    try {
        console.log("Connecting to MongoDB at:", process.env.MONGO_URI ? "URI found" : "URI MISSING");
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("Connected to MongoDB for simulation...");

        // 1. Simulate Brute Force (Multiple failed logins from one IP)
        console.log("Simulating Brute Force attack...");
        const attackerIp = "192.168.1.100";
        for (let i = 0; i < 7; i++) {
            await LoggerService.log({
                userId: "ADMIN_TARGET",
                action: "LOGIN_FAILURE",
                outcome: "FAILURE",
                reason: "INVALID_CREDENTIALS",
                ipAddress: attackerIp,
                complianceCategory: "SECURITY"
            });
        }

        // 2. Simulate Unauthorized Access Attempts (Repeated Denials)
        console.log("Simulating Unauthorized Access attempts...");
        const curiousUserId = "PATIENT_007";
        for (let i = 0; i < 4; i++) {
            await LoggerService.log({
                userId: curiousUserId,
                action: "ACCESS_DENIED",
                resource: "/api/admin/system/config",
                outcome: "DENIED",
                reason: "INSUFFICIENT_PERMISSIONS",
                complianceCategory: "SECURITY"
            });
        }

        // 3. Simulate Anomalous Data Access (Rapid viewing of many records)
        console.log("Simulating Anomalous Data Access...");
        const busyDoctorId = "DOCTOR_SMITH";
        for (let i = 0; i < 15; i++) {
            await LoggerService.log({
                userId: busyDoctorId,
                action: "VIEW_RECORD",
                resource: `/api/records/REC_${1000 + i}`,
                outcome: "SUCCESS",
                complianceCategory: "HIPAA",
                details: { patientId: `P_${2000 + i}` }
            });
        }

        console.log("Simulation complete. Logs populated.");
        process.exit(0);
    } catch (error) {
        console.error("Simulation failed:", error);
        process.exit(1);
    }
};

simulateSuspiciousActivity();
