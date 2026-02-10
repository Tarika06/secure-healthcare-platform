const mongoose = require('mongoose');
const MedicalRecord = require('../models/MedicalRecord');
require('dotenv').config();

const clearRecords = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        const result = await MedicalRecord.deleteMany({});
        console.log(`✅ Cleared ${result.deletedCount} medical records.`);
        console.log("Encryption keys were mismatched. New records will now encrypt correctly with the current key.");

        process.exit(0);
    } catch (error) {
        console.error("Failed to clear records:", error);
        process.exit(1);
    }
};

clearRecords();
