/**
 * Check Admin User Script
 * Run with: node src/scripts/checkAdmin.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB\n");

        // Find all users with ADMIN role
        const admins = await User.find({ role: "ADMIN" }).select("-passwordHash");
        console.log("=== ADMIN USERS ===");
        if (admins.length === 0) {
            console.log("No admin users found!");
        } else {
            admins.forEach(admin => {
                console.log(`- User ID: ${admin.userId}`);
                console.log(`  Email: ${admin.email}`);
                console.log(`  Role: ${admin.role}`);
                console.log(`  Status: ${admin.status}`);
                console.log("");
            });
        }

        // Also check users that START with 'A' but might not have ADMIN role
        const aUsers = await User.find({ userId: /^A/i }).select("-passwordHash");
        console.log("=== USERS STARTING WITH 'A' ===");
        if (aUsers.length === 0) {
            console.log("No users with ID starting with 'A'");
        } else {
            aUsers.forEach(u => {
                console.log(`- User ID: ${u.userId}, Role: ${u.role}, Status: ${u.status}`);
            });
        }
        
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkAdmin();
