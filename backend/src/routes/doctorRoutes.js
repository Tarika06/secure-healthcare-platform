/**
 * Doctor Routes
 * 
 * HIPAA/GDPR Compliance:
 * - Doctors can view their dashboard with statistics
 * - Doctors can see summary of records they created
 */

const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorizeByUserId = require("../middleware/authorizeByUserId");
const MedicalRecord = require("../models/MedicalRecord");
const Consent = require("../models/Consent");

/**
 * GET /api/doctor/dashboard
 * Doctor dashboard with statistics
 */
router.get(
  "/dashboard",
  authenticate,
  authorizeByUserId(["D"]),
  async (req, res) => {
    try {
      const doctorId = req.user.userId;

      // Get count of records created by this doctor
      const recordsCreated = await MedicalRecord.countDocuments({ createdBy: doctorId });

      // Get count of active consents (patients who granted access)
      const activeConsents = await Consent.countDocuments({
        doctorId,
        status: "ACTIVE"
      });

      // Get pending consent requests
      const pendingRequests = await Consent.countDocuments({
        doctorId,
        status: "PENDING"
      });

      // Get unique patients this doctor has created records for
      const uniquePatients = await MedicalRecord.distinct("patientId", { createdBy: doctorId });

      res.json({
        message: "Doctor dashboard access granted",
        user: req.user,
        stats: {
          recordsCreated,
          activeConsents,
          pendingRequests,
          patientsServed: uniquePatients.length
        }
      });
    } catch (error) {
      console.error("Error fetching doctor dashboard:", error);
      res.status(500).json({ message: "Error fetching dashboard" });
    }
  }
);

/**
 * GET /api/doctor/my-patients
 * List of patients this doctor has created records for
 */
router.get(
  "/my-patients",
  authenticate,
  authorizeByUserId(["D"]),
  async (req, res) => {
    try {
      const doctorId = req.user.userId;
      const User = require("../models/User");

      // Get unique patients this doctor has records for
      const patientIds = await MedicalRecord.distinct("patientId", { createdBy: doctorId });

      // Get patient details
      const patients = await User.find({ userId: { $in: patientIds } })
        .select("userId firstName lastName email")
        .lean();

      // Add record count per patient
      const enrichedPatients = await Promise.all(patients.map(async (patient) => {
        const recordCount = await MedicalRecord.countDocuments({
          patientId: patient.userId,
          createdBy: doctorId
        });

        // Check consent status
        const consent = await Consent.findOne({
          patientId: patient.userId,
          doctorId,
          status: "ACTIVE"
        });

        return {
          ...patient,
          recordCount,
          hasConsent: !!consent
        };
      }));

      res.json({
        message: "Patients retrieved successfully",
        patients: enrichedPatients,
        totalCount: enrichedPatients.length
      });
    } catch (error) {
      console.error("Error fetching doctor's patients:", error);
      res.status(500).json({ message: "Error fetching patients" });
    }
  }
);

module.exports = router;

