const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");

// Get authenticated user profile
router.get("/profile", authenticate, async (req, res) => {
    try {
        const User = require("../models/User");
        const user = await User.findOne({ userId: req.user.userId }).select("-passwordHash");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            userId: user.userId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            specialty: user.specialty,
            status: user.status
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Error fetching profile" });
    }
});

module.exports = router;
