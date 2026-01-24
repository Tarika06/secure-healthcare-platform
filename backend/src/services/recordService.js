const { isConsentValid } = require("./consentService");
const { log } = require("./auditService");

exports.getRecord = async (patientId, doctorId) => {
  if (!(await isConsentValid(patientId, doctorId))) {
    await log({ action: "READ", outcome: "DENIED" });
    throw new Error("Consent required");
  }

  await log({ action: "READ", outcome: "ALLOWED" });
  return "ENCRYPTED_MEDICAL_DATA";
};
