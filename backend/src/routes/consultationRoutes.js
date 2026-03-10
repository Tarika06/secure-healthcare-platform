const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const consultationService = require("../services/consultationService");
const SessionDocument = require("../models/SessionDocument");
const { encrypt, decrypt } = require("../services/encryptionService");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

/**
 * Consultation Routes
 * 
 * All routes require JWT authentication.
 * RBAC enforced via authorize middleware.
 * 
 * POST   /request                      → Request emergency consultation (PATIENT)
 * GET    /pending                      → Get pending requests (DOCTOR)
 * GET    /active                       → Get active sessions (PATIENT, DOCTOR)
 * GET    /history                      → Consultation history (PATIENT, DOCTOR)
 * GET    /:id                          → Get session details (PATIENT, DOCTOR)
 * PATCH  /:id/accept                   → Accept consultation (DOCTOR)
 * PATCH  /:id/reject                   → Reject consultation (DOCTOR)
 * PATCH  /:id/start                    → Start session (DOCTOR, PATIENT)
 * PATCH  /:id/end                      → End session (DOCTOR)
 * PATCH  /:id/cancel                   → Cancel session (PATIENT, DOCTOR)
 * POST   /:id/prescription             → Create prescription (DOCTOR)
 * GET    /:id/prescription             → Get prescription (PATIENT, DOCTOR)
 * GET    /:id/prescription/pdf         → Download PDF (PATIENT, DOCTOR)
 */

router.use(authenticate);

