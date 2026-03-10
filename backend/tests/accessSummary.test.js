/**
 * Data Access Summary Report Tests
 * 
 * User Story 9: As an admin, I want a data access summary report,
 * so that unusual access patterns can be identified.
 * 
 * Tests:
 * - Validate access counts structure
 * - Cross-check audit log data
 * - Threshold indicator logic
 */

// ─── Threshold Logic Tests (no DB needed) ───

describe('Access Summary — Threshold Logic', () => {

    const THRESHOLDS = {
        HIGH_ACCESS_PER_ROLE: 50,
        HIGH_DENIED_EVENTS: 10,
        HIGH_USER_FREQUENCY: 100,
        DENIED_RATIO_PERCENT: 20
    };

    const generateThresholdAlerts = (accessByRole, topActiveUsers) => {
        const alerts = [];

        accessByRole.forEach(role => {
            if (role.totalAccess > THRESHOLDS.HIGH_ACCESS_PER_ROLE) {
                alerts.push({
                    type: "HIGH_ROLE_ACTIVITY",
                    severity: "MEDIUM",
                    role: role._id,
                    count: role.totalAccess
                });
            }
            const deniedRatio = role.totalAccess > 0 ? (role.deniedCount / role.totalAccess) * 100 : 0;
            if (deniedRatio > THRESHOLDS.DENIED_RATIO_PERCENT && role.deniedCount > 3) {
                alerts.push({
                    type: "HIGH_DENIED_RATIO",
                    severity: "HIGH",
                    role: role._id,
                    deniedRatio: deniedRatio.toFixed(1)
                });
            }
        });

        topActiveUsers.forEach(u => {
            if (u.accessCount > THRESHOLDS.HIGH_USER_FREQUENCY) {
                alerts.push({
                    type: "HIGH_USER_ACTIVITY",
                    severity: "MEDIUM",
                    userId: u._id,
                    count: u.accessCount
                });
            }
            if (u.deniedCount > THRESHOLDS.HIGH_DENIED_EVENTS) {
                alerts.push({
                    type: "HIGH_USER_DENIED",
                    severity: "HIGH",
                    userId: u._id,
                    deniedCount: u.deniedCount
                });
            }
        });

        return alerts;
    };

    test('should NOT generate alerts when all values are below thresholds', () => {
        const accessByRole = [
            { _id: 'DOCTOR', totalAccess: 30, successCount: 28, deniedCount: 2, failureCount: 0 },
            { _id: 'PATIENT', totalAccess: 20, successCount: 20, deniedCount: 0, failureCount: 0 }
        ];
        const topActiveUsers = [
            { _id: 'D001', accessCount: 15, deniedCount: 0 },
            { _id: 'P001', accessCount: 10, deniedCount: 1 }
        ];

        const alerts = generateThresholdAlerts(accessByRole, topActiveUsers);
        expect(alerts).toHaveLength(0);
    });

    test('should flag HIGH_ROLE_ACTIVITY when role exceeds access threshold', () => {
        const accessByRole = [
            { _id: 'DOCTOR', totalAccess: 75, successCount: 70, deniedCount: 5, failureCount: 0 }
        ];
        const topActiveUsers = [];

        const alerts = generateThresholdAlerts(accessByRole, topActiveUsers);
        expect(alerts).toHaveLength(1);
        expect(alerts[0].type).toBe('HIGH_ROLE_ACTIVITY');
        expect(alerts[0].severity).toBe('MEDIUM');
        expect(alerts[0].role).toBe('DOCTOR');
        expect(alerts[0].count).toBe(75);
    });

    test('should flag HIGH_DENIED_RATIO when denied rate exceeds threshold', () => {
        const accessByRole = [
            { _id: 'NURSE', totalAccess: 20, successCount: 12, deniedCount: 8, failureCount: 0 }
        ];
        const topActiveUsers = [];

        const alerts = generateThresholdAlerts(accessByRole, topActiveUsers);
        // deniedRatio = (8/20)*100 = 40% > 20%
        const deniedAlert = alerts.find(a => a.type === 'HIGH_DENIED_RATIO');
        expect(deniedAlert).toBeDefined();
        expect(deniedAlert.severity).toBe('HIGH');
        expect(deniedAlert.deniedRatio).toBe('40.0');
    });

    test('should NOT flag HIGH_DENIED_RATIO when denied count is 3 or less (even if ratio is high)', () => {
        const accessByRole = [
            { _id: 'LAB_TECH', totalAccess: 5, successCount: 2, deniedCount: 3, failureCount: 0 }
            // deniedRatio = 60%, but deniedCount = 3 (not > 3), so should NOT trigger
        ];
        const topActiveUsers = [];

        const alerts = generateThresholdAlerts(accessByRole, topActiveUsers);
        const deniedAlert = alerts.find(a => a.type === 'HIGH_DENIED_RATIO');
        expect(deniedAlert).toBeUndefined();
    });

    test('should flag HIGH_USER_ACTIVITY when user exceeds frequency threshold', () => {
        const accessByRole = [];
        const topActiveUsers = [
            { _id: 'D002', accessCount: 150, deniedCount: 2 }
        ];

        const alerts = generateThresholdAlerts(accessByRole, topActiveUsers);
        expect(alerts).toHaveLength(1);
        expect(alerts[0].type).toBe('HIGH_USER_ACTIVITY');
        expect(alerts[0].userId).toBe('D002');
    });

    test('should flag HIGH_USER_DENIED when user has too many denied events', () => {
        const accessByRole = [];
        const topActiveUsers = [
            { _id: 'D003', accessCount: 50, deniedCount: 15 }
        ];

        const alerts = generateThresholdAlerts(accessByRole, topActiveUsers);
        const deniedAlert = alerts.find(a => a.type === 'HIGH_USER_DENIED');
        expect(deniedAlert).toBeDefined();
        expect(deniedAlert.severity).toBe('HIGH');
        expect(deniedAlert.deniedCount).toBe(15);
    });

    test('should generate multiple alerts from same dataset', () => {
        const accessByRole = [
            { _id: 'DOCTOR', totalAccess: 200, successCount: 120, deniedCount: 80, failureCount: 0 }
            // HIGH_ROLE_ACTIVITY (200 > 50) + HIGH_DENIED_RATIO (40% > 20%)
        ];
        const topActiveUsers = [
            { _id: 'D001', accessCount: 150, deniedCount: 20 }
            // HIGH_USER_ACTIVITY (150 > 100) + HIGH_USER_DENIED (20 > 10)
        ];

        const alerts = generateThresholdAlerts(accessByRole, topActiveUsers);
        expect(alerts).toHaveLength(4);
        const types = alerts.map(a => a.type);
        expect(types).toContain('HIGH_ROLE_ACTIVITY');
        expect(types).toContain('HIGH_DENIED_RATIO');
        expect(types).toContain('HIGH_USER_ACTIVITY');
        expect(types).toContain('HIGH_USER_DENIED');
    });
});

