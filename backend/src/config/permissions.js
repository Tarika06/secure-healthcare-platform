/**
 * Permissions Configuration
 * 
 * RBAC Permission Matrix for Secure Healthcare Platform
 * Defines all valid roles and their permissions
 */

const ROLES = {
    PATIENT: 'PATIENT',
    DOCTOR: 'DOCTOR',
    NURSE: 'NURSE',
    LAB_TECHNICIAN: 'LAB_TECHNICIAN',
    ADMIN: 'ADMIN'
};

const ROLE_PREFIXES = {
    P: ROLES.PATIENT,
    D: ROLES.DOCTOR,
    N: ROLES.NURSE,
    L: ROLES.LAB_TECHNICIAN,
    A: ROLES.ADMIN
};

/**
 * Permission Matrix
 * Defines what each role can do in the system
 */
const PERMISSIONS = {
    [ROLES.PATIENT]: {
        canView: ['OWN_RECORDS', 'OWN_CONSENTS', 'ACCESS_HISTORY'],
        canCreate: ['CONSENT_RESPONSE'],
        canModify: ['OWN_CONSENT'],
        canDelete: []
    },
    [ROLES.DOCTOR]: {
        canView: ['PATIENT_RECORDS_WITH_CONSENT', 'OWN_CREATED_RECORDS', 'LAB_RESULTS', 'ANALYTICS'],
        canCreate: ['MEDICAL_RECORD', 'PRESCRIPTION', 'DIAGNOSIS', 'CONSENT_REQUEST'],
        canModify: ['OWN_CREATED_RECORDS'],
        canDelete: []
    },
    [ROLES.NURSE]: {
        canView: ['PATIENT_VITALS', 'CARE_NOTES'],
        canCreate: ['CARE_NOTE'],
        canModify: [],
        canDelete: [],
        cannotView: ['DIAGNOSIS', 'PRESCRIPTION', 'DETAILED_MEDICAL_HISTORY']
    },
    [ROLES.LAB_TECHNICIAN]: {
        canView: ['OWN_UPLOADS'],
        canCreate: ['LAB_RESULT'],
        canModify: [],
        canDelete: [],
        cannotView: ['PATIENT_RECORDS', 'DIAGNOSIS', 'PRESCRIPTION']
    },
    [ROLES.ADMIN]: {
        canView: ['ALL_USERS', 'AUDIT_LOGS', 'SYSTEM_STATS', 'ANONYMIZED_ANALYTICS'],
        canCreate: [],
        canModify: ['USER_STATUS', 'USER_ROLE'],
        canDelete: [],
        cannotView: ['RAW_MEDICAL_RECORDS'],
        cannotModify: ['MEDICAL_RECORDS']
    }
};

/**
 * Check if a role is valid
 */
const isValidRole = (role) => Object.values(ROLES).includes(role);

/**
 * Get all valid roles
 */
const getValidRoles = () => Object.values(ROLES);

/**
 * Get role from user ID prefix
 */
const getRoleFromPrefix = (prefix) => ROLE_PREFIXES[prefix.toUpperCase()] || null;

/**
 * Get prefix for a role
 */
const getPrefixForRole = (role) => {
    for (const [prefix, r] of Object.entries(ROLE_PREFIXES)) {
        if (r === role) return prefix;
    }
    return null;
};

/**
 * Check if role has a specific permission
 */
const hasPermission = (role, action, resource) => {
    const permissions = PERMISSIONS[role];
    if (!permissions) return false;

    if (permissions[action] && permissions[action].includes(resource)) {
        return true;
    }
    return false;
};

module.exports = {
    ROLES,
    ROLE_PREFIXES,
    PERMISSIONS,
    isValidRole,
    getValidRoles,
    getRoleFromPrefix,
    getPrefixForRole,
    hasPermission
};
