const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Simple in-memory rate limiting for login attempts
// In production, use Redis or a proper rate-limiting library
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(userId) {
  const now = Date.now();
  const key = userId.toLowerCase();
  const attempts = loginAttempts.get(key);

  if (attempts) {
    // Clean up old attempts
    const recentAttempts = attempts.filter(time => now - time < LOCKOUT_DURATION_MS);
    loginAttempts.set(key, recentAttempts);

    if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
      const oldestAttempt = Math.min(...recentAttempts);
      const unlockTime = new Date(oldestAttempt + LOCKOUT_DURATION_MS);
      return { limited: true, unlockTime };
    }
  }

  return { limited: false };
}

function recordLoginAttempt(userId) {
  const key = userId.toLowerCase();
  const attempts = loginAttempts.get(key) || [];
  attempts.push(Date.now());
  loginAttempts.set(key, attempts);
}

function clearLoginAttempts(userId) {
  loginAttempts.delete(userId.toLowerCase());
}

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

    // Validate userId format (prefix + numbers only)
    const userIdPattern = /^[PD][0-9]+$/i;
    if (!userIdPattern.test(userId)) {
      return res.status(400).json({
        message: "User ID must be in format: P### or D### (letter followed by numbers only)"
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

    // Validate input
    if (!userId || !password) {
      return res.status(400).json({ message: "User ID and password are required" });
    }

    // Check rate limit
    const rateCheck = checkRateLimit(userId);
    if (rateCheck.limited) {
      return res.status(429).json({
        message: `Too many login attempts. Try again after ${rateCheck.unlockTime.toLocaleTimeString()}`
      });
    }

    // Record this attempt
    recordLoginAttempt(userId);

    const token = await authService.login(userId, password);

    // Clear attempts on successful login
    clearLoginAttempts(userId);

    res.json({ token });
  } catch (e) {
    // Use generic error message to avoid leaking info about valid userIds
    res.status(401).json({ message: "Invalid credentials" });
  }
});

module.exports = router;