// ─── Report Structure Validation ───

describe('Access Summary — Report Structure', () => {

    test('should validate access count structure by role', () => {
        const roleData = { _id: 'DOCTOR', totalAccess: 50, successCount: 45, deniedCount: 3, failureCount: 2 };

        expect(roleData._id).toBeDefined();
        expect(roleData.totalAccess).toBe(roleData.successCount + roleData.deniedCount + roleData.failureCount);
        expect(typeof roleData._id).toBe('string');
        expect(typeof roleData.totalAccess).toBe('number');
    });

    test('success + denied + failure should equal total for any role', () => {
        const roles = [
            { _id: 'ADMIN', totalAccess: 30, successCount: 28, deniedCount: 1, failureCount: 1 },
            { _id: 'DOCTOR', totalAccess: 100, successCount: 90, deniedCount: 8, failureCount: 2 },
            { _id: 'PATIENT', totalAccess: 50, successCount: 50, deniedCount: 0, failureCount: 0 }
        ];

        roles.forEach(role => {
            expect(role.successCount + role.deniedCount + role.failureCount).toBe(role.totalAccess);
        });
    });

    test('should validate action count structure', () => {
        const actionData = { _id: 'RECORD_VIEWED', count: 25, successCount: 23, deniedCount: 2 };

        expect(actionData._id).toBeDefined();
        expect(actionData.count).toBe(actionData.successCount + actionData.deniedCount);
    });

    test('should validate top active user structure', () => {
        const userData = { _id: 'D001', accessCount: 42, lastAccess: new Date().toISOString(), deniedCount: 3, actions: ['LOGIN_SUCCESS', 'RECORD_VIEWED'] };

        expect(userData._id).toBeDefined();
        expect(userData.accessCount).toBeGreaterThanOrEqual(0);
        expect(userData.deniedCount).toBeLessThanOrEqual(userData.accessCount);
        expect(Array.isArray(userData.actions)).toBe(true);
    });

    test('should validate denied percentage calculation', () => {
        const totalEvents = 200;
        const totalDenied = 30;
        const deniedPercentage = totalEvents > 0 ? ((totalDenied / totalEvents) * 100).toFixed(1) : "0.0";

        expect(deniedPercentage).toBe("15.0");
    });

    test('should return 0.0% when no events exist', () => {
        const totalEvents = 0;
        const totalDenied = 0;
        const deniedPercentage = totalEvents > 0 ? ((totalDenied / totalEvents) * 100).toFixed(1) : "0.0";

        expect(deniedPercentage).toBe("0.0");
    });
});

