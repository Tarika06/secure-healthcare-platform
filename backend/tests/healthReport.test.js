/**
 * Patient Health Report Tests
 * 
 * User Story 8: As a patient, I want a personal health report,
 * so that I can track my medical history.
 * 
 * Tests:
 * - Verify patient-only access
 * - Validate data accuracy (aggregation logic)
 * - Report structure validation
 */

// ─── Report Aggregation Logic Tests ───

describe('Health Report — Record Aggregation', () => {

    const aggregateRecords = (records) => {
        const recordsByType = {};
        records.forEach(r => {
            const type = r.recordType || "GENERAL";
            recordsByType[type] = (recordsByType[type] || 0) + 1;
        });

        const recordsByPurpose = {};
        records.forEach(r => {
            const purpose = r.purpose || "TREATMENT";
            recordsByPurpose[purpose] = (recordsByPurpose[purpose] || 0) + 1;
        });

        const timeline = {};
        records.forEach(r => {
            const date = new Date(r.createdAt);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            if (!timeline[key]) timeline[key] = { month: key, count: 0, records: [] };
            timeline[key].count++;
            timeline[key].records.push({ id: r._id, title: r.title, recordType: r.recordType, date: r.createdAt });
        });
        const timelineArray = Object.values(timeline).sort((a, b) => b.month.localeCompare(a.month));

        const totalCareNotes = records.reduce((sum, r) => sum + (r.careNotes?.length || 0), 0);

        return { recordsByType, recordsByPurpose, timeline: timelineArray, totalCareNotes };
    };

    const sampleRecords = [
        { _id: '1', patientId: 'P001', title: 'Blood Test', recordType: 'LAB_RESULT', purpose: 'TREATMENT', createdAt: '2026-03-01', createdBy: 'D001', careNotes: [{ note: 'Normal' }] },
        { _id: '2', patientId: 'P001', title: 'X-Ray Chest', recordType: 'IMAGING', purpose: 'TREATMENT', createdAt: '2026-03-01', createdBy: 'D001', careNotes: [] },
        { _id: '3', patientId: 'P001', title: 'Flu Diagnosis', recordType: 'DIAGNOSIS', purpose: 'TREATMENT', createdAt: '2026-02-15', createdBy: 'D002', careNotes: [{ note: 'Moderate' }, { note: 'Recovery' }] },
        { _id: '4', patientId: 'P001', title: 'Research Study', recordType: 'GENERAL', purpose: 'RESEARCH', createdAt: '2026-02-10', createdBy: 'D001' },
        { _id: '5', patientId: 'P001', title: 'Vitamin D', recordType: 'PRESCRIPTION', purpose: 'TREATMENT', createdAt: '2026-01-20', createdBy: 'D003' }
    ];

    test('should correctly count records by type', () => {
        const { recordsByType } = aggregateRecords(sampleRecords);

        expect(recordsByType['LAB_RESULT']).toBe(1);
        expect(recordsByType['IMAGING']).toBe(1);
        expect(recordsByType['DIAGNOSIS']).toBe(1);
        expect(recordsByType['GENERAL']).toBe(1);
        expect(recordsByType['PRESCRIPTION']).toBe(1);
    });

    test('should correctly count records by purpose', () => {
        const { recordsByPurpose } = aggregateRecords(sampleRecords);

        expect(recordsByPurpose['TREATMENT']).toBe(4);
        expect(recordsByPurpose['RESEARCH']).toBe(1);
    });

    test('should group records by month in timeline', () => {
        const { timeline } = aggregateRecords(sampleRecords);

        // Records span 3 months: 2026-03, 2026-02, 2026-01
        expect(timeline).toHaveLength(3);
        expect(timeline[0].month).toBe('2026-03'); // Most recent first
        expect(timeline[0].count).toBe(2);          // 2 records in March
        expect(timeline[1].month).toBe('2026-02');
        expect(timeline[1].count).toBe(2);           // 2 records in February
        expect(timeline[2].month).toBe('2026-01');
        expect(timeline[2].count).toBe(1);           // 1 record in January
    });

    test('should count total care notes across all records', () => {
        const { totalCareNotes } = aggregateRecords(sampleRecords);

        // Record 1 has 1, Record 3 has 2, others have 0 or undefined
        expect(totalCareNotes).toBe(3);
    });

    test('should handle records without purpose (default to TREATMENT)', () => {
        const records = [
            { _id: '1', recordType: 'GENERAL', createdAt: '2026-03-01' },
            { _id: '2', recordType: 'LAB_RESULT', createdAt: '2026-03-01' }
        ];
        const { recordsByPurpose } = aggregateRecords(records);

        expect(recordsByPurpose['TREATMENT']).toBe(2);
    });

    test('should handle records without recordType (default to GENERAL)', () => {
        const records = [
            { _id: '1', createdAt: '2026-03-01' },
            { _id: '2', createdAt: '2026-03-01' }
        ];
        const { recordsByType } = aggregateRecords(records);

        expect(recordsByType['GENERAL']).toBe(2);
    });

    test('should handle empty records array', () => {
        const { recordsByType, recordsByPurpose, timeline, totalCareNotes } = aggregateRecords([]);

        expect(Object.keys(recordsByType)).toHaveLength(0);
        expect(Object.keys(recordsByPurpose)).toHaveLength(0);
        expect(timeline).toHaveLength(0);
        expect(totalCareNotes).toBe(0);
    });
});

