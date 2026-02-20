const express = require("express");
const router = express.Router();
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const User = require("../models/User");

// POST /api/mfa/setup — Generate TOTP secret + QR code
router.post("/setup", async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.user.userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Generate a new TOTP secret
        const secret = speakeasy.generateSecret({
            name: `SecureCare+ (${user.userId})`,
            issuer: "SecureCare+",
            length: 20
        });

        // Store temp secret (not yet confirmed)
        user.mfaTempSecret = secret.base32;
        await user.save();

        // Generate QR code as data URL
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.json({
            qrCode: qrCodeUrl,
            manualKey: secret.base32,
            message: "Scan this QR code with your authenticator app"
        });
    } catch (error) {
        console.error("MFA setup error:", error);
        res.status(500).json({ message: "Failed to setup MFA" });
    }
});

// POST /api/mfa/verify-setup — Verify first TOTP code and enable MFA
router.post("/verify-setup", async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: "Verification code is required" });

        const user = await User.findOne({ userId: req.user.userId });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!user.mfaTempSecret) return res.status(400).json({ message: "No MFA setup in progress. Please initiate setup first." });

        // Verify the TOTP code against the temp secret
        const verified = speakeasy.totp.verify({
            secret: user.mfaTempSecret,
            encoding: "base32",
            token: code,
            window: 2 // Allow +/- 2 time steps (60 seconds tolerance)
        });

        if (!verified) {
            return res.status(400).json({ message: "Invalid verification code. Please try again." });
        }

        // Move temp secret to permanent and enable MFA
        user.mfaSecret = user.mfaTempSecret;
        user.mfaTempSecret = null;
        user.mfaEnabled = true;
        await user.save();

        res.json({ message: "MFA enabled successfully", mfaEnabled: true });
    } catch (error) {
        console.error("MFA verify-setup error:", error);
        res.status(500).json({ message: "Failed to verify MFA setup" });
    }
});

// POST /api/mfa/disable — Disable MFA (requires valid TOTP code)
router.post("/disable", async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: "Verification code is required to disable MFA" });

        const user = await User.findOne({ userId: req.user.userId });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (!user.mfaEnabled) return res.status(400).json({ message: "MFA is not enabled" });

        // Verify the TOTP code before disabling
        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: "base32",
            token: code,
            window: 2
        });

        if (!verified) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        user.mfaEnabled = false;
        user.mfaSecret = null;
        user.mfaTempSecret = null;
        await user.save();

        res.json({ message: "MFA disabled successfully", mfaEnabled: false });
    } catch (error) {
        console.error("MFA disable error:", error);
        res.status(500).json({ message: "Failed to disable MFA" });
    }
});

// POST /api/mfa/status — Get MFA status for the authenticated user
router.post("/status", async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.user.userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ mfaEnabled: user.mfaEnabled });
    } catch (error) {
        console.error("MFA status error:", error);
        res.status(500).json({ message: "Failed to get MFA status" });
    }
});

module.exports = router;
