const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

router.post("/register", async (req, res) => {
  try {
    const { userId, email, password, firstName, lastName, role, specialty, acceptPrivacyPolicy } = req.body;

    // Validate required fields
    if (!userId || !email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate privacy policy acceptance
    if (!acceptPrivacyPolicy) {
      return res.status(400).json({ message: "You must accept the Privacy Policy & Data Processing terms" });
    }

    // Validate role
    if (!["PATIENT", "DOCTOR"].includes(role)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    // Validate userId prefix matches role
    const prefix = userId.charAt(0).toUpperCase();
    if ((role === "PATIENT" && prefix !== "P") || (role === "DOCTOR" && prefix !== "D")) {
      return res.status(400).json({
        message: `User ID must start with ${role === "PATIENT" ? "P" : "D"} for ${role} role`
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ userId }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "User ID or Email already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create new user
    const user = new User({
      userId,
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      specialty: role === "DOCTOR" ? (specialty || "") : "",
      status: "ACTIVE"
    });

    await user.save();

    res.status(201).json({
      message: "Registration successful",
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (e) {
    console.error("Registration error:", e);
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { userId, password } = req.body;

    const token = await authService.login(userId, password);

    res.json({ token });
  } catch (e) {
    res.status(401).json({ message: e.message });
  }
});

module.exports = router;
