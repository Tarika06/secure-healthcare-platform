const LoggerService = require('../src/services/LoggerService');

describe('Logger Service & Hash Chain Unit Tests', () => {

    test('Should generate deterministic hashes for the same data', () => {
        const data1 = { action: "LOGIN", userId: "P101", timestamp: "2026-01-01T10:00:00Z" };
        const data2 = { action: "LOGIN", userId: "P101", timestamp: "2026-01-01T10:00:00Z" };

        const hash1 = LoggerService.calculateHash(data1);
        const hash2 = LoggerService.calculateHash(data2);

        expect(hash1).toBe(hash2);
    });

    test('Should generate different hashes for different data', () => {
        const data1 = { action: "LOGIN", userId: "P101" };
        const data2 = { action: "LOGOUT", userId: "P101" };

        const hash1 = LoggerService.calculateHash(data1);
        const hash2 = LoggerService.calculateHash(data2);

        expect(hash1).not.toBe(hash2);
    });

    test('Should handle object key sorting (Immutability property)', () => {
        // Even if keys are in different order, the hash should be the same
        const data1 = { a: 1, b: 2 };
        const data2 = { b: 2, a: 1 };

        const hash1 = LoggerService.calculateHash(data1);
        const hash2 = LoggerService.calculateHash(data2);

        expect(hash1).toBe(hash2);
    });
});
