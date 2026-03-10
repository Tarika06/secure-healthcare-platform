const { v4: uuidv4 } = require("uuid");
const ConsultationSession = require("../models/ConsultationSession");
const Prescription = require("../models/Prescription");
const User = require("../models/User");
const { encrypt, decrypt } = require("./encryptionService");
const { logAuditEvent } = require("./auditService");
const PDFDocument = require("pdfkit");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const videoLogService = require("./videoLogService");

/**
 * Consultation Service
 * 
 * Business logic for emergency teleconsultations:
 * - Session lifecycle management
 * - Doctor assignment
 * - Prescription generation with PDF export
 * - All sensitive data encrypted at rest (AES-256)
 */

// ═══════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════

/**
 * Create a new consultation session (patient requests emergency consult)
 */
const createSession = async (patientId, { symptoms, specialtyNeeded, type, triage }) => {
  const sessionId = `CONS-${uuidv4().split("-")[0]}`;
  const roomId = `ROOM-${uuidv4()}`;

  // Smart Triage: Calculate Severity (F1)
  let severity = "UNKNOWN";
  if (triage) {
    if (triage.painLevel >= 8 || triage.vitals?.bloodPressure?.includes("180") || triage.vitals?.temperature > 103) {
      severity = "CRITICAL";
    } else if (triage.painLevel >= 6 || triage.vitals?.temperature > 101) {
      severity = "HIGH";
    } else if (triage.painLevel >= 4) {
      severity = "MODERATE";
    } else {
      severity = "LOW";
    }
    triage.severity = severity;
  }

  const session = new ConsultationSession({
    sessionId,
    patientId,
    type: type || "EMERGENCY",
    symptoms: symptoms ? encrypt(symptoms) : "",
    specialtyNeeded: specialtyNeeded || "",
    triage: triage || {},
    timeline: [{ status: "PENDING", timestamp: new Date() }],
    roomId,
    status: "PENDING"
  });

  await session.save();

  // Log to VideoConsultationLog
  await videoLogService.logRequestParams(sessionId, patientId, session.type);

  await logAuditEvent({
    userId: patientId,
    action: "CONSULTATION_REQUESTED",
    resource: "ConsultationSession",
    resourceId: sessionId,
    outcome: "SUCCESS",
    details: { type: session.type, specialtyNeeded }
  });

  return {
    ...session.toObject(),
    symptoms: symptoms || ""  // Return decrypted for the requester
  };
};

/**
 * Find available doctors (online, ACTIVE, matching specialty if needed)
 */
/**
 * Find available doctors (online, ACTIVE, matching specialty if needed)
 * Smart Matching (F2): maps symptoms to specialties if specialtyNeeded is empty.
 */
const findAvailableDoctors = async (specialtyNeeded, symptoms = "") => {
  const query = { role: "DOCTOR", status: "ACTIVE" };
  
  let targetSpecialty = specialtyNeeded;
  if (!targetSpecialty && symptoms) {
    const s = symptoms.toLowerCase();
    if (s.includes("chest") || s.includes("heart")) targetSpecialty = "Cardiology";
    else if (s.includes("skin") || s.includes("rash")) targetSpecialty = "Dermatology";
    else if (s.includes("fever") || s.includes("cough")) targetSpecialty = "General";
    else if (s.includes("child") || s.includes("baby")) targetSpecialty = "Pediatrics";
    else if (s.includes("bone") || s.includes("joint")) targetSpecialty = "Orthopedics";
    else if (s.includes("headache") || s.includes("dizzy")) targetSpecialty = "Neurology";
  }

  if (targetSpecialty && targetSpecialty !== "Any Available Doctor") {
    query.specialty = { $regex: new RegExp(targetSpecialty, "i") };
  }

  let doctors = await User.find(query)
    .select("userId firstName lastName specialty isOnline")
    .lean();

  // Fallback to General Physician if no specialist found
  if (doctors.length === 0 && targetSpecialty && targetSpecialty !== "General") {
    doctors = await User.find({ role: "DOCTOR", status: "ACTIVE", specialty: { $regex: new RegExp("General", "i") } })
      .select("userId firstName lastName specialty isOnline")
      .lean();
  }

  // Soft rank online doctors first
  return doctors.sort((a, b) => (b.isOnline === a.isOnline ? 0 : b.isOnline ? 1 : -1));
};

/**
 * Doctor accepts a consultation request
 */
