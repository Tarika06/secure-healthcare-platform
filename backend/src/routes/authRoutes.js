const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

router.post("/login", async (req, res) => {
  try {
    const { userId, password } = req.body;

    const token = await authService.login(userId, password);

    res.json({ token });
  } catch (e) {
    res.status(401).json({ message: e.message });
  }
});

module.exports = router;
