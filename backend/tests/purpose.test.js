/**
 * Purpose-Based Report Filtering Tests
 * 
 * User Story 10: As the system, I want reports to be filtered by purpose,
 * so that data usage complies with regulations.
 * 
 * Regulatory Compliance:
 * - GDPR Article 5(1)(b) — Purpose Limitation
 * - HIPAA §164.502(a) — Minimum Necessary Rule
 */

const { filterRecordsByPurpose, VALID_PURPOSES, PURPOSE_LABELS } = require('../src/middleware/validatePurpose');

// ─── Mock Express req/res/next ───
const mockReq = (body = {}) => ({ body });
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const mockNext = jest.fn();

// ─────────────────────────────────────
// TEST SUITE 1: Purpose Validation
// ─────────────────────────────────────

describe('Purpose Validation Middleware', () => {
    const { validatePurposeInBody } = require('../src/middleware/validatePurpose');

    beforeEach(() => {
        mockNext.mockClear();
    });

    test('should reject request without purpose', () => {
        const req = mockReq({ patientId: 'P001' });
        const res = mockRes();

        validatePurposeInBody(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining('Purpose is required'),
                regulation: expect.stringContaining('GDPR')
            })
        );
        expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reject request with invalid purpose', () => {
        const req = mockReq({ patientId: 'P001', purpose: 'INVALID_PURPOSE' });
        const res = mockRes();

        validatePurposeInBody(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining('Invalid purpose')
            })
        );
        expect(mockNext).not.toHaveBeenCalled();
    });

    test('should accept request with valid TREATMENT purpose', () => {
        const req = mockReq({ patientId: 'P001', purpose: 'TREATMENT' });
        const res = mockRes();

        validatePurposeInBody(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    test('should accept all valid purpose values', () => {
        VALID_PURPOSES.forEach(purpose => {
            const next = jest.fn();
            const req = mockReq({ purpose });
            const res = mockRes();

            validatePurposeInBody(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    test('should have labels for all valid purposes', () => {
        VALID_PURPOSES.forEach(purpose => {
            expect(PURPOSE_LABELS[purpose]).toBeDefined();
            expect(typeof PURPOSE_LABELS[purpose]).toBe('string');
        });
    });
});

// ─────────────────────────────────────
// TEST SUITE 2: Purpose-Based Record Filtering
// ─────────────────────────────────────

describe('Purpose-Based Record Filtering', () => {

    const treatmentRecords = [
        { _id: '1', title: 'Checkup', purpose: 'TREATMENT', recordType: 'GENERAL' },
        { _id: '2', title: 'Blood Test', purpose: 'TREATMENT', recordType: 'LAB_RESULT' }
    ];

    const researchRecords = [
        { _id: '3', title: 'Clinical Trial Data', purpose: 'RESEARCH', recordType: 'GENERAL' }
    ];

    const billingRecords = [
        { _id: '4', title: 'Insurance Claim', purpose: 'PAYMENT', recordType: 'GENERAL' }
    ];

    const allRecords = [...treatmentRecords, ...researchRecords, ...billingRecords];

    test('should return only TREATMENT records when consent is for TREATMENT', () => {
        const { allowed, denied } = filterRecordsByPurpose(allRecords, 'TREATMENT');

        expect(allowed).toHaveLength(2);
        expect(denied).toHaveLength(2);
        expect(allowed.every(r => r.purpose === 'TREATMENT')).toBe(true);
    });

    test('should return only RESEARCH records when consent is for RESEARCH', () => {
        const { allowed, denied } = filterRecordsByPurpose(allRecords, 'RESEARCH');

        expect(allowed).toHaveLength(1);
        expect(denied).toHaveLength(3);
        expect(allowed[0].title).toBe('Clinical Trial Data');
    });

    test('should deny ALL records when consent purpose matches nothing', () => {
        const { allowed, denied } = filterRecordsByPurpose(allRecords, 'LEGAL');

        expect(allowed).toHaveLength(0);
        expect(denied).toHaveLength(4);
    });

    test('should treat records without purpose as TREATMENT (backward compatibility)', () => {
        const legacyRecords = [
            { _id: '5', title: 'Old Record', recordType: 'GENERAL' }, // no purpose field
            { _id: '6', title: 'New Record', purpose: 'TREATMENT', recordType: 'GENERAL' }
        ];

        const { allowed, denied } = filterRecordsByPurpose(legacyRecords, 'TREATMENT');

        expect(allowed).toHaveLength(2);
        expect(denied).toHaveLength(0);
    });

    test('should deny legacy records when consent is not for TREATMENT', () => {
        const legacyRecords = [
            { _id: '5', title: 'Old Record', recordType: 'GENERAL' } // no purpose, defaults to TREATMENT
        ];

        const { allowed, denied } = filterRecordsByPurpose(legacyRecords, 'RESEARCH');

        expect(allowed).toHaveLength(0);
        expect(denied).toHaveLength(1);
    });

    test('should handle empty records array', () => {
        const { allowed, denied } = filterRecordsByPurpose([], 'TREATMENT');

        expect(allowed).toHaveLength(0);
        expect(denied).toHaveLength(0);
    });

    test('should correctly split records into allowed and denied', () => {
        const { allowed, denied } = filterRecordsByPurpose(allRecords, 'PAYMENT');

        expect(allowed).toHaveLength(1);
        expect(allowed[0].title).toBe('Insurance Claim');
        expect(denied).toHaveLength(3);
        expect(denied.some(r => r.purpose === 'PAYMENT')).toBe(false);
    });
});

// ─────────────────────────────────────
// TEST SUITE 3: Access Denial for Invalid Purpose
// ─────────────────────────────────────

describe('Access Denial for Invalid Purpose', () => {
    const { validatePurposeInBody } = require('../src/middleware/validatePurpose');

    test('should deny access when purpose is empty string', () => {
        const req = mockReq({ patientId: 'P001', purpose: '' });
        const res = mockRes();

        validatePurposeInBody(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should deny access when purpose is null', () => {
        const req = mockReq({ patientId: 'P001', purpose: null });
        const res = mockRes();

        validatePurposeInBody(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should deny access when purpose is a random string', () => {
        const req = mockReq({ patientId: 'P001', purpose: 'HACKING' });
        const res = mockRes();

        validatePurposeInBody(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining('Invalid purpose')
            })
        );
    });

    test('should deny access for case-sensitive mismatch', () => {
        const req = mockReq({ patientId: 'P001', purpose: 'treatment' }); // lowercase
        const res = mockRes();

        validatePurposeInBody(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('purpose filtering should return 0 allowed records for mismatched purpose', () => {
        const records = [
            { purpose: 'TREATMENT', title: 'Record 1' },
            { purpose: 'TREATMENT', title: 'Record 2' },
            { purpose: 'TREATMENT', title: 'Record 3' }
        ];

        const { allowed } = filterRecordsByPurpose(records, 'RESEARCH');

        expect(allowed).toHaveLength(0);
    });
});
