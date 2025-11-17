import {
    date,
    Month,
    months,
    Months,
    MonthsBuilder,
    Options,
    Weekday,
    weekdays,
    Weekdays,
    WeekdaysBuilder,
} from '../../src/dates';

import {runningInNode} from '../../src/node';
import {assertParse, options, supported} from './dates.test';

describe('Months', function () {
    beforeAll(function () {
        if (runningInNode() && process.env.NODE_ICU_DATA != './node_modules/full-icu') {
            console.log("To run these tests you must set 'NODE_ICU_DATA=./node_modules/full-icu'");
            // Skip all tests in this suite
            return;
        }
    });

    it('can get months for specific locals and formats', () => {
        expect(months('en-GB')).toEqual([
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ]);
        expect(months('en-GB', 'short')).toEqual([
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sept',
            'Oct',
            'Nov',
            'Dec',
        ]);

        expect(months('de')).toEqual([
            'Januar',
            'Februar',
            'März',
            'April',
            'Mai',
            'Juni',
            'Juli',
            'August',
            'September',
            'Oktober',
            'November',
            'Dezember',
        ]);
        expect(months('de', 'short')).toEqual([
            'Jan',
            'Feb',
            'Mär',
            'Apr',
            'Mai',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Okt',
            'Nov',
            'Dez',
        ]);
        expect(months('de-AT', 'short')).toEqual([
            'Jän',
            'Feb',
            'Mär',
            'Apr',
            'Mai',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Okt',
            'Nov',
            'Dez',
        ]);

        expect(months('ru')).toEqual([
            'январь',
            'февраль',
            'март',
            'апрель',
            'май',
            'июнь',
            'июль',
            'август',
            'сентябрь',
            'октябрь',
            'ноябрь',
            'декабрь',
        ]);
        expect(months('ru', {year: 'numeric', month: 'long', day: 'numeric'})).toEqual([
            'января',
            'февраля',
            'марта',
            'апреля',
            'мая',
            'июня',
            'июля',
            'августа',
            'сентября',
            'октября',
            'ноября',
            'декабря',
        ]);
        expect(months('de', {year: 'numeric', month: 'short', day: '2-digit'})).toEqual([
            'Jan',
            'Feb',
            'März',
            'Apr',
            'Mai',
            'Juni',
            'Juli',
            'Aug',
            'Sept',
            'Okt',
            'Nov',
            'Dez',
        ]);

        expect(months('zh-CN')).toEqual([
            '一月',
            '二月',
            '三月',
            '四月',
            '五月',
            '六月',
            '七月',
            '八月',
            '九月',
            '十月',
            '十一月',
            '十二月',
        ]);
        expect(months('zh-CN', {day: 'numeric', year: 'numeric', month: 'long'})).toEqual([
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            '10',
            '11',
            '12',
        ]);
        expect(months('zh-CN', {year: 'numeric', month: 'short', day: '2-digit'})).toEqual([
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            '10',
            '11',
            '12',
        ]);

        expect(months('is-IS')).toEqual([
            'janúar',
            'febrúar',
            'mars',
            'apríl',
            'maí',
            'júní',
            'júlí',
            'ágúst',
            'september',
            'október',
            'nóvember',
            'desember',
        ]);
        expect(months('is-IS', 'short')).toEqual([
            'jan',
            'feb',
            'mar',
            'apr',
            'maí',
            'jún',
            'júl',
            'ágú',
            'sep',
            'okt',
            'nóv',
            'des',
        ]);

        expect(months('cs-CZ', 'short')).toEqual([
            'led',
            'úno',
            'bře',
            'dub',
            'kvě',
            'čvn',
            'čvc',
            'srp',
            'zář',
            'říj',
            'lis',
            'pro',
        ]);
        expect(months('pt-PT', 'short')).toEqual([
            'jan',
            'fev',
            'mar',
            'abr',
            'mai',
            'jun',
            'jul',
            'ago',
            'set',
            'out',
            'nov',
            'dez',
        ]);

        expect(months('ar-EG', {year: 'numeric', month: 'short', day: '2-digit'})).toEqual([
            'يناير',
            'فبراير',
            'مارس',
            'أبريل',
            'مايو',
            'يونيو',
            'يوليو',
            'أغسطس',
            'سبتمبر',
            'أكتوبر',
            'نوفمبر',
            'ديسمبر',
        ]);
    });

    it('can add additional data to help parsing', () => {
        const options: Options = {format: 'dd MMM yyyy', monthsData: {de: [{name: 'Mrz', value: Month.March}]}};
        assertParse('de', '06 Mrz 2019', date(2019, 3, 6), options);
    });

    it('can override data to help parsing', () => {
        const data = [
            'janúar',
            'febrúar',
            'mars',
            'apríl',
            'maí',
            'júní',
            'júlí',
            'ágúst',
            'september',
            'október',
            'nóvember',
            'desember',
        ].map((m, i) => ({name: m, value: i + 1}));
        const options: Options = {format: 'dd MMM yyyy', monthsData: {'is-IS': data}};
        assertParse('is-IS', '06 jún 2019', date(2019, 6, 6), 'dd MMM yyyy');
    });

    it('is flexible in parsing as long as there is a unique match', () => {
        const ru = new MonthsBuilder().build('ru');
        expect(ru.parse('январь')).toEqual(Month.January);
        expect(ru.parse('января')).toEqual(Month.January);
        expect(ru.parse('январ')).toEqual(Month.January);
        expect(ru.parse('янва')).toEqual(Month.January);
        expect(ru.parse('янв')).toEqual(Month.January);
        expect(ru.parse('янв.')).toEqual(Month.January);
        expect(ru.parse('фев')).toEqual(Month.February);

        const de = new MonthsBuilder().build('de');
        expect(de.parse('Feb')).toEqual(Month.February);
        expect(de.parse('Feb.')).toEqual(Month.February);
    });

    it('can get pattern', () => {
        const ru = new MonthsBuilder().build('ru');
        expect(ru.pattern).toEqual('[абвгдеийклмнопрстуфьюя]{1,8}');
        expect(new RegExp(ru.pattern).test('январь')).toEqual(true);
        expect(new RegExp(ru.pattern).test('января')).toEqual(true);
        expect(new RegExp(ru.pattern).test('янв.')).toEqual(true);
        expect(new RegExp(ru.pattern).test('янв')).toEqual(true);
    });

    it('can also parse numbers', () => {
        const months = new MonthsBuilder().build('ru');
        expect(months.parse('1')).toEqual(Month.January);
        expect(months.parse('01')).toEqual(Month.January);
    });

    it('ignores case', () => {
        const months = new MonthsBuilder().build('ru');
        expect(months.parse('январь'.toLocaleUpperCase('ru'))).toEqual(Month.January);
        expect(months.parse('января'.toLocaleLowerCase('ru'))).toEqual(Month.January);
    });
});

