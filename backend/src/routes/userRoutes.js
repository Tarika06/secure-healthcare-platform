const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const authenticate = require("../middleware/authenticate");
const User = require("../models/User");
const { logAuditEvent } = require("../services/auditService");
const { encrypt, decrypt } = require("../services/encryptionService");
const auditService = require("../services/auditService");

// Get authenticated user profile
router.get("/profile", authenticate, async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.user.userId }).select("-passwordHash");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // HIPAA/GDPR: Decrypt PII for authorized viewing
        const decryptedPhone = user.phone ? decrypt(user.phone) : "";

        await auditService.logDataAccess(user.userId, user.userId, "VIEW_PROFILE");

        res.json({
            userId: user.userId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            specialty: user.specialty,
            phone: decryptedPhone,
            status: user.status,
            createdAt: user.createdAt
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Error fetching profile" });
    }
});

// Update user profile
router.put("/profile", authenticate, async (req, res) => {
    try {
        const { firstName, lastName, phone, specialty } = req.body;

        const user = await User.findOne({ userId: req.user.userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update allowed fields
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;

        // HIPAA/GDPR: Encrypt PII (phone number) before storage
        if (phone !== undefined) {
            user.phone = phone ? encrypt(phone) : "";
        }

        if (specialty !== undefined && user.role === "DOCTOR") {
            user.specialty = specialty;
        }

        await user.save();

        await logAuditEvent({
            userId: req.user.userId,
            action: "PROFILE_UPDATE",
            resource: "User",
            resourceId: user.userId,
            details: {
                updated: Object.keys(req.body).filter(k => req.body[k] !== undefined),
                hipaaCompliant: true,
                encryptedFields: phone !== undefined ? ["phone"] : []
            },
            status: "success",
            ipAddress: req.ip
        });

        // Return decrypted data for display
        res.json({
            message: "Profile updated successfully",
            user: {
                userId: user.userId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                specialty: user.specialty,
                phone: phone || "",
                status: user.status
            }
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Error updating profile" });
    }
});

// Change password (requires current password verification)
router.put("/change-password", authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current password and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters long" });
        }

        const user = await User.findOne({ userId: req.user.userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            await logAuditEvent({
                userId: req.user.userId,
                action: "PASSWORD_CHANGE_FAILED",
                resource: "User",
                resourceId: user.userId,
                details: { reason: "Invalid current password" },
                status: "failure",
                ipAddress: req.ip
            });
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        // Hash new password and save (bcrypt already provides secure hashing)
        const newPasswordHash = await bcrypt.hash(newPassword, 12);
        user.passwordHash = newPasswordHash;
        await user.save();

        await logAuditEvent({
            userId: req.user.userId,
            action: "PASSWORD_CHANGE",
            resource: "User",
            resourceId: user.userId,
            details: {
                message: "Password changed successfully",
                hipaaCompliant: true
            },
            status: "success",
            ipAddress: req.ip
        });

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: "Error changing password" });
    }
});

module.exports = router;


