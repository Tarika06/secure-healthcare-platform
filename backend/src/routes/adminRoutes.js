/**
 * Admin Routes
 * 
 * HIPAA/GDPR Compliance:
 * - All routes require ADMIN role
 * - All actions are audit logged
 * - Role changes require reason and are tracked in history
 * - Self-role escalation is prevented
 */

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const RoleHistory = require("../models/RoleHistory");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const auditService = require("../services/auditService");
const { isValidRole, getValidRoles } = require("../config/permissions");

<<<<<<< HEAD
// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize(["ADMIN"]));

/**
 * GET /api/admin/dashboard
 * Admin dashboard access
 */
router.get("/dashboard", (req, res) => {
  res.json({
    message: "Admin access granted",
    user: req.user
  });
});

/**
 * GET /api/admin/users
 * List all users with pagination
 */
router.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { userId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } }
      ];
=======
const authenticate = require("../middleware/authenticate")
const authorizeByUserId = require("../middleware/authorizeByUserId");

router.get(
    "/dashboard",
    authenticate,
    authorizeByUserId(["A"]),
    (req, res) => {
        res.json({
            message: "User access granted",
            user: req.user
        });
>>>>>>> 76b01f53ce3ab2940d23c698c81f388243641b02
    }
    
    const users = await User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

/**
 * GET /api/admin/users/:userId
 * Get single user details
 */
router.get("/users/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId })
      .select("-passwordHash");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get role history
    const roleHistory = await RoleHistory.getUserHistory(req.params.userId);
    
    res.json({ user, roleHistory });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Error fetching user" });
  }
});

/**
 * PATCH /api/admin/users/:userId/status
 * Activate or suspend a user account
 */
router.patch("/users/:userId/status", async (req, res) => {
  try {
    const { status, reason } = req.body;
    const targetUserId = req.params.userId;
    const adminUserId = req.user.userId;
    
    // Validate status
    if (!["ACTIVE", "SUSPENDED", "DEACTIVATED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    // Prevent self-suspension
    if (targetUserId === adminUserId && status !== "ACTIVE") {
      await auditService.logAuditEvent({
        userId: adminUserId,
        action: "USER_SUSPENDED",
        resource: `/api/admin/users/${targetUserId}/status`,
        method: "PATCH",
        outcome: "DENIED",
        reason: "SELF_SUSPENSION_PREVENTED",
        targetUserId
      });
      return res.status(403).json({ message: "Cannot suspend your own account" });
    }
    
    // Require reason for suspension
    if (status === "SUSPENDED" && !reason) {
      return res.status(400).json({ message: "Reason is required for suspension" });
    }
    
    const user = await User.findOne({ userId: targetUserId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const previousStatus = user.status;
    
    // Update user status
    user.status = status;
    if (status === "SUSPENDED") {
      user.suspendedAt = new Date();
      user.suspendedBy = adminUserId;
      user.suspensionReason = reason;
    } else if (status === "ACTIVE") {
      user.suspendedAt = undefined;
      user.suspendedBy = undefined;
      user.suspensionReason = undefined;
    }
    
    await user.save();
    
    // Log the action
    const action = status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_ACTIVATED";
    await auditService.logUserAccountChange(adminUserId, targetUserId, action, {
      previousStatus,
      newStatus: status,
      reason
    });
    
    res.json({
      message: `User ${status.toLowerCase()} successfully`,
      user: {
        userId: user.userId,
        status: user.status
      }
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Error updating user status" });
  }
});

/**
 * PATCH /api/admin/users/:userId/role
 * Change user role (with audit trail)
 */
router.patch("/users/:userId/role", async (req, res) => {
  try {
    const { role, reason } = req.body;
    const targetUserId = req.params.userId;
    const adminUserId = req.user.userId;
    
    // Validate role
    if (!isValidRole(role)) {
      return res.status(400).json({ 
        message: "Invalid role",
        validRoles: getValidRoles()
      });
    }
    
    // Require reason
    if (!reason) {
      return res.status(400).json({ message: "Reason is required for role change" });
    }
    
    // Prevent self-role escalation
    if (targetUserId === adminUserId) {
      await auditService.logAuditEvent({
        userId: adminUserId,
        action: "ROLE_CHANGED",
        resource: `/api/admin/users/${targetUserId}/role`,
        method: "PATCH",
        outcome: "DENIED",
        reason: "SELF_ROLE_CHANGE_PREVENTED",
        targetUserId
      });
      return res.status(403).json({ message: "Cannot change your own role" });
    }
    
    const user = await User.findOne({ userId: targetUserId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const previousRole = user.role;
    
    // No change needed
    if (previousRole === role) {
      return res.status(400).json({ message: "User already has this role" });
    }
    
    // Update role
    user.role = role;
    await user.save();
    
    // Record in role history
    await RoleHistory.recordChange({
      userId: targetUserId,
      previousRole,
      newRole: role,
      changedBy: adminUserId,
      reason
    });
    
    // Log the action
    await auditService.logRoleChange(adminUserId, targetUserId, previousRole, role, reason);
    
    res.json({
      message: "Role updated successfully",
      user: {
        userId: user.userId,
        previousRole,
        newRole: role
      }
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Error updating user role" });
  }
});

/**
 * GET /api/admin/users/:userId/role-history
 * Get role change history for a user
 */
router.get("/users/:userId/role-history", async (req, res) => {
  try {
    const history = await RoleHistory.getUserHistory(req.params.userId);
    res.json({ history });
  } catch (error) {
    console.error("Error fetching role history:", error);
    res.status(500).json({ message: "Error fetching role history" });
  }
});

/**
 * GET /api/admin/audit-logs
 * Query audit logs with filters
 */
router.get("/audit-logs", async (req, res) => {
  try {
    const { 
      userId, 
      action, 
      outcome, 
      startDate, 
      endDate,
      page = 1,
      limit = 50
    } = req.query;
    
    const filters = {};
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (outcome) filters.outcome = outcome;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const options = {
      skip: (page - 1) * limit,
      limit: parseInt(limit)
    };
    
    const logs = await auditService.queryAuditLogs(filters, options);
    
    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Error fetching audit logs" });
  }
});

/**
 * GET /api/admin/audit-logs/login-history
 * Get login attempt history
 */
router.get("/audit-logs/login-history", async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const logs = await auditService.getLoginHistory({
      skip: (page - 1) * limit,
      limit: parseInt(limit)
    });
    
    res.json({ logs });
  } catch (error) {
    console.error("Error fetching login history:", error);
    res.status(500).json({ message: "Error fetching login history" });
  }
});

/**
 * GET /api/admin/audit-logs/access-denied
 * Get access denied events
 */
router.get("/audit-logs/access-denied", async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const logs = await auditService.getAccessDeniedEvents({
      skip: (page - 1) * limit,
      limit: parseInt(limit)
    });
    
    res.json({ logs });
  } catch (error) {
    console.error("Error fetching access denied events:", error);
    res.status(500).json({ message: "Error fetching access denied events" });
  }
});

/**
 * GET /api/admin/roles
 * Get list of valid roles
 */
router.get("/roles", (req, res) => {
  res.json({ roles: getValidRoles() });
});

module.exports = router;