const assignDoctor = async (sessionId, doctorId) => {
  const session = await ConsultationSession.findOne({ sessionId });
  if (!session) throw new Error("Consultation session not found");
  if (session.status !== "PENDING") throw new Error("Session is no longer available");

  // Verify doctor exists
  const doctor = await User.findOne({ userId: doctorId, role: "DOCTOR" });
  if (!doctor) throw new Error("Doctor not found");

  session.doctorId = doctorId;
  session.status = "ASSIGNED";
  session.timeline.push({ status: "ASSIGNED", timestamp: new Date() });
  await session.save();

  // Log to VideoConsultationLog
  await videoLogService.logDoctorAssigned(sessionId, doctorId);

  await logAuditEvent({
    userId: doctorId,
    action: "CONSULTATION_ACCEPTED",
    resource: "ConsultationSession",
    resourceId: sessionId,
    outcome: "SUCCESS",
    targetUserId: session.patientId
  });

  return session;
};

/**
 * Reject/skip a consultation request (doctor declines)
 */
const rejectSession = async (sessionId, doctorId) => {
  const session = await ConsultationSession.findOne({ sessionId });
  if (!session) throw new Error("Consultation session not found");

  await logAuditEvent({
    userId: doctorId,
    action: "CONSULTATION_REJECTED",
    resource: "ConsultationSession",
    resourceId: sessionId,
    outcome: "SUCCESS",
    targetUserId: session.patientId
  });

  return session;
};

/**
 * Start a video session (called when both parties join)
 */
const startSession = async (sessionId) => {
  const session = await ConsultationSession.findOne({ sessionId });
  if (!session) throw new Error("Consultation session not found");
  if (session.status === "IN_PROGRESS") return session; // Already started

  session.status = "IN_PROGRESS";
  session.startTime = new Date();
  session.timeline.push({ status: "IN_PROGRESS", timestamp: new Date() });
  await session.save();

  await logAuditEvent({
    userId: session.doctorId || session.patientId,
    action: "CONSULTATION_STARTED",
    resource: "ConsultationSession",
    resourceId: sessionId,
    outcome: "SUCCESS"
  });

  return session;
};

/**
 * End a consultation session
 */
const endSession = async (sessionId, doctorId, { notes, followUp, metrics } = {}) => {
  const session = await ConsultationSession.findOne({ sessionId });
  if (!session) throw new Error("Consultation session not found");

  session.status = "COMPLETED";
  session.endTime = new Date();
  session.timeline.push({ status: "COMPLETED", timestamp: new Date() });
  
  if (session.startTime) {
    session.duration = Math.round((session.endTime - session.startTime) / 1000);
  }
  if (notes) {
    session.notes = encrypt(notes);
  }
  if (followUp) {
    session.followUp = followUp;
  }

  // AI Summary Generation (F6)
  if (process.env.GEMINI_API_KEY && notes) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const prompt = `You are a medical AI assistant. Generate a structured clinical summary for this teleconsultation.
Symptoms: ${decrypt(session.symptoms) || "Not provided"}
Doctor Notes: ${notes}

Output format:
**Symptoms:** ...
**Diagnosis:** ...
**Advice:** ...
**Follow-up:** ...`;
      
      const result = await model.generateContent(prompt);
      const summaryText = await result.response.text();
      session.aiSummary = encrypt(summaryText);
    } catch (err) {
      console.error("AI Summary generation failed:", err);
    }
  }

  await session.save();

  await logAuditEvent({
    userId: doctorId || session.doctorId,
    action: "CONSULTATION_ENDED",
    resource: "ConsultationSession",
    resourceId: sessionId,
    outcome: "SUCCESS",
    details: { duration: session.duration }
  });

  // Finalize the video log securely
  await videoLogService.finalizeSession(sessionId, "DOCTOR", metrics || {});

  return session;
};

/**
 * Cancel a consultation session
 */
const cancelSession = async (sessionId, userId) => {
  const session = await ConsultationSession.findOne({ sessionId });
  if (!session) throw new Error("Consultation session not found");
  if (["COMPLETED", "CANCELLED"].includes(session.status)) {
    throw new Error("Cannot cancel — session already " + session.status.toLowerCase());
  }

  session.status = "CANCELLED";
  await session.save();

  await logAuditEvent({
    userId,
    action: "CONSULTATION_CANCELLED",
    resource: "ConsultationSession",
    resourceId: sessionId,
    outcome: "SUCCESS"
  });

  return session;
};

/**
 * Update consultation notes (live draft) (F5)
 */
const updateNotes = async (sessionId, doctorId, notes) => {
  const session = await ConsultationSession.findOne({ sessionId, doctorId });
  if (!session) throw new Error("Consultation session not found");
  if (notes) session.notes = encrypt(notes);
  await session.save();
  return session;
};

/**
 * Escalate session for emergency (F8)
 */
const escalateSession = async (sessionId, doctorId) => {
  const session = await ConsultationSession.findOne({ sessionId, doctorId });
  if (!session) throw new Error("Consultation session not found");
  session.escalated = true;
  session.timeline.push({ status: "IN_PROGRESS", timestamp: new Date() });
  await session.save();

  // Log to VideoConsultationLog
  await videoLogService.logCallStarted(sessionId);

  return session;
};

