const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Notification = require("../models/Notification");
const auditService = require("./auditService");

/**
 * Generate a unique appointment ID
 */
const generateAppointmentId = () => {
  return "APT-" + Math.random().toString(36).substr(2, 9).toUpperCase();
};

/**
 * Valid time slots (e.g., every 30 mins from 09:00 to 17:00)
 */
const VALID_TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00"
];

/**
 * Generates a signed JWT payload for the QR code
 * The JWT specifies its purpose (HOSPITAL_ENTRY) and binds the patient context
 * It should expire at the end of the appointment day
 * @param {Object} appointment Appointment Document
 * @returns {string} Signed JWT Base64 String
 */
const signQrToken = (appointment) => {
  const appointmentDate = new Date(`${appointment.date}T23:59:59Z`); // Expire end of day
  const expiresInMs = appointmentDate.getTime() - Date.now();
  const expiresInSecs = Math.max(Math.floor(expiresInMs / 1000), 3600); // At least 1 hour

  const payload = {
    purpose: "HOSPITAL_ENTRY",
    appointmentId: appointment.appointmentId,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    date: appointment.date,
    timeSlot: appointment.timeSlot
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expiresInSecs });
};

/**
 * Generate a QR code Base64 image
 * In a real application, this might point to a frontend verification URL
 * like: https://app.hospital.com/verify-qr?token=...
 * @param {string} token 
 * @param {string} aptId 
 * @returns {Promise<string>} Base64 Data URI of the QR code image
 */
