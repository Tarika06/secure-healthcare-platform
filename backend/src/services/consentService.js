const Consent = require("../src/models/Consent");

exports.isConsentValid = async (patientId, doctorId) => {
  const consent = await Consent.findOne({
    patientId,
    doctorId,
    status: "ACTIVE"
  });
  return !!consent;
};
