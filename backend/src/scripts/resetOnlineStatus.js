const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const resetStatus = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        const result = await User.updateMany({}, { isOnline: false });
        console.log(`✅ Reset online status for ${result.modifiedCount} users.`);

        process.exit(0);
    } catch (error) {
        console.error("Failed to reset status:", error);
        process.exit(1);
    }
};

resetStatus();
