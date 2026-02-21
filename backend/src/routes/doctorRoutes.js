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
const auditService = require("../services/auditService");

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

      await auditService.logDataAccess(doctorId, doctorId, "VIEW_DOCTOR_DASHBOARD", {
        recordsCreated,
        activeConsents,
        patientsServed: uniquePatients.length
      });

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

/**
 * GET /api/doctor/patient/:patientId/clinical-summary
 * Generates a Clinical Summary PDF for a patient
 * Requirement: Doctor must have ACTIVE consent
 */
router.get(
  "/patient/:patientId/clinical-summary",
  authenticate,
  authorizeByUserId(["D"]),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const doctorId = req.user.userId;
      const User = require("../models/User");
      const gdprService = require("../services/gdprService");

      // 1. Verify Active Consent (Critical for HIPAA/GDPR)
      const consent = await Consent.findOne({
        patientId,
        doctorId,
        status: "ACTIVE"
      });

      if (!consent) {
        return res.status(403).json({
          message: "Access Denied. You must have active consent from the patient to generate a clinical summary."
        });
      }

      // 2. Aggregate Data for the report
      const data = await gdprService.aggregatePatientData(patientId);

      // 3. Generate Clinical PDF
      const PDFDocument = require("pdfkit");
      const doc = new PDFDocument({ margin: 50 });

      const filename = `clinical_summary_${patientId}_${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

      doc.pipe(res);

      // Report Header
      doc.fontSize(20).text("CLINICAL PATIENT SUMMARY", { align: "center", underline: true });
      doc.moveDown();

      // Section: Patient Demographics
      doc.fontSize(14).text("1. Patient Information", { bgcolor: "#f0f0f0" });
      doc.fontSize(10).text(`Name: ${data.profile.firstName} ${data.profile.lastName}`);
      doc.text(`Patient ID: ${data.profile.userId}`);
      doc.text(`Report Generated: ${new Date().toLocaleString()}`);
      doc.text(`Requested By: Dr. ${req.user.firstName} ${req.user.lastName}`);
      doc.moveDown();

      // Section: Medical History & Diagnosis
      doc.fontSize(14).text("2. Clinical History & Diagnosis");
      doc.moveDown(0.5);

      const clinicalRecords = data.medicalRecords.filter(r =>
        ["DIAGNOSIS", "LAB_RESULT", "VITALS", "GENERAL"].includes(r.recordType)
      );

      if (clinicalRecords.length === 0) {
        doc.fontSize(10).text("No clinical history records found.", { italic: true });
      } else {
        clinicalRecords.slice(0, 10).forEach((record, idx) => {
          doc.fontSize(11).text(`${idx + 1}. ${record.title} [${record.recordType}]`, { bold: true });
          doc.fontSize(9).text(`Date: ${new Date(record.createdAt).toLocaleDateString()}`);
          doc.text(`Diagnosis: ${record.diagnosis}`);
          doc.text(`Notes: ${record.details.substring(0, 200)}${record.details.length > 200 ? '...' : ''}`);
          doc.moveDown(0.5);
        });
      }
      doc.moveDown();

      // Section: Active Treatment & Prescriptions
      doc.fontSize(14).text("3. Treatment & Prescriptions");
      doc.moveDown(0.5);

      const prescriptions = data.medicalRecords.filter(r => r.recordType === "PRESCRIPTION");

      if (prescriptions.length === 0) {
        doc.fontSize(10).text("No active prescriptions recorded.", { italic: true });
      } else {
        prescriptions.forEach((p, idx) => {
          doc.fontSize(10).text(`${idx + 1}. ${p.title}`, { bold: true });
          doc.text(`Instruction: ${p.prescription}`);
          doc.text(`Date: ${new Date(p.createdAt).toLocaleDateString()}`);
          doc.moveDown(0.3);
        });
      }

      // Footer - Privacy Notice
      doc.moveDown(2);
      doc.fontSize(8).text("CONFIDENTIAL MEDICAL RECORD", { align: "center", color: "red" });
      doc.text("Disclosing this information to unauthorized parties is a violation of HIPAA/GDPR regulations.", { align: "center" });

      doc.end();

      // Audit Log for Clinical Report Generation
      await auditService.logAuditEvent({
        userId: doctorId,
        action: "CLINICAL_SUMMARY_GENERATED",
        resource: `/api/doctor/patient/${patientId}/clinical-summary`,
        method: "GET",
        outcome: "SUCCESS",
        targetUserId: patientId,
        complianceCategory: "HIPAA",
        details: { reason: "Consultation Review" }
      });

    } catch (error) {
      console.error("Clinical Summary Error:", error);
      res.status(500).json({ message: "Error generating clinical summary" });
    }
  }
);

module.exports = router;

