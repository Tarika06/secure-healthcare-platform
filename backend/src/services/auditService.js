const AuditLog = require("../models/AuditLog");

const logAuditEvent =  async(data) => {
  try{
    await AuditLog.create(data);
    console.log("AUDIT LOG SAVED : ",data);
  } catch (error){
    console.error("AUDIT LOG FAILED:", error.message);
  }
};

module.exports = { logAuditEvent }
