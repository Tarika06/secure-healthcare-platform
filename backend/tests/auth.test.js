const { hasPermission, getRoleFromPrefix } = require('../src/config/permissions');

describe('RBAC & Permission Matrix Unit Tests', () => {

    test('Should correctly identify role from UserID prefix', () => {
        expect(getRoleFromPrefix('P')).toBe('PATIENT');
        expect(getRoleFromPrefix('D')).toBe('DOCTOR');
        expect(getRoleFromPrefix('A')).toBe('ADMIN');
        expect(getRoleFromPrefix('N')).toBe('NURSE');
        expect(getRoleFromPrefix('Z')).toBeNull();
    });

    test('Patient should have correct permissions', () => {
        expect(hasPermission('PATIENT', 'canView', 'OWN_RECORDS')).toBe(true);
        expect(hasPermission('PATIENT', 'canCreate', 'MEDICAL_RECORD')).toBe(false);
    });

    test('Doctor should have clinical permissions', () => {
        expect(hasPermission('DOCTOR', 'canCreate', 'MEDICAL_RECORD')).toBe(true);
        expect(hasPermission('DOCTOR', 'canView', 'PATIENT_RECORDS_WITH_CONSENT')).toBe(true);
        expect(hasPermission('DOCTOR', 'canView', 'ALL_USERS')).toBe(false);
    });

    test('Nurse should have limited clinical access', () => {
        expect(hasPermission('NURSE', 'canView', 'PATIENT_VITALS')).toBe(true);
        expect(hasPermission('NURSE', 'canView', 'DIAGNOSIS')).toBe(false);
    });

    test('Admin should have management but no clinical access', () => {
        expect(hasPermission('ADMIN', 'canView', 'AUDIT_LOGS')).toBe(true);
        expect(hasPermission('ADMIN', 'canView', 'RAW_MEDICAL_RECORDS')).toBe(false);
    });
});
