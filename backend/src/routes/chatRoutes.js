const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const { getChatResponse } = require("../services/chatService");

router.post("/", authenticate, async (req, res) => {
  console.log("📨 CHAT ROUTE HIT!");
  console.log("👤 User:", req.user?.userId, req.user?.role);
  console.log("📦 Payload size:", JSON.stringify(req.body).length);
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const reply = await getChatResponse(req.user, messages);
    res.json({ reply });
  } catch (error) {
    console.error("Chat Route Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

module.exports = router;
