const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");

// Get authenticated user profile
// User data is already fetched and validated by authenticate middleware
router.get("/profile", authenticate, async (req, res) => {
    try {
        // User object is already attached to req.user by authenticate middleware
        // This includes: userId, email, firstName, lastName, role, specialty, status
        res.json(req.user);
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Error fetching profile" });
    }
});

module.exports = router;
