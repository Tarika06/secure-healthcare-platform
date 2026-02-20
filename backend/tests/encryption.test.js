const { encryptRecordFields, decryptRecord } = require('../src/services/encryptionService');

describe('Encryption Service Unit Tests', () => {
    const rawData = {
        diagnosis: "Patient has high blood pressure",
        details: "Prescribed Lisinopril 10mg",
        prescription: "Take once daily"
    };

    test('Should encrypt sensitive clinical fields', () => {
        const encrypted = encryptRecordFields(rawData);

        // Assertions: Encrypted fields should not equal original text
        expect(encrypted.diagnosis).not.toBe(rawData.diagnosis);
        expect(encrypted.details).not.toBe(rawData.details);
        expect(encrypted.prescription).not.toBe(rawData.prescription);

        // Assertions: Encrypted fields should be in hex/base64 format (contain colon for our implementation)
        expect(encrypted.diagnosis).toContain(':');
    });

    test('Should decrypt clinical records correctly', () => {
        const encrypted = encryptRecordFields(rawData);
        const recordObject = {
            ...encrypted,
            title: "Routine Checkup",
            patientId: "P101"
        };

        const decrypted = decryptRecord(recordObject);

        // Assertions: Decrypted fields must match original raw data
        expect(decrypted.diagnosis).toBe(rawData.diagnosis);
        expect(decrypted.details).toBe(rawData.details);
        expect(decrypted.prescription).toBe(rawData.prescription);
        expect(decrypted.title).toBe("Routine Checkup"); // Non-encrypted field should remain untouched
    });
});