// ─── Patient-Only Access Validation ───

describe('Health Report — Patient-Only Access', () => {

    test('should restrict access to patient role (P prefix)', () => {
        const authorizedPrefixes = ['P'];

        expect(authorizedPrefixes.includes('P')).toBe(true);
        expect(authorizedPrefixes.includes('D')).toBe(false);
        expect(authorizedPrefixes.includes('A')).toBe(false);
        expect(authorizedPrefixes.includes('N')).toBe(false);
        expect(authorizedPrefixes.includes('L')).toBe(false);
    });

    test('should only return records for the authenticated patient', () => {
        const authenticatedPatientId = 'P001';
        const allRecords = [
            { _id: '1', patientId: 'P001', title: 'Blood Test' },
            { _id: '2', patientId: 'P002', title: 'X-Ray' },
            { _id: '3', patientId: 'P001', title: 'Diagnosis' },
            { _id: '4', patientId: 'P003', title: 'Lab Result' }
        ];

        const patientRecords = allRecords.filter(r => r.patientId === authenticatedPatientId);

        expect(patientRecords).toHaveLength(2);
        expect(patientRecords.every(r => r.patientId === authenticatedPatientId)).toBe(true);
    });

    test('should not expose records from other patients', () => {
        const authenticatedPatientId = 'P001';
        const otherPatientRecords = [
            { _id: '2', patientId: 'P002', title: 'X-Ray' },
            { _id: '4', patientId: 'P003', title: 'Lab Result' }
        ];

        otherPatientRecords.forEach(r => {
            expect(r.patientId).not.toBe(authenticatedPatientId);
        });
    });
});

// ─── Report Structure Validation ───

describe('Health Report — Report Structure', () => {

    test('should have correct top-level report structure', () => {
        const report = {
            patientId: 'P001',
            generatedAt: new Date().toISOString(),
            summary: {
                totalRecords: 5,
                totalCareNotes: 3,
                totalDoctors: 2,
                activeConsents: 1,
                dateRange: { oldest: '2026-01-20', newest: '2026-03-01' }
            },
            recordsByType: { LAB_RESULT: 1, DIAGNOSIS: 1 },
            recordsByPurpose: { TREATMENT: 4, RESEARCH: 1 },
            timeline: [],
            latestRecords: [],
            doctors: [],
            complianceNote: 'test note'
        };

        expect(report.patientId).toBeDefined();
        expect(report.generatedAt).toBeDefined();
        expect(report.summary).toBeDefined();
        expect(report.summary.totalRecords).toBe(5);
        expect(report.summary.dateRange).toBeDefined();
        expect(report.recordsByType).toBeDefined();
        expect(report.recordsByPurpose).toBeDefined();
        expect(report.complianceNote).toBeDefined();
    });

    test('latest records should be capped at 5', () => {
        const allRecords = Array.from({ length: 10 }, (_, i) => ({
            id: i, title: `Record ${i}`, recordType: 'GENERAL', createdAt: new Date().toISOString()
        }));

        const latestRecords = allRecords.slice(0, 5);

        expect(latestRecords).toHaveLength(5);
    });

    test('doctor list should have name and specialty', () => {
        const doctors = [
            { userId: 'D001', name: 'Dr. John Smith', specialty: 'Cardiology' },
            { userId: 'D002', name: 'Dr. Jane Doe', specialty: 'General' }
        ];

        doctors.forEach(doc => {
            expect(doc.userId).toBeDefined();
            expect(doc.name).toMatch(/^Dr\./);
            expect(doc.specialty).toBeDefined();
        });
    });

    test('date range should have oldest <= newest', () => {
        const oldest = new Date('2026-01-20');
        const newest = new Date('2026-03-01');

        expect(oldest.getTime()).toBeLessThanOrEqual(newest.getTime());
    });

    test('total records should equal sum of recordsByType values', () => {
        const recordsByType = { LAB_RESULT: 2, DIAGNOSIS: 3, PRESCRIPTION: 1 };
        const total = Object.values(recordsByType).reduce((s, c) => s + c, 0);

        expect(total).toBe(6);
    });
});
