import {date, LearningDateFormatter, format, Formatters, ImprovedDateTimeFormat, Options} from '../../src/dates';

import {options, supported} from './dates.test';
import {runningInNode} from '../../src/node';
import {characters} from '../../src/characters';

describe('FormatToParts', function () {
    beforeAll(function () {
        if (runningInNode() && process.env.NODE_ICU_DATA != './node_modules/full-icu') {
            console.log("To run these tests you must set 'NODE_ICU_DATA=./node_modules/full-icu'");
            // Skip all tests in this suite
            return;
        }
    });

    const d = date(2001, 6, 28);

    function assertPartsMatch(locale: string, option: Options, original: Date) {
        const formatter = Formatters.create(locale, option);
        const expected = formatter.formatToParts(original);
        const actual = LearningDateFormatter.create(locale, option).formatToParts(original);
        expect(actual.map(v => v.value).join('')).toBe(expected.map(v => v.value).join(''));
        expect(actual.map(v => v.type)).toEqual(expected.map(v => v.type));
    }

    it('matches native implementation', () => {
        for (const locale of supported.filter(s => s != 'hy-Latn-IT-arevela')) {
            for (const option of options) {
                assertPartsMatch(locale, option, d);
            }
        }
    });

    it('specific options work', () => {
        assertPartsMatch('hy-Latn-IT-arevela', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'}, d);
        assertPartsMatch('de', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'short'}, d);
        assertPartsMatch('ja', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'short'}, d);
        assertPartsMatch('ja', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'}, d);
        assertPartsMatch('en', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'}, d);
        assertPartsMatch('de', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'}, d);
        assertPartsMatch('ru', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'}, d);
    });

    it('works even when no weekday format is asked for', () => {
        assertPartsMatch('en', {day: 'numeric', year: 'numeric', month: 'long'}, d);
    });
});

describe('ImprovedDateTimeFormat', function () {
    it('strips RTL unicode markers from formatted date', () => {
        const containsLeadingRtlMarker = '‎Friday‎, ‎November‎ ‎20‎, ‎3333';
        expect(containsLeadingRtlMarker.length).toBe(32);
        expect(characters(containsLeadingRtlMarker).length).toBe(25);

        const result = new ImprovedDateTimeFormat('ignored', {}, {
            format(ignore?: Date | number): string {
                return containsLeadingRtlMarker;
            },
        } as any).format(date(2019, 1, 2));
        expect(result.length).toBe(25);
    });

    it('adds formatToParts when missing ', () => {
        const locale = 'en';
        const options: any = {month: 'long'};
        const formatter = new Intl.DateTimeFormat(locale, options);
        // @ts-ignore
        delete formatter.formatToParts;
        const result = new ImprovedDateTimeFormat(locale, options, formatter).formatToParts(date(2019, 1, 2));
        expect(result).toEqual([{type: 'month', value: 'January'}]);
    });
});

describe('format', function () {
    it('can format to parts', () => {
        const formatter = Formatters.create('en-GB', 'yyyy-MM-dd');
        expect(formatter.format(date(2001, 6, 9))).toBe('2001-06-09');
        expect(formatter.formatToParts(date(2001, 6, 9))).toEqual([
            {type: 'year', value: '2001'},
            {type: 'literal', value: '-'},
            {type: 'month', value: '06'},
            {type: 'literal', value: '-'},
            {type: 'day', value: '09'},
        ]);
    });

    it('throws if undefined date is parsed into format', () => {
        expect(() => format(undefined as any, 'en')).toThrow();
    });
});
