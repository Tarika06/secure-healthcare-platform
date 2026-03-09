const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const authenticate = require("../middleware/authenticate");

// All notification routes require authentication
router.use(authenticate);

// ─── Get User Notifications ──────────────────────────────
// GET /api/notifications
router.get("/", async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.userId })
            .sort({ createdAt: -1 }) // newest first
            .limit(50); // don't overwhelm

        res.json({ notifications });
    } catch (err) {
        console.error("Get notifications error:", err.message);
        res.status(500).json({ message: "Server error retrieving notifications" });
    }
});

// ─── Get Unread Count ──────────────────────────────────
// GET /api/notifications/unread
router.get("/unread", async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.user.userId,
            read: false
        });
        res.json({ count });
    } catch (err) {
        console.error("Get unread notifications count error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// ─── Mark Notification as Read ─────────────────────────
// PUT /api/notifications/:id/read
router.put("/:id/read", async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({ message: "Marked as read", notification });
    } catch (err) {
        console.error("Mark notification read error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// ─── Mark All as Read ──────────────────────────────────
// PUT /api/notifications/mark-all-read
router.put("/mark-all-read", async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.userId, read: false },
            { read: true }
        );
        res.json({ message: "All notifications marked as read" });
    } catch (err) {
        console.error("Mark all read error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
