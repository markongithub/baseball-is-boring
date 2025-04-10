import { readFileSync } from 'fs';
import { parseGame } from '../app/lib/baseball';
import moment from 'moment';

describe('parseGame', () => {
    test('whatever', () => {
        const testInput = readFileSync('test_data/live_783691.json', 'utf-8');
        const result = parseGame(testInput);
        expect(result).toStrictEqual({
            outs: 1,
            startTime: moment("2025-04-11T19:02:00.000Z")
        });
    });
});