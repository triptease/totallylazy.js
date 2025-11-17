import {date} from '../../src/dates';

describe('core', function () {
    it('months are NOT zero based', function () {
        expect(date(2000, 1, 2).toISOString()).toBe('2000-01-02T00:00:00.000Z');
        expect(date(2001, 2, 28).toISOString()).toBe('2001-02-28T00:00:00.000Z');
    });

    it('defaults to 1st January if no month or date are provided', () => {
        expect(date(2000).toISOString()).toBe('2000-01-01T00:00:00.000Z');
        expect(date(2000, 2).toISOString()).toBe('2000-02-01T00:00:00.000Z');
    });

    it('does not accept date that is nearly correct', function () {
        expect(() => date(2021, 1, 31)).not.toThrow();
        expect(() => date(2021, 2, 28)).not.toThrow();
        expect(() => date(2021, 2, 29)).toThrow();
        expect(() => date(2020, 2, 29)).not.toThrow();
        expect(() => date(2020, 2, 30)).toThrow();
        expect(() => date(2020, 4, 30)).not.toThrow();
        expect(() => date(2020, 4, 31)).toThrow();
    });
});
