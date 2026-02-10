const mongoose = require('mongoose');
require('dotenv').config();

const test = async () => {
    try {
        console.log("Connecting...");
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 2000 });
        console.log("Connected!");
        const count = await mongoose.connection.db.collection('auditlogs').countDocuments();
        console.log("Count:", count);
        process.exit(0);
    } catch (e) {
        console.error("Error:", e.message);
        process.exit(1);
    }
};
test();
