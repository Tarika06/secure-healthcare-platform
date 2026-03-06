const path = require("path");
// Point explicitly to backend/.env
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Test Users Configuration
const TEST_USERS = [
    { userId: "P005", role: "PATIENT", firstName: "Test", lastName: "Patient", email: "patient@test.com" },
    { userId: "D005", role: "DOCTOR", firstName: "Test", lastName: "Doctor", email: "doctor@test.com", specialty: "General" },
    { userId: "N005", role: "NURSE", firstName: "Test", lastName: "Nurse", email: "nurse@test.com" },
    { userId: "L005", role: "LAB_TECHNICIAN", firstName: "Test", lastName: "LabTech", email: "lab@test.com" },
    { userId: "A005", role: "ADMIN", firstName: "Test", lastName: "Admin", email: "admin@test.com" }
];

const COMMON_PASSWORD = "password123";

async function seedUsers() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not found in environment variables");
        }
        
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const passwordHash = await bcrypt.hash(COMMON_PASSWORD, 12);

        for (const user of TEST_USERS) {
            const exists = await User.findOne({ userId: user.userId });
            if (!exists) {
                await User.create({
                    ...user,
                    passwordHash,
                    status: "ACTIVE"
                });
                console.log(`Created ${user.role}: ${user.userId} / ${COMMON_PASSWORD}`);
            } else {
                console.log(`User ${user.userId} already exists.`);
            }
        }
        
        console.log("Seeding complete.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding users:", error.message);
        process.exit(1);
    }
}

seedUsers();
