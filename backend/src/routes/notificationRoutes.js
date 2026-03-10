const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const authenticate = require("../middleware/authenticate");

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/notifications
 * Get all notifications for the authenticated user
 */
router.get("/", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        const notifications = await Notification.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(limit);

        res.json({ notifications });
    } catch (err) {
        console.error("Fetch notifications error:", err);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
});

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get("/unread-count", async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.user.userId,
            isRead: false
        });

        res.json({ unreadCount: count });
    } catch (err) {
        console.error("Count unread notifications error:", err);
        res.status(500).json({ message: "Failed to count unread notifications" });
    }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
router.put("/:id/read", async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json({ message: "Marked as read", notification });
    } catch (err) {
        console.error("Mark notification read error:", err);
        res.status(500).json({ message: "Failed to update notification" });
    }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the user
 */
router.put("/read-all", async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.userId, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ message: "All notifications marked as read" });
    } catch (err) {
        console.error("Mark all notifications read error:", err);
        res.status(500).json({ message: "Failed to update notifications" });
    }
});

module.exports = router;