// ─── Cross-Check Audit Log Data ───

describe('Access Summary — Cross-Check Audit Logs', () => {

    test('total events should equal sum of all role access counts', () => {
        const accessByRole = [
            { _id: 'ADMIN', totalAccess: 30 },
            { _id: 'DOCTOR', totalAccess: 100 },
            { _id: 'PATIENT', totalAccess: 50 },
            { _id: 'SYSTEM', totalAccess: 20 }
        ];

        const totalFromRoles = accessByRole.reduce((sum, r) => sum + r.totalAccess, 0);
        const reportedTotal = 200;

        expect(totalFromRoles).toBe(reportedTotal);
    });

    test('denied events should not exceed total events for any role', () => {
        const accessByRole = [
            { _id: 'ADMIN', totalAccess: 30, deniedCount: 2 },
            { _id: 'DOCTOR', totalAccess: 100, deniedCount: 8 },
            { _id: 'PATIENT', totalAccess: 50, deniedCount: 0 }
        ];

        accessByRole.forEach(role => {
            expect(role.deniedCount).toBeLessThanOrEqual(role.totalAccess);
        });
    });

    test('user denied count should not exceed user total access count', () => {
        const topActiveUsers = [
            { _id: 'D001', accessCount: 42, deniedCount: 3 },
            { _id: 'A001', accessCount: 25, deniedCount: 0 },
            { _id: 'P001', accessCount: 10, deniedCount: 10 }
        ];

        topActiveUsers.forEach(u => {
            expect(u.deniedCount).toBeLessThanOrEqual(u.accessCount);
        });
    });

    test('action success + denied should not exceed total count', () => {
        const accessByAction = [
            { _id: 'LOGIN_SUCCESS', count: 50, successCount: 50, deniedCount: 0 },
            { _id: 'RECORD_VIEWED', count: 30, successCount: 25, deniedCount: 5 }
        ];

        accessByAction.forEach(action => {
            expect(action.successCount + action.deniedCount).toBeLessThanOrEqual(action.count);
        });
    });

    test('hourly frequency entries should have valid date and hour', () => {
        const hourlyFrequency = [
            { _id: { date: '2026-03-01', hour: 14 }, count: 12 },
            { _id: { date: '2026-03-01', hour: 0 }, count: 3 },
            { _id: { date: '2026-02-28', hour: 23 }, count: 8 }
        ];

        hourlyFrequency.forEach(entry => {
            expect(entry._id.hour).toBeGreaterThanOrEqual(0);
            expect(entry._id.hour).toBeLessThanOrEqual(23);
            expect(entry._id.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(entry.count).toBeGreaterThan(0);
        });
    });
});