// ─── Request Emergency Consultation ──────────────────────────────
router.post(
  "/request",
  authorize(["PATIENT"]),
  async (req, res) => {
    try {
      const { symptoms, specialtyNeeded, type } = req.body;
      const session = await consultationService.createSession(
        req.user.userId,
        { symptoms, specialtyNeeded, type }
      );

      // Notify available doctors via Socket.IO (if io is available)
      const io = req.app.get("io");
      if (io) {
        io.to("doctors").emit("CONSULTATION_REQUEST", { session });
      }

      res.status(201).json({ message: "Consultation requested", session });
    } catch (err) {
      console.error("Create consultation error:", err.message);
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Get Pending Requests ────────────────────────────────────────
router.get(
  "/pending",
  authorize(["DOCTOR"]),
  async (req, res) => {
    try {
      const sessions = await consultationService.getPendingSessions();
      res.json({ sessions });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Get Active Sessions ─────────────────────────────────────────
router.get(
  "/active",
  authorize(["PATIENT", "DOCTOR"]),
  async (req, res) => {
    try {
      const sessions = await consultationService.getActiveSessions(req.user);
      res.json({ sessions });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Consultation History ────────────────────────────────────────
router.get(
  "/history",
  authorize(["PATIENT", "DOCTOR"]),
  async (req, res) => {
    try {
      const sessions = await consultationService.getConsultationHistory(req.user);
      res.json({ sessions });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Get Session Details ─────────────────────────────────────────
router.get(
  "/:id",
  authorize(["PATIENT", "DOCTOR", "ADMIN"]),
  async (req, res) => {
    try {
      const session = await consultationService.getSessionById(req.params.id, req.user);
      res.json({ session });
    } catch (err) {
      const status = err.message.includes("not found") ? 404
        : err.message.includes("Access denied") ? 403 : 500;
      res.status(status).json({ message: err.message });
    }
  }
);

// ─── Accept Consultation ─────────────────────────────────────────
router.patch(
  "/:id/accept",
  authorize(["DOCTOR"]),
  async (req, res) => {
    try {
      const session = await consultationService.assignDoctor(req.params.id, req.user.userId);

      // Notify patient via Socket.IO
      const io = req.app.get("io");
      if (io) {
        io.to(`patient-${session.patientId}`).emit("CONSULTATION_ACCEPTED", {
          sessionId: session.sessionId,
          doctorId: req.user.userId
        });
      }

      res.json({ message: "Consultation accepted", session });
    } catch (err) {
      const status = err.message.includes("not found") ? 404
        : err.message.includes("no longer available") ? 409 : 500;
      res.status(status).json({ message: err.message });
    }
  }
);

// ─── Reject Consultation ─────────────────────────────────────────
router.patch(
  "/:id/reject",
  authorize(["DOCTOR"]),
  async (req, res) => {
    try {
      await consultationService.rejectSession(req.params.id, req.user.userId);
      res.json({ message: "Consultation declined" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Start Session ───────────────────────────────────────────────
router.patch(
  "/:id/start",
  authorize(["DOCTOR", "PATIENT"]),
  async (req, res) => {
    try {
      const session = await consultationService.startSession(req.params.id);
      res.json({ message: "Session started", session });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── End Session ─────────────────────────────────────────────────
router.patch(
  "/:id/end",
  authorize(["DOCTOR"]),
  async (req, res) => {
    try {
      const { notes, followUp, metrics } = req.body;
      const session = await consultationService.endSession(req.params.id, req.user.userId, { notes, followUp, metrics });
      res.json({ message: "Session ended", session });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Cancel Session ──────────────────────────────────────────────
router.patch(
  "/:id/cancel",
  authorize(["PATIENT", "DOCTOR"]),
  async (req, res) => {
    try {
      const session = await consultationService.cancelSession(req.params.id, req.user.userId);
      res.json({ message: "Session cancelled", session });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Live Notes Auto-Save ────────────────────────────────────────
router.patch(
  "/:id/notes",
  authorize(["DOCTOR"]),
  async (req, res) => {
    try {
      const { notes } = req.body;
      const session = await consultationService.updateNotes(req.params.id, req.user.userId, notes);
      res.json({ message: "Notes saved", session });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Escalate Session ────────────────────────────────────────────
router.post(
  "/:id/escalate",
  authorize(["DOCTOR"]),
  async (req, res) => {
    try {
      const session = await consultationService.escalateSession(req.params.id, req.user.userId);
      
      const io = req.app.get("io");
      if (io) {
        io.to(`room-${req.params.id}`).emit("EMERGENCY_ESCALATION", { sessionId: req.params.id });
      }

      res.json({ message: "Session escalated", session });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Create Prescription ─────────────────────────────────────────
router.post(
  "/:id/prescription",
  authorize(["DOCTOR"]),
  async (req, res) => {
    try {
      const { medications, diagnosis, additionalNotes } = req.body;
      if (!medications || !diagnosis) {
        return res.status(400).json({ message: "medications and diagnosis are required" });
      }
      const prescription = await consultationService.createPrescription(
        req.params.id, req.user.userId, { medications, diagnosis, additionalNotes }
      );
      res.status(201).json({ message: "Prescription created", prescription });
    } catch (err) {
      const status = err.message.includes("Access denied") ? 403
        : err.message.includes("not found") ? 404 : 500;
      res.status(status).json({ message: err.message });
    }
  }
);

// ─── Get Prescription ────────────────────────────────────────────
router.get(
  "/:id/prescription",
  authorize(["PATIENT", "DOCTOR"]),
  async (req, res) => {
    try {
      const prescription = await consultationService.getPrescription(req.params.id, req.user);
      if (!prescription) return res.status(404).json({ message: "No prescription found" });
      res.json({ prescription });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Download Prescription PDF ───────────────────────────────────
router.get(
  "/:id/prescription/pdf",
  authorize(["PATIENT", "DOCTOR"]),
  async (req, res) => {
    try {
      const pdfBuffer = await consultationService.generatePrescriptionPDF(req.params.id, req.user);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=prescription-${req.params.id}.pdf`);
      res.send(pdfBuffer);
    } catch (err) {
      const status = err.message.includes("not found") ? 404 : 500;
      res.status(status).json({ message: err.message });
    }
  }
);

// ─── Upload Document ─────────────────────────────────────────────
router.post(
  "/:id/documents",
  authorize(["PATIENT", "DOCTOR"]),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file provided" });

      const session = await consultationService.getSessionById(req.params.id, req.user);
      if (!session) return res.status(404).json({ message: "Session not found" });

      const documentId = `DOC-${uuidv4().split("-")[0]}`;
      const base64Data = req.file.buffer.toString("base64");
      
      const doc = new SessionDocument({
        documentId,
        sessionId: req.params.id,
        patientId: session.patientId,
        filename: req.file.originalname,
        fileType: req.file.mimetype,
        encryptedData: encrypt(base64Data)
      });

      await doc.save();

      const io = req.app.get("io");
      if (io) {
        io.to(`room-${req.params.id}`).emit("DOCUMENT_UPLOADED", {
          documentId,
          filename: req.file.originalname,
          fileType: req.file.mimetype,
          uploadedBy: req.user.role
        });
      }

      res.status(201).json({ message: "Document uploaded successfully", document: { documentId, filename: req.file.originalname, fileType: req.file.mimetype } });
    } catch (err) {
      console.error("Document upload error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Get Documents ───────────────────────────────────────────────
router.get(
  "/:id/documents",
  authorize(["PATIENT", "DOCTOR", "ADMIN"]),
  async (req, res) => {
    try {
      const session = await consultationService.getSessionById(req.params.id, req.user);
      if (!session) return res.status(404).json({ message: "Session not found" });

      const docs = await SessionDocument.find({ sessionId: req.params.id })
        .select("-__v")
        .sort({ createdAt: -1 })
        .lean();

      res.json({ documents: docs.map(d => ({ ...d, encryptedData: undefined })) });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Download Document ───────────────────────────────────────────
router.get(
  "/:id/documents/:docId/download",
  authorize(["PATIENT", "DOCTOR", "ADMIN"]),
  async (req, res) => {
    try {
      const session = await consultationService.getSessionById(req.params.id, req.user);
      if (!session) return res.status(404).json({ message: "Session not found" });

      const doc = await SessionDocument.findOne({ documentId: req.params.docId, sessionId: req.params.id }).lean();
      if (!doc) return res.status(404).json({ message: "Document not found" });

      const decryptedBase64 = decrypt(doc.encryptedData);
      const buffer = Buffer.from(decryptedBase64, "base64");

      res.setHeader("Content-Type", doc.fileType);
      res.setHeader("Content-Disposition", `attachment; filename="${doc.filename}"`);
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