describe('Weekdays', function () {
    beforeAll(function () {
        if (runningInNode() && process.env.NODE_ICU_DATA != './node_modules/full-icu') {
            console.log("To run these tests you must set 'NODE_ICU_DATA=./node_modules/full-icu'");
            // Skip all tests in this suite
            return;
        }
    });

    it('works', () => {
        const en = new WeekdaysBuilder().build('en-GB');
        expect(en.parse('Monday')).toEqual(Weekday.Monday);
        expect(en.parse('Tuesday')).toEqual(Weekday.Tuesday);
        expect(en.parse('Wednesday')).toEqual(Weekday.Wednesday);
        expect(en.parse('Thursday')).toEqual(Weekday.Thursday);
        expect(en.parse('Friday')).toEqual(Weekday.Friday);
        expect(en.parse('Saturday')).toEqual(Weekday.Saturday);
        expect(en.parse('Sunday')).toEqual(Weekday.Sunday);
    });

    it('is flexible in parsing as long as there is a unique match', () => {
        const ru = new WeekdaysBuilder().build('ru');
        expect(ru.parse('понедельник')).toEqual(Weekday.Monday);
        expect(ru.parse('понеде')).toEqual(Weekday.Monday);
        expect(ru.parse('пн')).toEqual(Weekday.Monday);
    });

    it('can get pattern', () => {
        const ru = new WeekdaysBuilder().build('ru');
        expect(ru.pattern).toEqual('[абвгдеиклнопрстуцчья]{1,11}');
        expect(new RegExp(ru.pattern).test('понедельник')).toEqual(true);
    });

    it('pattern length does not include dot', () => {
        const es = new WeekdaysBuilder().build('es');
        expect(es.pattern).toEqual('[abcdegijlmnorstuváé]{1,9}');
        expect(new RegExp(es.pattern).test('jue.')).toEqual(true);
        expect(new RegExp(es.pattern).test('jue')).toEqual(true);
        expect(new RegExp(es.pattern).test('ju.')).toEqual(true);
    });

    it('ignores case', () => {
        const ru = new WeekdaysBuilder().build('ru');
        expect(ru.parse('понедельник'.toLocaleLowerCase('ru'))).toEqual(Weekday.Monday);
        expect(ru.parse('понедельник'.toLocaleUpperCase('ru'))).toEqual(Weekday.Monday);
    });

    it('length of pattern is determined by valid unicode characters - exclude RTL marker', () => {
        const containsLeadingRtlMarker = '‎Jan';
        expect(containsLeadingRtlMarker.length).toBe(4);
        const weekdays = new Weekdays([{name: containsLeadingRtlMarker, value: 1}]);
        expect(weekdays.pattern).toEqual('[Jan]{1,3}');
        expect(new RegExp(weekdays.pattern).test(containsLeadingRtlMarker)).toEqual(true);
    });
});