const generateQrCode = async (token, aptId) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/appointment/${aptId}?token=${token}`;
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
    return qrDataUrl;
  } catch (err) {
    console.error("QR Code Generation Error: ", err);
    throw new Error("Failed to generate QR Code");
  }
};

/**
 * Patient requests a new appointment
 * 
 * @param {string} patientId - The patient's userId
 * @param {Object} data - { doctorId (optional), date, timeSlot (optional), reason }
 * @param {string} ipAddress - Requester IP for audit
 * @returns {Object} Created pending appointment
 */
const requestAppointment = async (patientId, { doctorId, date, timeSlot, reason }, ipAddress) => {
  // --- Validations ---

  // 1. Validate date is not in the past
  const appointmentDate = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (appointmentDate < today) {
    throw new Error("Cannot book appointments in the past");
  }

  // 2. Validate patient exists
  const patient = await User.findOne({ userId: patientId, role: "PATIENT" });
  if (!patient) {
    throw new Error("Patient not found");
  }

  // Optional: If doctorId is provided, validate it
  if (doctorId) {
    const doctor = await User.findOne({ userId: doctorId, role: "DOCTOR" });
    if (!doctor) {
      throw new Error("Doctor not found");
    }
  }

  // Optional: If timeSlot is provided, validate format
  if (timeSlot && !VALID_TIME_SLOTS.includes(timeSlot)) {
    throw new Error(`Invalid time slot. Valid slots: ${VALID_TIME_SLOTS.join(", ")}`);
  }

  // Check if they already have a pending/booked appointment for that same date/time/doctor
  // This is a soft check for the request phase
  if (doctorId && timeSlot) {
    const existing = await Appointment.findOne({
      doctorId,
      date,
      timeSlot,
      status: { $in: ["PENDING_ADMIN_APPROVAL", "CONFIRMED"] }
    });
    if (existing && existing.status === "CONFIRMED") {
      throw new Error("This time slot is already confirmed for the selected doctor");
    }
  }

  // --- Create appointment request ---
  const appointmentId = generateAppointmentId();

  const appointment = new Appointment({
    appointmentId,
    patientId,
    doctorId: doctorId || undefined,
    date,
    timeSlot: timeSlot || undefined,
    reason,
    status: "PENDING_ADMIN_APPROVAL"
  });

  await appointment.save();

  // Audit log
  await auditService.logAuditEvent({
    userId: patientId,
    action: "APPOINTMENT_REQUESTED",
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
 * Admin approves and assigns an appointment request
 */
const approveAppointment = async (appointmentId, { doctorId, date, timeSlot }, adminId, ipAddress) => {
  const appointment = await Appointment.findOne({ appointmentId });
  if (!appointment) throw new Error("Appointment not found");
  if (appointment.status !== "PENDING_ADMIN_APPROVAL") {
    throw new Error(`Appointment is not pending approval (Current status: ${appointment.status})`);
  }

  // Validate doctor & time slot
  const doctor = await User.findOne({ userId: doctorId, role: "DOCTOR" });
  if (!doctor) throw new Error("Assigned doctor not found");
  if (!VALID_TIME_SLOTS.includes(timeSlot)) throw new Error("Invalid time slot");

  // Check double-booking
  const existing = await Appointment.findOne({ doctorId, date, timeSlot, status: "CONFIRMED" });
  if (existing) throw new Error("This slot is already confirmed for the assigned doctor");

  // Update appointment
  appointment.doctorId = doctorId;
  appointment.date = date;
  appointment.timeSlot = timeSlot;
  appointment.status = "CONFIRMED";

  // Generate QR Token
  const qrToken = signQrToken(appointment);
  const qrCode = await generateQrCode(qrToken, appointmentId);
  appointment.qrToken = qrToken;
  appointment.qrCode = qrCode;

  await appointment.save();

  // Create Notifications
  let patientName = "Patient";
  const patient = await User.findOne({ userId: appointment.patientId });
  if (patient) {
    patientName = patient.firstName + " " + patient.lastName;
  }

  await Notification.create({
    userId: appointment.patientId,
    message: `Your appointment request for ${date} at ${timeSlot} has been Confirmed with Dr. ${doctor.lastName}.`,
    type: "SUCCESS"
  });

  await Notification.create({
    userId: doctorId,
    message: `You have a new appointment assigned on ${date} at ${timeSlot} with patient ${patientName}.`,
    type: "INFO"
  });

  // Audit
  await auditService.logAuditEvent({
    userId: adminId,
    action: "APPOINTMENT_APPROVED",
    resource: `/api/appointments/${appointmentId}`,
    method: "PUT",
    outcome: "SUCCESS",
    details: { doctorId, date, timeSlot },
    ipAddress,
    complianceCategory: "HIPAA"
  });

  return appointment;
};

/**
 * Admin rejects an appointment request
 */
const rejectAppointment = async (appointmentId, reason, adminId, ipAddress) => {
  const appointment = await Appointment.findOne({ appointmentId });
  if (!appointment) throw new Error("Appointment not found");
  if (appointment.status !== "PENDING_ADMIN_APPROVAL") {
    throw new Error(`Appointment is not pending approval (Current status: ${appointment.status})`);
  }

  appointment.status = "REJECTED";
  appointment.rejectionReason = reason || "No reason provided by admin";
  await appointment.save();

  // Notify Patient
  await Notification.create({
    userId: appointment.patientId,
    message: `Your appointment request for ${appointment.date} was rejected. Reason: ${appointment.rejectionReason}`,
    type: "ERROR"
  });

  // Audit
  await auditService.logAuditEvent({
    userId: adminId,
    action: "APPOINTMENT_REJECTED",
    resource: `/api/appointments/${appointmentId}`,
    method: "PUT",
    outcome: "SUCCESS",
    details: { reason },
    ipAddress,
    complianceCategory: "HIPAA"
  });

  return appointment;
};

/**
 * Get available time slots for a doctor on a given date
 */
const getAvailableSlots = async (doctorId, date) => {
  // Validate doctor exists
  const doctor = await User.findOne({ userId: doctorId, role: "DOCTOR" });
  if (!doctor) {
    throw new Error("Doctor not found");
  }

  // Find all non-cancelled bookings for this doctor on this date
  const booked = await Appointment.find({
    doctorId,
    date,
    status: { $in: ["CONFIRMED", "BOOKED"] } // Handle legacy "BOOKED" as well if any
  }).select("timeSlot");

  const bookedSlots = new Set(booked.map((a) => a.timeSlot));

  const availableSlots = VALID_TIME_SLOTS.filter(slot => !bookedSlots.has(slot));

  return availableSlots;
};

/**
 * Get unified appointment details by ID
 */
const getAppointmentById = async (appointmentId, requestingUser) => {
  const apt = await Appointment.findOne({ appointmentId });
  if (!apt) throw new Error("Appointment not found");

  // Authorization Check
  if (requestingUser.role === "PATIENT" && apt.patientId !== requestingUser.userId) {
    throw new Error("Access denied");
  }
  if (requestingUser.role === "DOCTOR" && apt.doctorId !== requestingUser.userId) {
    throw new Error("Access denied");
  }

  const patient = await User.findOne({ userId: apt.patientId }).select('userId firstName lastName email');
  const doctor = apt.doctorId
    ? await User.findOne({ userId: apt.doctorId }).select('userId firstName lastName specialty')
    : null;

  return {
    ...apt.toObject(),
    patient,
    doctor
  };
};

/**
 * List appointments with role-based filtering
 */
const listAppointments = async (user, filters = {}) => {
  let query = {};

  if (user.role === "PATIENT") {
    query.patientId = user.userId;
  } else if (user.role === "DOCTOR") {
    query.doctorId = user.userId;
    // Doctors only see confirmed slots
    if (!filters.status) query.status = { $in: ["CONFIRMED", "VERIFIED", "COMPLETED", "CANCELLED", "NO_SHOW"] };
  } else if (user.role === "NURSE" || user.role === "ADMIN") {
    // Admins/Nurses see all with optional filters
    if (filters.patientId) query.patientId = filters.patientId;
    if (filters.doctorId) query.doctorId = filters.doctorId;
  } else {
    throw new Error("Unauthorized to access appointments");
  }

  if (filters.date) {
    query.date = filters.date;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  const appointments = await Appointment.find(query).sort({ date: 1, timeSlot: 1 });

  // Enrich with user names (could use populate if we configured refs differently, but User schema uses string custom IDs)
  const populatedAppointments = await Promise.all(
    appointments.map(async (apt) => {
      const patient = await User.findOne({ userId: apt.patientId }).select('userId firstName lastName email');
      const doctor = apt.doctorId
        ? await User.findOne({ userId: apt.doctorId }).select('userId firstName lastName specialty')
        : null;

      return {
        ...apt.toObject(),
        patient,
        doctor
      };
    })
  );

  return populatedAppointments;
};

/**
 * Verify a patient's QR code at entry (e.g., used by Nurse/Receptionist)
 */
const verifyEntryByNurse = async (appointmentId, token, nurseId, ipAddress) => {
  const appointment = await Appointment.findOne({ appointmentId });
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (appointment.status !== "CONFIRMED" && appointment.status !== "BOOKED") {
    throw new Error(`Appointment cannot be verified. Current status: ${appointment.status}`);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.appointmentId !== appointmentId || payload.purpose !== "HOSPITAL_ENTRY") {
      throw new Error("Invalid Token Context");
    }

    // Verify date is today
    const today = new Date().toISOString().split('T')[0];
    if (payload.date !== today) {
      throw new Error(`Appointment date (${payload.date}) does not match today's date (${today})`);
    }

    // Update status to VERIFIED (arrived)
    appointment.status = "VERIFIED";
    await appointment.save();

    // Audit log
    await auditService.logAuditEvent({
      userId: nurseId,
      action: "PATIENT_VERIFIED",
      resource: `/api/appointments/${appointmentId}`,
      method: "POST",
      outcome: "SUCCESS",
      details: { patientId: appointment.patientId },
      ipAddress,
      complianceCategory: "SECURITY"
    });

    return appointment;

  } catch (err) {
    // Determine specific errors
    const isExpired = err.name === "TokenExpiredError";
    const msg = isExpired ? "QR Code Expired" : "Invalid QR Code Token";

    // Log failed verification attempt
    await auditService.logAuditEvent({
      userId: nurseId,
      action: "QR_VERIFICATION_FAILED",
      resource: `/api/appointments/${appointmentId}`,
      method: "POST",
      outcome: "FAILURE",
      details: { error: msg },
      ipAddress,
      complianceCategory: "SECURITY"
    });

    throw new Error(msg);
  }
};

