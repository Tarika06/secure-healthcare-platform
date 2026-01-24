const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authenticate");
const authorizeByUserId = require("../middleware/authorizeByUserId");

// Doctor-only route
router.get(
  "/dashboard",
  authenticate,
  authorizeByUserId(["D"]),
  (req, res) => {
    res.json({
      message: "Doctor access granted",
      user: req.user
    });
  }
);

module.exports = router;
