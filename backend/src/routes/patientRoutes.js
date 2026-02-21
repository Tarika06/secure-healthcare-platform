/**
 * Patient Routes
 * 
 * HIPAA/GDPR Compliance:
 * - Patients can view their own dashboard
 * - Patients can see who accessed their records (access history)
 */

const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const authorizeByUserId = require("../middleware/authorizeByUserId");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const auditService = require("../services/auditService");

/**
 * GET /api/patient/dashboard
 * Patient dashboard access
 */
router.get(
  "/dashboard",
  authenticate,
  authorizeByUserId(["P"]),
  (req, res) => {
    auditService.logDataAccess(req.user.userId, req.user.userId, "VIEW_DASHBOARD");
    res.json({
      message: "Patient access granted",
      user: req.user
    });
  }
);

/**
 * GET /api/patient/access-history
 * Returns list of who accessed patient's records
 * GDPR Right: Patients have the right to know who accessed their data
 */
router.get(
  "/access-history",
  authenticate,
  authorizeByUserId(["P"]),
  async (req, res) => {
    try {
      const patientId = req.user.userId;
      const { limit = 50, page = 1 } = req.query;

      // Find all record access events for this patient
      const accessLogs = await AuditLog.find({
        targetUserId: patientId,
        action: "RECORD_VIEWED",
        outcome: "SUCCESS"
      })
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean();

      // Get unique accessor userIds
      const accessorIds = [...new Set(accessLogs.map(log => log.userId))];

      // Fetch accessor details
      const accessors = await User.find({ userId: { $in: accessorIds } })
        .select("userId firstName lastName role specialty")
        .lean();

      const accessorMap = {};
      accessors.forEach(a => {
        accessorMap[a.userId] = {
          name: `${a.firstName} ${a.lastName}`,
          role: a.role,
          specialty: a.specialty
        };
      });

      // Enrich logs with accessor info
      const enrichedLogs = accessLogs.map(log => ({
        accessedAt: log.timestamp,
        accessedBy: {
          userId: log.userId,
          ...accessorMap[log.userId]
        },
        resource: log.resource,
        accessType: log.details?.accessType || "RECORD_ACCESS"
      }));

      // Count total for pagination
      const totalCount = await AuditLog.countDocuments({
        targetUserId: patientId,
        action: "RECORD_VIEWED",
        outcome: "SUCCESS"
      });

      res.json({
        message: "Access history retrieved successfully",
        accessHistory: enrichedLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      });

      // Log that the patient viewed their own audit history
      await auditService.logAuditEvent({
        userId: patientId,
        action: "ACCESS_HISTORY_VIEWED",
        resource: "/api/patient/access-history",
        method: "GET",
        outcome: "SUCCESS",
        complianceCategory: "GDPR"
      });
    } catch (error) {
      console.error("Error fetching access history:", error);
      res.status(500).json({ message: "Error fetching access history" });
    }
  }
);

/**
 * GET /api/patient/health-report
 * User Story 8: Patient Personal Health Report
 * Aggregates all medical history for the patient to track their status.
 */
router.get(
  "/health-report",
  authenticate,
  authorizeByUserId(["P"]),
  async (req, res) => {
    try {
      const patientId = req.user.userId;
      const MedicalRecord = require("../models/MedicalRecord");

      // 1. Fetch all records for this patient
      const records = await MedicalRecord.find({ patientId })
        .sort({ createdAt: -1 })
        .lean();

      // 2. Aggregate data types
      const summary = {
        totalRecords: records.length,
        prescriptions: records.filter(r => r.recordType === 'PRESCRIPTION'),
        diagnoses: records.filter(r => r.recordType === 'DIAGNOSIS'),
        labResults: records.filter(r => r.recordType === 'LAB_RESULT'),
        vitals: records.filter(r => r.recordType === 'VITALS'),
        lastConsultation: records[0]?.createdAt || null
      };

      // 3. Audit Logging
      await auditService.logAuditEvent({
        userId: patientId,
        action: "PERSONAL_REPORT_VIEWED",
        resource: "/api/patient/health-report",
        method: "GET",
        outcome: "SUCCESS",
        complianceCategory: "GDPR",
        details: { reportScope: "Full History" }
      });

      res.json({
        message: "Health report aggregated successfully",
        profile: {
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          userId: req.user.userId,
          email: req.user.email
        },
        summary,
        fullHistory: records
      });
    } catch (error) {
      console.error("Health Report Error:", error);
      res.status(500).json({ message: "Failed to generate health report" });
    }
  }
);

module.exports = router;
