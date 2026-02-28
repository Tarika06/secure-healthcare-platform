require("dotenv").config();
const mongoose = require("mongoose");
const MedicalRecord = require("../src/models/MedicalRecord");
const ArchivedRecord = require("../src/models/ArchivedRecord");
const archivalService = require("../src/services/archivalService");

const testArchival = async () => {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected.");

        // 1. Create an inactive record (3 years old)
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

        const inactiveRecord = new MedicalRecord({
            patientId: "P-TEST-999",
            recordType: "GENERAL",
            title: "Archival Test Record",
            diagnosis: "Testing archival mechanism",
            details: "This record should be moved to cold storage.",
            createdBy: "A001",
            createdAt: threeYearsAgo
        });

        await inactiveRecord.save();
        console.log("✅ Created inactive record with date:", threeYearsAgo.toISOString());

        // 2. Trigger Archival
        console.log("Starting archival process...");
        const result = await archivalService.archiveInactiveRecords(2);
        console.log("✅ Archival result:", result);

        // 3. Verify in DB
        const stillInHot = await MedicalRecord.findById(inactiveRecord._id);
        const nowInCold = await ArchivedRecord.findOne({ originalId: inactiveRecord._id });

        if (!stillInHot && nowInCold) {
            console.log("✨ SUCCESS: Record was successfully moved to Cold Storage!");
            console.log("Archived Record ID:", nowInCold._id);
        } else {
            console.log("❌ FAILURE: Verification failed.");
        }

    } catch (error) {
        console.error("❌ Test failed:", error);
    } finally {
        await mongoose.connection.close();
        console.log("DB connection closed.");
    }
};

testArchival();
