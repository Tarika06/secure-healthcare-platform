const { analyzeLogs } = require('../src/services/aiService');

describe('AI & Heuristic Security Analysis Unit Tests', () => {

    test('Should detect Brute Force attacks from multiple failed logins', async () => {
        const suspiciousLogs = [
            { userId: "P101", action: "LOGIN_FAILURE", ipAddress: "192.168.1.1" },
            { userId: "P101", action: "LOGIN_FAILURE", ipAddress: "192.168.1.1" },
            { userId: "P101", action: "LOGIN_FAILURE", ipAddress: "192.168.1.1" },
            { userId: "P101", action: "LOGIN_FAILURE", ipAddress: "192.168.1.1" },
            { userId: "P101", action: "LOGIN_FAILURE", ipAddress: "192.168.1.1" }
        ];

        // We use analyzeLogs which falls back to heuristics if no API key is present
        const alerts = await analyzeLogs(suspiciousLogs);

        const bruteForceAlert = alerts.find(a => a.type === "BRUTE_FORCE");
        expect(bruteForceAlert).toBeDefined();
        expect(bruteForceAlert.severity).toBe("HIGH");
        expect(bruteForceAlert.description).toContain("192.168.1.1");
    });

    test('Should detect Unauthorized Access patterns (Repeated Denials)', async () => {
        const suspiciousLogs = [
            { userId: "P101", outcome: "DENIED", action: "VIEW_RECORD" },
            { userId: "P101", outcome: "DENIED", action: "VIEW_RECORD" },
            { userId: "P101", outcome: "DENIED", action: "VIEW_RECORD" }
        ];

        const alerts = await analyzeLogs(suspiciousLogs);

        const accessAlert = alerts.find(a => a.type === "UNAUTHORIZED_ACCESS");
        expect(accessAlert).toBeDefined();
        expect(accessAlert.severity).toBe("MEDIUM");
    });

    test('Should return empty array for normal/safe logs', async () => {
        const safeLogs = [
            { userId: "P101", action: "LOGIN_SUCCESS", outcome: "SUCCESS" },
            { userId: "D202", action: "VIEW_RECORD", outcome: "SUCCESS" }
        ];

        const alerts = await analyzeLogs(safeLogs);
        expect(alerts.length).toBe(0);
    });
});
