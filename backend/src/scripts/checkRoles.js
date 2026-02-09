const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        // Find users with 'Doctor' in name or 'D' in ID
        const users = await User.find({
            $or: [
                { firstName: /Doctor/i },
                { lastName: /Doctor/i },
                { role: 'DOCTOR' }
            ]
        });

        console.log("\n--- USER ROLES AUDIT ---");
        users.forEach(u => {
            console.log(`User: ${u.firstName} ${u.lastName} (ID: ${u.userId})`);
            console.log(`Role: [${u.role}]  Status: ${u.status}`);
            console.log("-----------------------------------");
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkUsers();
