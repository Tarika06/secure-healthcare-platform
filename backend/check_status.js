const mongoose = require('mongoose');
const User = require('./src/models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        const users = await User.find({ lastActive: { $ne: null } }).select('userId lastActive isOnline');
        console.log(`Users with lastActive: ${users.length}`);
        users.forEach(u => {
            console.log(`- ${u.userId}: lastActive=${u.lastActive}, isOnline=${u.isOnline}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Failed to check users:", error);
        process.exit(1);
    }
};

checkUsers();
