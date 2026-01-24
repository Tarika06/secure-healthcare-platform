const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/authenticate");
const authorizeByUserId = require("../middleware/authorizebyuserId");
const auditLogger = require("../middleware/auditLogger");


router.get(
  "/dashboard",
  authenticate,
  authorizeByUserId(["P"]),
  auditLogger("SUCCESS","OK"),
  (req, res) => {
    res.json({
      message: "Patient access granted",
      user: req.user
    });
  }
);

module.exports = router;