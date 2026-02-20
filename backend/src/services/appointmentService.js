const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const auditService = require("./auditService");

/**
 * Appointment Service
 * 
 * Handles all appointment business logic:
 * - Booking with double-booking prevention
 * - Purpose-scoped QR JWT generation (single-use, expires end-of-day)
 * - Available slot lookup
 * - Entry verification (QR scan at hospital reception)
 * - Appointment lifecycle management
 */

// Valid time slots (30-minute intervals, 09:00–17:00)
const VALID_TIME_SLOTS = [];
for (let h = 9; h < 17; h++) {
  VALID_TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  VALID_TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

/**
 * Generate a unique appointment ID
 * Format: APT-<timestamp>-<random4hex>
 */
const generateAppointmentId = () => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(2).toString("hex");
  return `APT-${timestamp}-${random}`;
};

/**
 * Sign a purpose-scoped JWT for QR code
 * - Distinct from login JWT (has purpose: "HOSPITAL_ENTRY")
 * - Expires at 23:59:59 on the appointment date
 * - Contains appointmentId, patientId, doctorId, date
 */
const signQrToken = (appointment) => {
  // Expire at end of appointment day (23:59:59 local)
  const endOfDay = new Date(`${appointment.date}T23:59:59`);
  const expiresIn = Math.max(
    Math.floor((endOfDay.getTime() - Date.now()) / 1000),
    60 // minimum 60 seconds
  );

  return jwt.sign(
    {
      appointmentId: appointment.appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: appointment.date,
      purpose: "HOSPITAL_ENTRY"
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Generate QR code as base64 data URL from a token string
 */
const generateQrCode = async (token) => {
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 300
  });
};

/**
 * Book a new appointment
 * 
 * @param {string} patientId - The patient's userId
 * @param {Object} data - { doctorId, date, timeSlot, reason }
 * @param {string} ipAddress - Requester IP for audit
 * @returns {Object} Created appointment with QR code
 */
const bookAppointment = async (patientId, { doctorId, date, timeSlot, reason }, ipAddress) => {
  // --- Validations ---

  // 1. Validate time slot format
  if (!VALID_TIME_SLOTS.includes(timeSlot)) {
    throw new Error(`Invalid time slot. Valid slots: ${VALID_TIME_SLOTS.join(", ")}`);
  }

  // 2. Validate date is not in the past
  const appointmentDate = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (appointmentDate < today) {
    throw new Error("Cannot book appointments in the past");
  }

  // 3. Validate doctor exists and has DOCTOR role
  const doctor = await User.findOne({ userId: doctorId, role: "DOCTOR" });
  if (!doctor) {
    throw new Error("Doctor not found");
  }

  // 4. Validate patient exists
  const patient = await User.findOne({ userId: patientId, role: "PATIENT" });
  if (!patient) {
    throw new Error("Patient not found");
  }

  // 5. Check for double-booking (compound index will also enforce this)
  const existing = await Appointment.findOne({
    doctorId,
    date,
    timeSlot,
    status: { $nin: ["CANCELLED"] }
  });
  if (existing) {
    throw new Error("This time slot is already booked for the selected doctor");
  }

  // --- Create appointment ---
  const appointmentId = generateAppointmentId();

  const appointment = new Appointment({
    appointmentId,
    patientId,
    doctorId,
    date,
    timeSlot,
    reason,
    status: "BOOKED"
  });

  // Generate purpose-scoped QR token & QR image
  const qrToken = signQrToken(appointment);
  const qrCode = await generateQrCode(qrToken);

  appointment.qrToken = qrToken;
  appointment.qrCode = qrCode;

  await appointment.save();

  // Audit log
  await auditService.logAuditEvent({
    userId: patientId,
    action: "APPOINTMENT_BOOKED",
    resource: `/api/appointments/${appointmentId}`,
    method: "POST",
    outcome: "SUCCESS",
    details: { appointmentId, doctorId, date, timeSlot },
    ipAddress,
    complianceCategory: "HIPAA"
  });

  return appointment;
};

/**
 * Get available time slots for a doctor on a given date
 * 
 * @param {string} doctorId
 * @param {string} date - "YYYY-MM-DD"
 * @returns {string[]} Available time slots
 */
const getAvailableSlots = async (doctorId, date) => {
  // Verify doctor exists
  const doctor = await User.findOne({ userId: doctorId, role: "DOCTOR" });
  if (!doctor) {
    throw new Error("Doctor not found");
  }

  // Find all non-cancelled bookings for this doctor on this date
  const booked = await Appointment.find({
    doctorId,
    date,
    status: { $nin: ["CANCELLED"] }
  }).select("timeSlot");

  const bookedSlots = new Set(booked.map((a) => a.timeSlot));

  return VALID_TIME_SLOTS.filter((slot) => !bookedSlots.has(slot));
};

/**
 * Get appointment by ID (with role-based access)
 * 
 * @param {string} appointmentId
 * @param {Object} requestingUser - { userId, role }
 * @returns {Object} Appointment document
 */
const getAppointmentById = async (appointmentId, requestingUser) => {
  const appointment = await Appointment.findOne({ appointmentId }).lean();
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // RBAC: patients see only their own, doctors see their schedule, admin sees all
  if (
    requestingUser.role === "PATIENT" &&
    appointment.patientId !== requestingUser.userId
  ) {
    throw new Error("Access denied — you can only view your own appointments");
  }
  if (
    requestingUser.role === "DOCTOR" &&
    appointment.doctorId !== requestingUser.userId
  ) {
    throw new Error("Access denied — you can only view your own schedule");
  }

  return appointment;
};

/**
 * List appointments for the requesting user
 * 
 * @param {Object} requestingUser - { userId, role }
 * @param {Object} filters - Optional { status, date }
 * @returns {Object[]} Appointments
 */
const listAppointments = async (requestingUser, filters = {}) => {
  const query = {};

  // Scope by role
  if (requestingUser.role === "PATIENT") {
    query.patientId = requestingUser.userId;
  } else if (requestingUser.role === "DOCTOR") {
    query.doctorId = requestingUser.userId;
  }
  // ADMIN sees all — no scoping

  // Apply optional filters
  if (filters.status) query.status = filters.status;
  if (filters.date) query.date = filters.date;

  return Appointment.find(query)
    .sort({ date: 1, timeSlot: 1 })
    .lean();
};

/**
 * Verify hospital entry via QR token
 * 
 * This is the core security verification:
 * 1. Decode & verify JWT signature
 * 2. Check token has HOSPITAL_ENTRY purpose
 * 3. Check JWT expiry (built into jwt.verify)
 * 4. Look up appointment in DB
 * 5. Validate appointment date matches today
 * 6. Ensure not already used (single-use)
 * 7. Mark as VERIFIED
 * 
 * @param {string} qrToken - The JWT string scanned from QR code
 * @param {Object} verifier - { userId, role } of the nurse/admin scanning
 * @param {string} ipAddress - For audit logging
 * @returns {Object} Verification result with appointment details
 */
const verifyEntry = async (qrToken, verifier, ipAddress) => {
  // 1. Verify JWT signature and expiry
  let decoded;
  try {
    decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
  } catch (err) {
    await auditService.logAuditEvent({
      userId: verifier.userId,
      action: "ENTRY_VERIFICATION_FAILED",
      resource: "/api/appointments/verify-entry",
      method: "POST",
      outcome: "FAILURE",
      reason: `JWT verification failed: ${err.message}`,
      ipAddress,
      complianceCategory: "SECURITY"
    });

    if (err.name === "TokenExpiredError") {
      throw new Error("QR code has expired — appointment date has passed");
    }
    throw new Error("Invalid QR code — signature verification failed");
  }

  // 2. Validate purpose claim
  if (decoded.purpose !== "HOSPITAL_ENTRY") {
    await auditService.logAuditEvent({
      userId: verifier.userId,
      action: "ENTRY_VERIFICATION_FAILED",
      resource: "/api/appointments/verify-entry",
      method: "POST",
      outcome: "FAILURE",
      reason: `Invalid token purpose: ${decoded.purpose}`,
      ipAddress,
      complianceCategory: "SECURITY"
    });
    throw new Error("Invalid QR code — not a hospital entry token");
  }

  // 3. Look up appointment
  const appointment = await Appointment.findOne({
    appointmentId: decoded.appointmentId
  });

  if (!appointment) {
    throw new Error("Appointment not found for this QR code");
  }

  // 4. Validate appointment date is today
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  if (appointment.date !== today) {
    await auditService.logAuditEvent({
      userId: verifier.userId,
      action: "ENTRY_VERIFICATION_FAILED",
      resource: `/api/appointments/${appointment.appointmentId}`,
      method: "POST",
      outcome: "FAILURE",
      reason: `Date mismatch: appointment is for ${appointment.date}, today is ${today}`,
      ipAddress,
      complianceCategory: "SECURITY"
    });
    throw new Error(`QR code is not valid today — appointment is for ${appointment.date}`);
  }

  // 5. Check single-use: not already verified
  if (appointment.status === "VERIFIED") {
    await auditService.logAuditEvent({
      userId: verifier.userId,
      action: "ENTRY_VERIFICATION_FAILED",
      resource: `/api/appointments/${appointment.appointmentId}`,
      method: "POST",
      outcome: "FAILURE",
      reason: "Token already used",
      ipAddress,
      complianceCategory: "SECURITY"
    });
    throw new Error("QR code has already been used — entry was already verified");
  }

  // 6. Check appointment isn't cancelled
  if (appointment.status === "CANCELLED") {
    throw new Error("This appointment has been cancelled");
  }

  // 7. Mark as VERIFIED (single-use consumed)
  appointment.status = "VERIFIED";
  appointment.entryVerifiedAt = new Date();
  appointment.entryVerifiedBy = verifier.userId;
  await appointment.save();

  // 8. Audit log — successful entry
  await auditService.logAuditEvent({
    userId: verifier.userId,
    action: "ENTRY_VERIFIED",
    resource: `/api/appointments/${appointment.appointmentId}`,
    method: "POST",
    outcome: "SUCCESS",
    details: {
      appointmentId: appointment.appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      verifiedBy: verifier.userId
    },
    ipAddress,
    complianceCategory: "HIPAA"
  });

  return {
    message: "Entry verified successfully",
    appointment: {
      appointmentId: appointment.appointmentId,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: appointment.date,
      timeSlot: appointment.timeSlot,
      status: appointment.status,
      entryVerifiedAt: appointment.entryVerifiedAt,
      entryVerifiedBy: appointment.entryVerifiedBy
    }
  };
};

/**
 * Cancel an appointment (patient only, for their own)
 */
const cancelAppointment = async (appointmentId, patientId, ipAddress) => {
  const appointment = await Appointment.findOne({ appointmentId, patientId });
  if (!appointment) {
    throw new Error("Appointment not found or access denied");
  }

  if (appointment.status !== "BOOKED") {
    throw new Error(`Cannot cancel — appointment status is ${appointment.status}`);
  }

  appointment.status = "CANCELLED";
  await appointment.save();

  await auditService.logAuditEvent({
    userId: patientId,
    action: "APPOINTMENT_CANCELLED",
    resource: `/api/appointments/${appointmentId}`,
    method: "PUT",
    outcome: "SUCCESS",
    details: { appointmentId },
    ipAddress,
    complianceCategory: "HIPAA"
  });

  return appointment;
};

module.exports = {
  bookAppointment,
  getAvailableSlots,
  getAppointmentById,
  listAppointments,
  verifyEntry,
  cancelAppointment,
  VALID_TIME_SLOTS
};
