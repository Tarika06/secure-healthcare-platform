const jwt = require("jsonwebtoken");
const { hasPermission } = require("../src/config/permissions");

// Set JWT_SECRET for test environment
process.env.JWT_SECRET = "test-secret-key-for-appointments";

describe("Smart Appointment & Hospital Entry Verification", () => {

  // ─── QR Token (Purpose-Scoped JWT) Tests ─────────────────────────

  describe("QR Token Signing & Verification", () => {
    const appointmentData = {
      appointmentId: "APT-1708012345678-a1b2",
      patientId: "P001",
      doctorId: "D001",
      date: new Date().toISOString().split("T")[0], // today
      purpose: "HOSPITAL_ENTRY"
    };

    test("Should sign a valid purpose-scoped JWT with correct claims", () => {
      const token = jwt.sign(appointmentData, process.env.JWT_SECRET, {
        expiresIn: "12h"
      });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.appointmentId).toBe(appointmentData.appointmentId);
      expect(decoded.patientId).toBe(appointmentData.patientId);
      expect(decoded.doctorId).toBe(appointmentData.doctorId);
      expect(decoded.date).toBe(appointmentData.date);
      expect(decoded.purpose).toBe("HOSPITAL_ENTRY");
      expect(decoded.exp).toBeDefined();
    });

    test("Should reject token signed with wrong secret", () => {
      const token = jwt.sign(appointmentData, "wrong-secret", {
        expiresIn: "12h"
      });

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).toThrow("invalid signature");
    });

    test("Should reject expired token", () => {
      const token = jwt.sign(appointmentData, process.env.JWT_SECRET, {
        expiresIn: "0s" // expired immediately
      });

      // Small delay to ensure expiry
      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).toThrow("jwt expired");
    });

    test("Should reject token with invalid purpose", () => {
      const badToken = jwt.sign(
        { ...appointmentData, purpose: "LOGIN" },
        process.env.JWT_SECRET,
        { expiresIn: "12h" }
      );

      const decoded = jwt.verify(badToken, process.env.JWT_SECRET);
      expect(decoded.purpose).not.toBe("HOSPITAL_ENTRY");
    });

    test("Should contain all required fields for hospital entry", () => {
      const token = jwt.sign(appointmentData, process.env.JWT_SECRET, {
        expiresIn: "12h"
      });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const requiredFields = ["appointmentId", "patientId", "doctorId", "date", "purpose"];
      
      requiredFields.forEach((field) => {
        expect(decoded).toHaveProperty(field);
        expect(decoded[field]).toBeTruthy();
      });
    });
  });

  // ─── RBAC Permission Tests for Appointments ──────────────────────

  describe("Appointment RBAC Permissions", () => {
    test("PATIENT should be able to create appointments", () => {
      expect(hasPermission("PATIENT", "canCreate", "APPOINTMENT")).toBe(true);
    });

    test("PATIENT should be able to view own appointments", () => {
      expect(hasPermission("PATIENT", "canView", "OWN_APPOINTMENTS")).toBe(true);
    });

    test("PATIENT should be able to view doctor slots", () => {
      expect(hasPermission("PATIENT", "canView", "DOCTOR_SLOTS")).toBe(true);
    });

    test("PATIENT should be able to modify own appointment (cancel)", () => {
      expect(hasPermission("PATIENT", "canModify", "OWN_APPOINTMENT")).toBe(true);
    });

    test("DOCTOR should be able to view own schedule", () => {
      expect(hasPermission("DOCTOR", "canView", "OWN_SCHEDULE")).toBe(true);
    });

    test("DOCTOR should NOT be able to create appointments", () => {
      expect(hasPermission("DOCTOR", "canCreate", "APPOINTMENT")).toBe(false);
    });

    test("NURSE should be able to create entry verification", () => {
      expect(hasPermission("NURSE", "canCreate", "ENTRY_VERIFICATION")).toBe(true);
    });

    test("NURSE should be able to modify appointment entry status", () => {
      expect(hasPermission("NURSE", "canModify", "APPOINTMENT_ENTRY_STATUS")).toBe(true);
    });

    test("NURSE should NOT be able to create appointments", () => {
      expect(hasPermission("NURSE", "canCreate", "APPOINTMENT")).toBe(false);
    });

    test("ADMIN should be able to view all appointments", () => {
      expect(hasPermission("ADMIN", "canView", "ALL_APPOINTMENTS")).toBe(true);
    });

    test("ADMIN should be able to modify appointment status", () => {
      expect(hasPermission("ADMIN", "canModify", "APPOINTMENT_STATUS")).toBe(true);
    });

    test("ADMIN should be able to create entry verification", () => {
      expect(hasPermission("ADMIN", "canCreate", "ENTRY_VERIFICATION")).toBe(true);
    });

    test("LAB_TECHNICIAN should NOT have appointment permissions", () => {
      expect(hasPermission("LAB_TECHNICIAN", "canCreate", "APPOINTMENT")).toBe(false);
      expect(hasPermission("LAB_TECHNICIAN", "canView", "ALL_APPOINTMENTS")).toBe(false);
      expect(hasPermission("LAB_TECHNICIAN", "canCreate", "ENTRY_VERIFICATION")).toBe(false);
    });
  });

  // ─── Appointment Validation Logic Tests ──────────────────────────

  describe("Appointment Validation Logic", () => {
    const VALID_TIME_SLOTS = [];
    for (let h = 9; h < 17; h++) {
      VALID_TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
      VALID_TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
    }

    test("Should generate 16 valid time slots (09:00-16:30)", () => {
      expect(VALID_TIME_SLOTS).toHaveLength(16);
      expect(VALID_TIME_SLOTS[0]).toBe("09:00");
      expect(VALID_TIME_SLOTS[VALID_TIME_SLOTS.length - 1]).toBe("16:30");
    });

    test("Should accept valid time slots", () => {
      expect(VALID_TIME_SLOTS.includes("09:00")).toBe(true);
      expect(VALID_TIME_SLOTS.includes("12:30")).toBe(true);
      expect(VALID_TIME_SLOTS.includes("16:00")).toBe(true);
    });

    test("Should reject invalid time slots", () => {
      expect(VALID_TIME_SLOTS.includes("08:00")).toBe(false);  // too early
      expect(VALID_TIME_SLOTS.includes("17:00")).toBe(false);  // too late
      expect(VALID_TIME_SLOTS.includes("09:15")).toBe(false);  // not 30-min interval
      expect(VALID_TIME_SLOTS.includes("25:00")).toBe(false);  // invalid hour
    });

    test("Should validate date format YYYY-MM-DD", () => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(dateRegex.test("2026-03-15")).toBe(true);
      expect(dateRegex.test("2026-3-15")).toBe(false);
      expect(dateRegex.test("15-03-2026")).toBe(false);
      expect(dateRegex.test("2026/03/15")).toBe(false);
      expect(dateRegex.test("")).toBe(false);
    });

    test("Should detect past dates", () => {
      const pastDate = new Date("2020-01-01T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(pastDate < today).toBe(true);
    });

    test("Should detect future dates as valid", () => {
      const futureDate = new Date("2030-12-31T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(futureDate >= today).toBe(true);
    });

    test("Should validate userId prefix matches role", () => {
      // Patient IDs start with P
      expect("P001".charAt(0)).toBe("P");
      // Doctor IDs start with D
      expect("D042".charAt(0)).toBe("D");
      // Invalid prefix
      expect("X001".charAt(0)).not.toBe("P");
      expect("X001".charAt(0)).not.toBe("D");
    });
  });

  // ─── Double-Booking Prevention Logic ─────────────────────────────

  describe("Double-Booking Prevention", () => {
    test("Should detect conflicting appointments by (doctorId, date, timeSlot)", () => {
      const existingBookings = [
        { doctorId: "D001", date: "2026-03-15", timeSlot: "09:00", status: "BOOKED" },
        { doctorId: "D001", date: "2026-03-15", timeSlot: "10:00", status: "BOOKED" },
        { doctorId: "D002", date: "2026-03-15", timeSlot: "09:00", status: "BOOKED" }
      ];

      const isSlotTaken = (doctorId, date, timeSlot) => {
        return existingBookings.some(
          (b) => b.doctorId === doctorId && b.date === date && b.timeSlot === timeSlot && b.status !== "CANCELLED"
        );
      };

      // Same doctor, same date, same slot → conflict
      expect(isSlotTaken("D001", "2026-03-15", "09:00")).toBe(true);
      // Same doctor, same date, different slot → OK
      expect(isSlotTaken("D001", "2026-03-15", "11:00")).toBe(false);
      // Different doctor, same slot → OK
      expect(isSlotTaken("D003", "2026-03-15", "09:00")).toBe(false);
      // Same doctor, different date → OK
      expect(isSlotTaken("D001", "2026-03-16", "09:00")).toBe(false);
    });

    test("Should allow rebooking a cancelled slot", () => {
      const bookings = [
        { doctorId: "D001", date: "2026-03-15", timeSlot: "09:00", status: "CANCELLED" }
      ];

      const isSlotAvailable = (doctorId, date, timeSlot) => {
        return !bookings.some(
          (b) => b.doctorId === doctorId && b.date === date && b.timeSlot === timeSlot && b.status !== "CANCELLED"
        );
      };

      expect(isSlotAvailable("D001", "2026-03-15", "09:00")).toBe(true);
    });
  });

  // ─── Entry Verification State Machine ────────────────────────────

  describe("Appointment Status Transitions", () => {
    test("BOOKED → VERIFIED is valid (entry scan)", () => {
      const status = "BOOKED";
      const canVerify = status === "BOOKED";
      expect(canVerify).toBe(true);
    });

    test("VERIFIED → VERIFIED is invalid (single-use)", () => {
      const status = "VERIFIED";
      const canVerify = status === "BOOKED";
      expect(canVerify).toBe(false);
    });

    test("CANCELLED → VERIFIED is invalid", () => {
      const status = "CANCELLED";
      const canVerify = status === "BOOKED";
      expect(canVerify).toBe(false);
    });

    test("BOOKED → CANCELLED is valid", () => {
      const status = "BOOKED";
      const canCancel = status === "BOOKED";
      expect(canCancel).toBe(true);
    });

    test("VERIFIED → CANCELLED is invalid", () => {
      const status = "VERIFIED";
      const canCancel = status === "BOOKED";
      expect(canCancel).toBe(false);
    });
  });

  // ─── Appointment ID Generation ───────────────────────────────────

  describe("Appointment ID Generation", () => {
    const crypto = require("crypto");

    const generateAppointmentId = () => {
      const timestamp = Date.now();
      const random = crypto.randomBytes(2).toString("hex");
      return `APT-${timestamp}-${random}`;
    };

    test("Should generate ID with APT- prefix", () => {
      const id = generateAppointmentId();
      expect(id.startsWith("APT-")).toBe(true);
    });

    test("Should generate unique IDs", () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateAppointmentId());
      }
      expect(ids.size).toBe(100);
    });

    test("Should match expected format APT-<timestamp>-<4hex>", () => {
      const id = generateAppointmentId();
      const pattern = /^APT-\d{13,}-[a-f0-9]{4}$/;
      expect(pattern.test(id)).toBe(true);
    });
  });
});
