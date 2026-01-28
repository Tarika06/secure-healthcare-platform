const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  resource: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true
  },
  outcome: {
    type: String,
    enum: ["SUCCESS", "DENIED"],
    required: true
  },
  reason: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("AuditLog", AuditLogSchema);
