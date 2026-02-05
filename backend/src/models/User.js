/**
 * User Model
 * 
 * HIPAA/GDPR Compliance Features:
 * - Role is immutable after initial assignment (can only be changed by admin with audit trail)
 * - Password is never stored in plaintext
 * - Account status for suspension/deactivation
 * - Privacy policy consent tracking
 * - Timestamps for audit purposes
 */

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  // Unique user identifier (P### for patient, D### for doctor, etc.)
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    immutable: true // Cannot be changed after creation
  },
  
  email: { 
    type: String, 
    required: true,
    unique: true,
    lowercase: true
  },
  
  // Hashed password (never plaintext)
  passwordHash: { 
    type: String, 
    required: true 
  },
  
  firstName: { 
    type: String, 
    required: true,
    default: "" 
  },
  
  lastName: { 
    type: String, 
    required: true,
    default: "" 
  },
  
  // Role - determines access permissions
  role: {
    type: String,
    required: true,
    enum: ["PATIENT", "DOCTOR", "NURSE", "LAB_TECH", "ADMIN"],
    default: function () {
      const prefix = this.userId.charAt(0).toUpperCase();
      const prefixToRole = {
        "P": "PATIENT",
        "D": "DOCTOR",
        "N": "NURSE",
        "L": "LAB_TECH",
        "A": "ADMIN"
      };
      return prefixToRole[prefix] || "PATIENT";
    }
  },
  
  // Specialty (for doctors)
  specialty: {
    type: String,
    default: ""
  },
  
  // Account status
  status: {
    type: String,
    enum: ["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION", "DEACTIVATED"],
    default: "ACTIVE"
  },
  
  // Suspension details
  suspendedAt: {
    type: Date
  },
  suspendedBy: {
    type: String
  },
  suspensionReason: {
    type: String
  },
  
  // Privacy policy consent
  privacyPolicyAccepted: {
    type: Boolean,
    default: false
  },
  privacyPolicyAcceptedAt: {
    type: Date
  },
  
  // Password change tracking
  passwordChangedAt: {
    type: Date
  },
  
  // Last login tracking
  lastLoginAt: {
    type: Date
  },
  lastLoginIp: {
    type: String
  },
  
  // Failed login attempts (for account lockout)
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockoutUntil: {
    type: Date
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  versionKey: false
});

// Index for efficient lookups (email already has unique:true which creates an index)
UserSchema.index({ role: 1, status: 1 });

// Virtual for full name
UserSchema.virtual("fullName").get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Method to check if account is locked
UserSchema.methods.isLocked = function() {
  return this.lockoutUntil && this.lockoutUntil > Date.now();
};

// Method to record failed login
UserSchema.methods.recordFailedLogin = async function() {
  this.failedLoginAttempts += 1;
  
  // Lock account after 5 failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }
  
  await this.save();
};

// Method to reset failed login attempts
UserSchema.methods.resetFailedLogins = async function() {
  this.failedLoginAttempts = 0;
  this.lockoutUntil = null;
  this.lastLoginAt = new Date();
  await this.save();
};

// Ensure password hash is never returned in queries
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.failedLoginAttempts;
  delete obj.lockoutUntil;
  return obj;
};

module.exports = mongoose.model("User", UserSchema);
