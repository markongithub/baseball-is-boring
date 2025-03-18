import { startTimeUTC } from '../app/lib/baseball';

describe('convertToUTCWithMoment', () => {
    test('whatever', () => {
        const result = startTimeUTC("2025-03-13", "1:05 PM", "US/Arizona").toISOString();
        expect(result).toBe("2025-03-13T20:05:00.000Z");
    });

});