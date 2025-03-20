import { readFileSync } from 'fs';
import { startTimeUTC, totalOutsFromJSON } from '../app/lib/baseball';

describe('startTimeUTC', () => {
    test('whatever', () => {
        const result = startTimeUTC("2025-03-13", "1:05 PM", "US/Arizona").toISOString();
        expect(result).toBe("2025-03-13T20:05:00.000Z");
    });

});

describe('totalOutsFromJSON', () => {
    test('whatever', () => {
        const testInput = readFileSync('test_data/linescore_778927.json', 'utf-8');
        const result = totalOutsFromJSON(testInput);
        expect(result).toBe(13);
    });
});