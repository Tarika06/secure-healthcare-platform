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
 * Personal Health Report — Aggregated summary of patient's medical history
 * 
 * User Story 8: Patient Personal Health Report
 * Restricted to self-only (patient can only view their own report)
 * 
 * HIPAA: Patient right to access their own health information
 * GDPR Article 15: Right of access by the data subject
 */
router.get(
  "/health-report",
  authenticate,
  authorizeByUserId(["P"]),
  async (req, res) => {
    try {
      const patientId = req.user.userId;
      const MedicalRecord = require("../models/MedicalRecord");
      const Consent = require("../models/Consent");
      const { decryptRecord } = require("../services/encryptionService");

      // Fetch ALL patient records (decrypted — patient owns the data)
      const records = await MedicalRecord.find({ patientId }).sort({ createdAt: -1 }).lean();
      const decryptedRecords = records.map(record => decryptRecord(record));

      // 1. Record count by type
      const recordsByType = {};
      decryptedRecords.forEach(r => {
        const type = r.recordType || "GENERAL";
        recordsByType[type] = (recordsByType[type] || 0) + 1;
      });

      // 2. Records by purpose
      const recordsByPurpose = {};
      decryptedRecords.forEach(r => {
        const purpose = r.purpose || "TREATMENT";
        recordsByPurpose[purpose] = (recordsByPurpose[purpose] || 0) + 1;
      });

      // 3. Timeline — group by month
      const timeline = {};
      decryptedRecords.forEach(r => {
        const date = new Date(r.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (!timeline[key]) timeline[key] = { month: key, count: 0, records: [] };
        timeline[key].count++;
        timeline[key].records.push({
          id: r._id,
          title: r.title,
          recordType: r.recordType,
          purpose: r.purpose,
          date: r.createdAt
        });
      });
      const timelineArray = Object.values(timeline).sort((a, b) => b.month.localeCompare(a.month));

      // 4. Latest records (top 5, read-only summary format)
      const latestRecords = decryptedRecords.slice(0, 5).map(r => ({
        id: r._id,
        title: r.title,
        recordType: r.recordType,
        purpose: r.purpose,
        diagnosis: r.diagnosis,
        createdAt: r.createdAt,
        createdBy: r.createdBy
      }));

      // 5. Care notes summary
      const totalCareNotes = decryptedRecords.reduce((sum, r) => sum + (r.careNotes?.length || 0), 0);

      // 6. Doctors who created records
      const doctorIds = [...new Set(decryptedRecords.map(r => r.createdBy).filter(Boolean))];
      const doctors = await User.find({ userId: { $in: doctorIds } })
        .select("userId firstName lastName specialty")
        .lean();

      // 7. Active consents
      const activeConsents = await Consent.find({ patientId, status: "ACTIVE" }).lean();

      // 8. Date range
      const oldestRecord = decryptedRecords.length > 0 ? decryptedRecords[decryptedRecords.length - 1].createdAt : null;
      const newestRecord = decryptedRecords.length > 0 ? decryptedRecords[0].createdAt : null;

      // Log the report access
      await auditService.logAuditEvent({
        userId: patientId,
        action: "VIEW_HEALTH_REPORT",
        resource: "/api/patient/health-report",
        method: "GET",
        outcome: "SUCCESS",
        complianceCategory: "HIPAA",
        details: { totalRecords: decryptedRecords.length }
      });

      res.json({
        message: "Personal health report generated successfully",
        report: {
          patientId,
          generatedAt: new Date().toISOString(),
          summary: {
            totalRecords: decryptedRecords.length,
            totalCareNotes,
            totalDoctors: doctors.length,
            activeConsents: activeConsents.length,
            dateRange: {
              oldest: oldestRecord,
              newest: newestRecord
            }
          },
          recordsByType,
          recordsByPurpose,
          timeline: timelineArray,
          latestRecords,
          doctors: doctors.map(d => ({
            userId: d.userId,
            name: `Dr. ${d.firstName} ${d.lastName}`,
            specialty: d.specialty || "General"
          })),
          complianceNote: "This report is generated under HIPAA Right of Access and GDPR Article 15. Only you can view this report."
        }
      });
    } catch (error) {
      console.error("Error generating health report:", error);
      res.status(500).json({ message: "Error generating health report" });
    }
  }
);

module.exports = router;
