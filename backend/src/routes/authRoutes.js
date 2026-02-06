const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const auditService = require("../services/auditService");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Simple in-memory rate limiting for login attempts
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(userId) {
  const now = Date.now();
  const key = userId.toLowerCase();
  const attempts = loginAttempts.get(key);

  if (attempts) {
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

    if (!userId || !email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!acceptPrivacyPolicy) {
      return res.status(400).json({ message: "You must accept the Privacy Policy & Data Processing terms" });
    }

    // ADMIN registration is blocked - only one admin allowed (created via database)
    if (role === "ADMIN") {
      return res.status(400).json({ message: "Admin registration is not allowed. Contact system administrator." });
    }

    if (!["PATIENT", "DOCTOR", "NURSE", "LAB_TECHNICIAN"].includes(role)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    // Role to prefix mapping for validation
    const rolePrefixMap = {
      "PATIENT": "P",
      "DOCTOR": "D",
      "NURSE": "N",
      "LAB_TECHNICIAN": "L"
    };

    const prefix = userId.charAt(0).toUpperCase();
    const expectedPrefix = rolePrefixMap[role];

    if (prefix !== expectedPrefix) {
      return res.status(400).json({
        message: `User ID must start with "${expectedPrefix}" for ${role} role (e.g., ${expectedPrefix}001)`
      });
    }

    const userIdPattern = /^[PDNL][0-9]+$/i;
    if (!userIdPattern.test(userId)) {
      return res.status(400).json({
        message: "User ID must be in format: [P/D/N/L]### (role letter followed by numbers)"
      });
    }

    const existingUser = await User.findOne({ $or: [{ userId }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "User ID or Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

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

    await auditService.logAuditEvent({
      userId: user.userId,
      action: "USER_CREATED",
      resource: "/api/auth/register",
      method: "POST",
      outcome: "SUCCESS",
      ipAddress: req.ip,
      userAgent: req.get("User-Agent")
    });

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
  const ipAddress = req.ip;
  const userAgent = req.get("User-Agent");

  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ message: "User ID and password are required" });
    }

    const rateCheck = checkRateLimit(userId);
    if (rateCheck.limited) {
      await auditService.logLoginFailure(userId, "RATE_LIMITED", ipAddress, userAgent);
      return res.status(429).json({
        message: `Too many login attempts. Try again after ${rateCheck.unlockTime.toLocaleTimeString()}`
      });
    }

    recordLoginAttempt(userId);

    const token = await authService.login(userId, password);

    clearLoginAttempts(userId);

    await auditService.logLoginSuccess(userId, ipAddress, userAgent);

    res.json({ token });
  } catch (e) {
    await auditService.logLoginFailure(
      req.body.userId || "UNKNOWN",
      e.message || "INVALID_CREDENTIALS",
      ipAddress,
      userAgent
    );
    res.status(401).json({ message: "Invalid credentials" });
  }
});

module.exports = router;
