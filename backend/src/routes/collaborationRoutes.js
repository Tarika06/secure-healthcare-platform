const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorizeByUserId = require("../middleware/authorizeByUserId");
const collaborationService = require("../services/collaborationService");
const Collaboration = require("../models/Collaboration");

/**
 * ADMIN ONLY: global monitoring route
 * Allows administrators to see which doctors are collaborating on which patients
 * WITHOUT seeing the actual encrypted message content.
 */
router.get("/admin/list", authenticate, authorizeByUserId(["A"]), async (req, res) => {
    try {
        const collaborations = await Collaboration.find().sort({ createdAt: -1 });
        res.json({ collaborations });
    } catch (error) {
        res.status(500).json({ message: "Error fetching collaborations" });
    }
});

// DOCTOR ONLY: interaction routes
// Applying doctor-locking for all subsequent routes
router.use(authenticate);
router.use(authorizeByUserId(["D"]));

/**
 * POST /api/collaboration/request
 * Request a consultation from another doctor
 */
router.post("/request", async (req, res) => {
    try {
        const collaboration = await collaborationService.requestConsultation(req.body, req.user.userId);
        res.status(201).json({ message: "Consultation request sent successfully", collaboration });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * GET /api/collaboration/my-requests
 * Get incoming and outgoing consultation requests
 */
router.get("/my-requests", async (req, res) => {
    try {
        const data = await collaborationService.getMyCollaborations(req.user.userId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * PATCH /api/collaboration/respond/:id
 * Accept or Decline a consultation request
 */
router.patch("/respond/:id", async (req, res) => {
    try {
        const collaboration = await collaborationService.respondToRequest(req.params.id, req.user.userId, req.body.status);
        res.json({ message: `Consultation request ${req.body.status.toLowerCase()}`, collaboration });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * GET /api/collaboration/:id/messages
 * Get the conversation messages
 */
router.get("/:id/messages", async (req, res) => {
    try {
        const messages = await collaborationService.getMessages(req.params.id, req.user.userId);
        res.json({ messages });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * POST /api/collaboration/:id/message
 * Send an encrypted message
 */
router.post("/:id/message", async (req, res) => {
    try {
        const message = await collaborationService.sendMessage(req.params.id, req.user.userId, req.body);
        res.status(201).json({ message: "Message sent", data: message });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/**
 * GET /api/collaboration/:id/patient-data
 * Access the shared patient records based on scope
 */
router.get("/:id/patient-data", async (req, res) => {
    try {
        const data = await collaborationService.getScopedPatientData(req.params.id, req.user.userId);
        res.json({ records: data });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
