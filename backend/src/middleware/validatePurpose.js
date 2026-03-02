/**
 * Purpose Validation Middleware
 * 
 * GDPR Article 5(1)(b) — Purpose Limitation:
 * Data collected for specified purposes shall not be processed
 * in a manner incompatible with those purposes.
 * 
 * HIPAA §164.502(a) — Minimum Necessary Rule:
 * Only the minimum necessary PHI for the stated purpose may be disclosed.
 * 
 * This middleware validates that:
 * 1. A valid purpose is provided in requests
 * 2. The purpose matches one of the allowed enum values
 */

const VALID_PURPOSES = ["TREATMENT", "PAYMENT", "RESEARCH", "LEGAL", "EMERGENCY", "INSURANCE"];

const PURPOSE_LABELS = {
    TREATMENT: "Medical Treatment",
    PAYMENT: "Payment / Billing",
    RESEARCH: "Medical Research",
    LEGAL: "Legal Compliance",
    EMERGENCY: "Emergency Access",
    INSURANCE: "Insurance Processing"
};

/**
 * Validates that a purpose field is present and valid in the request body.
 * Used for consent requests and record creation.
 */
const validatePurposeInBody = (req, res, next) => {
    const { purpose } = req.body;

    if (!purpose) {
        return res.status(400).json({
            message: "Purpose is required. Specify why this data is being accessed.",
            validPurposes: VALID_PURPOSES,
            regulation: "GDPR Article 5(1)(b) — Purpose Limitation"
        });
    }

    if (!VALID_PURPOSES.includes(purpose)) {
        return res.status(400).json({
            message: `Invalid purpose: "${purpose}". Must be one of: ${VALID_PURPOSES.join(", ")}`,
            validPurposes: VALID_PURPOSES
        });
    }

    next();
};

/**
 * Filters records by matching their purpose against the consent's purpose.
 * Returns only records that match the consented purpose.
 * 
 * @param {Array} records - Array of medical records
 * @param {string} consentPurpose - The purpose specified in the consent
 * @returns {Object} - { allowed: records matching purpose, denied: records not matching }
 */
const filterRecordsByPurpose = (records, consentPurpose) => {
    const allowed = records.filter(record => {
        // Records default to TREATMENT if no purpose set (backward compatibility)
        const recordPurpose = record.purpose || "TREATMENT";
        return recordPurpose === consentPurpose;
    });

    const denied = records.filter(record => {
        const recordPurpose = record.purpose || "TREATMENT";
        return recordPurpose !== consentPurpose;
    });

    return { allowed, denied };
};

module.exports = {
    VALID_PURPOSES,
    PURPOSE_LABELS,
    validatePurposeInBody,
    filterRecordsByPurpose
};
