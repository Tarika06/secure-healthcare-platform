const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function run() {
    console.log("Connecting to:", process.env.MONGO_URI);
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("Connected!");

        // Use raw collection to bypass any schema defaults or hooks
        const collection = mongoose.connection.db.collection('users');
        const res = await collection.updateMany({}, { $set: { lastActive: null, isOnline: false } });

        console.log("Successfully reset users:", res.modifiedCount);
        process.exit(0);
    } catch (err) {
        console.error("Failed:", err.message);
        process.exit(1);
    }
}
run();
