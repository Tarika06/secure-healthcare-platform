const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authenticate");
const authorizeByUserId = require("../middleware/authorizeByUserId");
const auditLogger = require("../middleware/auditLogger");


router.get(
  "/dashboard",
  authenticate,
  authorizeByUserId(["P"]),
  auditLogger("SUCCESS", "OK"),
  (req, res) => {
    console.log("DASHBOARD REACHED for user:", req.user.userId);
    res.json({
      message: "Patient access granted",
      user: req.user
    });
  }
);

module.exports = router;