// ═══════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════

/**
 * Get session by ID with RBAC
 */
const getSessionById = async (sessionId, user) => {
  const session = await ConsultationSession.findOne({ sessionId }).lean();
  if (!session) throw new Error("Consultation session not found");

  // RBAC: patients see own, doctors see assigned, admin sees all
  if (user.role === "PATIENT" && session.patientId !== user.userId) {
    throw new Error("Access denied");
  }
  if (user.role === "DOCTOR" && session.doctorId !== user.userId) {
    throw new Error("Access denied");
  }

  // Decrypt sensitive fields
  if (session.symptoms) session.symptoms = decrypt(session.symptoms);
  if (session.notes) session.notes = decrypt(session.notes);
  if (session.aiSummary) session.aiSummary = decrypt(session.aiSummary);

  // Populate user details
  const patient = await User.findOne({ userId: session.patientId })
    .select("userId firstName lastName email").lean();
  const doctor = session.doctorId
    ? await User.findOne({ userId: session.doctorId })
        .select("userId firstName lastName specialty").lean()
    : null;

  return { ...session, patient, doctor };
};

/**
 * Get pending sessions for doctors
 */
const getPendingSessions = async () => {
  const sessions = await ConsultationSession.find({ status: "PENDING" })
    .sort({ createdAt: -1 }).lean();

  // Populate patient details and decrypt symptoms
  return Promise.all(sessions.map(async (s) => {
    const patient = await User.findOne({ userId: s.patientId })
      .select("userId firstName lastName").lean();
    return {
      ...s,
      symptoms: s.symptoms ? decrypt(s.symptoms) : "",
      patient
    };
  }));
};

/**
 * Get active sessions for a user (ASSIGNED or IN_PROGRESS)
 */
const getActiveSessions = async (user) => {
  const query = { status: { $in: ["ASSIGNED", "IN_PROGRESS"] } };
  if (user.role === "PATIENT") query.patientId = user.userId;
  else if (user.role === "DOCTOR") query.doctorId = user.userId;

  const sessions = await ConsultationSession.find(query).sort({ createdAt: -1 }).lean();

  return Promise.all(sessions.map(async (s) => {
    const patient = await User.findOne({ userId: s.patientId })
      .select("userId firstName lastName").lean();
    const doctor = s.doctorId
      ? await User.findOne({ userId: s.doctorId })
          .select("userId firstName lastName specialty").lean()
      : null;
    return { ...s, symptoms: s.symptoms ? decrypt(s.symptoms) : "", patient, doctor };
  }));
};

/**
 * Consultation history for a user
 */
const getConsultationHistory = async (user) => {
  const query = { status: { $in: ["COMPLETED", "CANCELLED"] } };
  if (user.role === "PATIENT") query.patientId = user.userId;
  else if (user.role === "DOCTOR") query.doctorId = user.userId;

  const sessions = await ConsultationSession.find(query)
    .sort({ createdAt: -1 }).limit(50).lean();

  return Promise.all(sessions.map(async (s) => {
    const patient = await User.findOne({ userId: s.patientId })
      .select("userId firstName lastName").lean();
    const doctor = s.doctorId
      ? await User.findOne({ userId: s.doctorId })
          .select("userId firstName lastName specialty").lean()
      : null;
    return {
      ...s,
      symptoms: s.symptoms ? decrypt(s.symptoms) : "",
      notes: s.notes ? decrypt(s.notes) : "",
      aiSummary: s.aiSummary ? decrypt(s.aiSummary) : "",
      patient,
      doctor
    };
  }));
};

// ═══════════════════════════════════════════════════════
// PRESCRIPTIONS
// ═══════════════════════════════════════════════════════

/**
 * Create a prescription for a consultation session
 */
const createPrescription = async (sessionId, doctorId, { medications, diagnosis, additionalNotes }) => {
  const session = await ConsultationSession.findOne({ sessionId });
  if (!session) throw new Error("Consultation session not found");
  if (session.doctorId !== doctorId) throw new Error("Access denied — not your consultation");

  const prescriptionId = `RX-${uuidv4().split("-")[0]}`;

  // Encrypt medications
  const encryptedMeds = medications.map(med => ({
    ...med,
    name: encrypt(med.name),
    dosage: encrypt(med.dosage),
    frequency: encrypt(med.frequency),
    duration: encrypt(med.duration),
    instructions: med.instructions ? encrypt(med.instructions) : undefined
  }));

  const newPrescription = new Prescription({
    prescriptionId,
    sessionId,
    patientId: session.patientId,
    doctorId,
    medications: encryptedMeds,
    diagnosis: encrypt(diagnosis),
    additionalNotes: additionalNotes ? encrypt(additionalNotes) : ""
  });

  await newPrescription.save();
  await videoLogService.incrementMetric(sessionId, "prescriptionsGenerated");

  await logAuditEvent({
    userId: doctorId,
    action: "PRESCRIPTION_CREATED",
    resource: "Prescription",
    resourceId: prescriptionId,
    outcome: "SUCCESS",
    targetUserId: session.patientId
  });

  return {
    ...prescription.toObject(),
    diagnosis,
    additionalNotes: additionalNotes || ""
  };
};