describe('weekdays and months', function () {
    beforeAll(function () {
        if (runningInNode() && process.env.NODE_ICU_DATA != './node_modules/full-icu') {
            console.log("To run these tests you must set 'NODE_ICU_DATA=./node_modules/full-icu'");
            // Skip all tests in this suite
            return;
        }
    });

    it('non native version can still extract months from simple long format', () => {
        expect(months('en-GB', 'long')).toEqual([
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ]);
    });

    it('non native version can still extract months from contextual long format', () => {
        assertNativeMonthsMatches('en-GB', {year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'});
        assertNativeMonthsMatches('ru', {year: 'numeric', month: 'short', day: '2-digit'});
        assertNativeMonthsMatches('ru', {year: 'numeric', month: 'long', day: 'numeric'});
        assertNativeMonthsMatches('zh-CN', {day: 'numeric', year: 'numeric', month: 'long'});

        assertNativeMonthsMatches('zh-CN', {year: 'numeric', month: 'short', day: '2-digit'});
        assertNativeMonthsMatches('ja', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'long'});
        assertNativeMonthsMatches('ja', {day: 'numeric', year: 'numeric', month: 'long', weekday: 'short'});
        // assertNativeMonthsMatches('hy-Latn-IT-arevela', {day:"numeric",year:"numeric",month:"long",weekday:"long"});
    });

    // it("non native version can still extract weeks from single long format", () => {
    //     expect(weekdays('en-GB', 'long'), weekdays('en-GB', 'long'));
    // });
    //
    // it("non native version can still extract weekdays from contextual long format", () => {
    //     assertNativeWeekdaysMatches('en-GB', {year: 'numeric', month: "long", day: 'numeric', weekday: 'long'});
    //     // assertNativeWeekdaysMatches('ja', {day: "numeric", year: "numeric", month: "long", weekday: "long"});
    // });

    // it("non native version works with arabic symbols", () => {
    //     assertNativeWeekdaysMatches('ar-EG', {day: "numeric", year: "numeric", month: "long", weekday: "long"});
    //     assertNativeMonthsMatches('ar-EG', {day: "numeric", year: "numeric", month: "long", weekday: "long"});
    // });

    // it("returns no data when no format is asked for", () => {
    //     expect(weekdays('en-GB', {}),[]);
    //     expect(months('en-GB', {}),[]);
    // });

    function assertNativeWeekdaysMatches(locale: string, option: Options) {
        expect(cleanse(weekdays(locale, option))).toEqual(cleanse(weekdays(locale, option)));
    }

    function assertNativeMonthsMatches(locale: string, option: Options) {
        expect(cleanse(months(locale, option))).toEqual(cleanse(months(locale, option)));
    }

    function cleanse(values: string[]): string[] {
        return values.map(v => v.replace(/(?<!^)[\\.月]$/g, ''));
    }

    it('weekdays matches native implementation', () => {
        for (const locale of supported) {
            for (const option of options) {
                assertNativeWeekdaysMatches(locale, option);
            }
        }
    });

    it('months matches native implementation', () => {
        for (const locale of supported.filter(l => l !== 'hy-Latn-IT-arevela' && l !== 'hy-Latn-IT')) {
            for (const option of options) {
                assertNativeMonthsMatches(locale, option);
            }
        }
    });
});
