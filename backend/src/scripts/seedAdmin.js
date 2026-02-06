/**
 * Seed Admin User Script
 * Run with: node src/scripts/seedAdmin.js
 * 
 * Creates a single admin user if one doesn't exist.
 * Admin credentials: A001 / admin123
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const ADMIN_USER = {
    userId: "A001",
    email: "admin@securecare.com",
    password: "admin123",
    firstName: "System",
    lastName: "Administrator",
    role: "ADMIN",
    status: "ACTIVE"
};

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: "ADMIN" });
        if (existingAdmin) {
            console.log(`Admin user already exists: ${existingAdmin.userId}`);
            console.log("Only one admin is allowed. Exiting.");
            process.exit(0);
        }

        // Check if userId is taken
        const existingUserId = await User.findOne({ userId: ADMIN_USER.userId });
        if (existingUserId) {
            console.log(`User ID ${ADMIN_USER.userId} already exists but is not an admin.`);
            console.log("Updating user to ADMIN role...");
            existingUserId.role = "ADMIN";
            await existingUserId.save();
            console.log("User updated to ADMIN successfully!");
            process.exit(0);
        }

        // Create new admin user
        const passwordHash = await bcrypt.hash(ADMIN_USER.password, 12);
        
        const admin = new User({
            userId: ADMIN_USER.userId,
            email: ADMIN_USER.email,
            passwordHash,
            firstName: ADMIN_USER.firstName,
            lastName: ADMIN_USER.lastName,
            role: ADMIN_USER.role,
            status: ADMIN_USER.status
        });

        await admin.save();
        
        console.log("=================================");
        console.log("Admin user created successfully!");
        console.log("=================================");
        console.log(`User ID:  ${ADMIN_USER.userId}`);
        console.log(`Password: ${ADMIN_USER.password}`);
        console.log(`Email:    ${ADMIN_USER.email}`);
        console.log("=================================");
        console.log("Please change the password after first login!");
        
        process.exit(0);
    } catch (error) {
        console.error("Error seeding admin:", error);
        process.exit(1);
    }
}

seedAdmin();