/**
 * Get prescription by session ID
 */
const getPrescription = async (sessionId, user) => {
  const prescription = await Prescription.findOne({ sessionId }).lean();
  if (!prescription) return null;

  // RBAC
  if (user.role === "PATIENT" && prescription.patientId !== user.userId) {
    throw new Error("Access denied");
  }
  if (user.role === "DOCTOR" && prescription.doctorId !== user.userId) {
    throw new Error("Access denied");
  }

  return {
    ...prescription,
    diagnosis: decrypt(prescription.diagnosis),
    additionalNotes: prescription.additionalNotes ? decrypt(prescription.additionalNotes) : ""
  };
};

/**
 * Generate prescription PDF
 */
const generatePrescriptionPDF = async (sessionId, user) => {
  const prescription = await getPrescription(sessionId, user);
  if (!prescription) throw new Error("Prescription not found");

  const session = await ConsultationSession.findOne({ sessionId }).lean();
  if (session && session.aiSummary) session.aiSummary = decrypt(session.aiSummary);

  const patient = await User.findOne({ userId: prescription.patientId })
    .select("firstName lastName userId").lean();
  const doctor = await User.findOne({ userId: prescription.doctorId })
    .select("firstName lastName specialty").lean();

  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];

  doc.on("data", (chunk) => chunks.push(chunk));

  // Header
  doc.fontSize(20).font("Helvetica-Bold").text("SecureCare+", { align: "center" });
  doc.fontSize(10).font("Helvetica").text("Digital Prescription", { align: "center" });
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#0d9488");
  doc.moveDown();

  // Prescription details
  doc.fontSize(10).font("Helvetica")
    .text(`Prescription ID: ${prescription.prescriptionId}`, { continued: true })
    .text(`  Date: ${new Date(prescription.createdAt).toLocaleDateString()}`, { align: "right" });
  doc.moveDown(0.5);
  doc.text(`Patient: ${patient?.firstName} ${patient?.lastName} (${patient?.userId})`);
  doc.text(`Doctor: Dr. ${doctor?.firstName} ${doctor?.lastName} — ${doctor?.specialty || "General"}`);
  doc.moveDown();

  // Diagnosis
  doc.fontSize(12).font("Helvetica-Bold").text("Diagnosis");
  doc.fontSize(10).font("Helvetica").text(prescription.diagnosis);
  doc.moveDown();

  // Medications table
  doc.fontSize(12).font("Helvetica-Bold").text("Medications");
  doc.moveDown(0.5);

  prescription.medications.forEach((med, i) => {
    doc.fontSize(10).font("Helvetica-Bold").text(`${i + 1}. ${med.name}`);
    doc.font("Helvetica")
      .text(`   Dosage: ${med.dosage}  |  Frequency: ${med.frequency}  |  Duration: ${med.duration}`);
    if (med.instructions) {
      doc.text(`   Instructions: ${med.instructions}`);
    }
    doc.moveDown(0.3);
  });

  // Additional notes
  if (prescription.additionalNotes) {
    doc.moveDown();
    doc.fontSize(12).fillColor("#000").font("Helvetica-Bold").text("Additional Notes");
    doc.fontSize(10).font("Helvetica").text(prescription.additionalNotes);
  }

  // AI Summary (F8)
  if (session && session.aiSummary) {
    doc.moveDown();
    doc.fontSize(12).fillColor("#0d9488").font("Helvetica-Bold").text("AI Consultation Summary");
    doc.fontSize(10).fillColor("#333").font("Helvetica").text(session.aiSummary);
    doc.fillColor("#000"); // Reset
  }

  // Footer
  doc.moveDown(2);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke("#0d9488");
  doc.moveDown(0.5);
  doc.fontSize(8).fillColor("#888")
    .text("This is a digitally generated prescription from SecureCare+ Teleconsultation.", { align: "center" })
    .text("Verified and encrypted under HIPAA/GDPR compliance.", { align: "center" });

  doc.end();

  return new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
};

module.exports = {
  createSession,
  findAvailableDoctors,
  assignDoctor,
  rejectSession,
  startSession,
  endSession,
  cancelSession,
  getSessionById,
  getPendingSessions,
  getActiveSessions,
  getConsultationHistory,
  createPrescription,
  getPrescription,
  generatePrescriptionPDF,
  updateNotes,
  escalateSession
};