/**
 * Cancel an appointment
 */
const cancelAppointment = async (appointmentId, user, ipAddress) => {
  const appointment = await Appointment.findOne({ appointmentId });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // Authorization Check
  if (user.role === "PATIENT" && appointment.patientId !== user.userId) {
    throw new Error("Appointment not found or access denied");
  }
  if (user.role === "DOCTOR" && appointment.doctorId !== user.userId) {
    throw new Error("Appointment not found or access denied");
  }

  if (appointment.status !== "CONFIRMED" && appointment.status !== "PENDING_ADMIN_APPROVAL" && appointment.status !== "BOOKED") {
    throw new Error(`Cannot cancel — appointment status is ${appointment.status}`);
  }

  appointment.status = "CANCELLED";
  await appointment.save();

  await auditService.logAuditEvent({
    userId: user.userId,
    action: "APPOINTMENT_CANCELLED",
    resource: `/api/appointments/${appointmentId}`,
    method: "PUT",
    outcome: "SUCCESS",
    ipAddress,
    complianceCategory: "HIPAA"
  });

  return appointment;
};

module.exports = {
  requestAppointment,
  approveAppointment,
  rejectAppointment,
  getAvailableSlots,
  getAppointmentById,
  listAppointments,
  verifyEntryByNurse,
  cancelAppointment
};
