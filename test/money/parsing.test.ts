
import {
    CurrencySymbols,
    format,
    Formatter,
    toPartsPonyfill,
    money,
    moneyFrom,
    parse,
    parser,
    partsFrom,
    PartsFromFormat,
    RegexBuilder,
    symbolFor,
    infer,
    prefer,
} from '../../src/money';
import {locales} from '../dates/dates.test';
import {currencies} from '../../src/money/currencies';
import {runningInNode} from '../../src/node';
import NumberFormatPart = Intl.NumberFormatPart;
import {Currency} from '../../src/money/currencies-def';
import {get} from '../../src/functions';

export const numberLocales = locales.flatMap(locale => get(() => Intl.NumberFormat.supportedLocalesOf(locale), []));
const amounts = [1234567.89, 156, 156.89, 0.1234, 0];

describe('Money', function () {
    jest.setTimeout(10000);

    it('should use exact match for currency code or symbol', function () {
        expect(parser('en').parseAll('23 m')).toEqual([]);
        expect(parser('en').parseAll('23 M')).toEqual([money('LSL', 23)]);
    });

    it('do not use prefer strategy when explicit currency code is present', function () {
        expect(parser('en', {strategy: prefer('USD')}).parseAll('From $220 CAD')).toEqual([money('CAD', 220)]);
    });

    it('can use locale country to infer currency code', function () {
        const locale = 'en-AU';
        expect(parser(locale, {strategy: infer(locale)}).parseAll('From $220')).toEqual([money('AUD', 220)]);
    });

    it('handles when there is a false match on the currency regex', function () {
        expect(parser('en').parseAll('From 1,234.56 USD')).toEqual([money('USD', 1234.56)]);
    });

    it('can parse South African Rand (ZAR/R)', () => {
        expect(parser('en').parse('R1360.00')).toEqual(money('ZAR', 1360));
    });

    it('symbolFor works when no native method is available', () => {
        for (const locale of numberLocales) {
            for (const code of Object.keys(currencies)) {
                const nonNative = symbolFor(locale, code, false);
                const native = symbolFor(locale, code, true);
                expect(nonNative).toBe(native);
            }
        }
    });

    it('formatToPartsPonyfill', function () {
        expect(toPartsPonyfill(money('GBP', 123456.78), 'en')).toEqual([
            {type: 'currency', value: 'GBP'},
            {type: 'literal', value: ' '},
            {type: 'integer', value: '123'},
            {type: 'group', value: ','},
            {type: 'integer', value: '456'},
            {type: 'decimal', value: '.'},
            {type: 'fraction', value: '78'},
        ]);
    });

    it('can parse loads of money!', () => {
        for (const locale of numberLocales) {
            for (const [code, {decimals}] of currenciesWithDifferentDecimals) {
                for (const amount of amounts) {
                    const original = money(code, amount);
                    const expected = money(code, Number(amount.toFixed(decimals)));
                    const formatted = format(original, locale);
                    const parsed = parse(formatted, locale);
                    expect(parsed).toEqual(expected);
                }
            }
        }
    });

    it('can convert parts to money', () => {
        const isoParts: NumberFormatPart[] = [
            {type: 'currency', value: 'EUR'},
            {type: 'literal', value: ' '},
            {type: 'integer', value: '1'},
            {type: 'group', value: ','},
            {type: 'integer', value: '234'},
            {type: 'group', value: ','},
            {type: 'integer', value: '567'},
            {type: 'decimal', value: '.'},
            {type: 'fraction', value: '89'},
        ];

        expect(moneyFrom(isoParts, 'en')).toEqual(money('EUR', 1234567.89));
    });

    it('can convert money to parts', () => {
        expect(partsFrom(money('EUR', 1234567.89), 'en')).toEqual([
            {type: 'currency', value: 'EUR'},
            {type: 'literal', value: '\u00A0'},
            {type: 'integer', value: '1'},
            {type: 'group', value: ','},
            {type: 'integer', value: '234'},
            {type: 'group', value: ','},
            {type: 'integer', value: '567'},
            {type: 'decimal', value: '.'},
            {type: 'fraction', value: '89'},
        ]);
    });

    it('defaults to prefering GBP as all pound currencies are pegged at 1 to 1', () => {
        expect(parse('£157', 'en-GB')).toEqual(money('GBP', 157));
    });

    it('can parse unambiguous real examples', () => {
        expect(parse('US$274', 'ko-KR')).toEqual(money('USD', 274));
        expect(parse('274 US$', 'pt-PT')).toEqual(money('USD', 274));
        expect(parse('CA$315', 'en-US')).toEqual(money('CAD', 315));
        expect(parse('315 $CA', 'fr-FR')).toEqual(money('CAD', 315));
    });

    it('currency symbol can be at back or front', () => {
        expect(parse('€1.234,56', 'de-DE')).toEqual(money('EUR', 1234.56));
        expect(parse('1.234,56 €', 'de-DE')).toEqual(money('EUR', 1234.56));
        expect(parse('EUR 1.234,56', 'de-DE')).toEqual(money('EUR', 1234.56));
        expect(parse('1.234,56 EUR', 'de-DE')).toEqual(money('EUR', 1234.56));
    });

    it('should infer currency if preferred currency is undefined', function () {
        expect(parser('en-AU', {strategy: prefer(undefined)}).parse('$ 2890.30')).toEqual(money('AUD', 2890.3));
    });

    it('can parse ambiguous real examples with a custom strategy', () => {
        expect(parser('en', {strategy: prefer('CNY')}).parse('¥ 2890.30')).toEqual(money('CNY', 2890.3));
        expect(parser('en', {strategy: prefer('CNY')}).parse('GBP 2890.30')).toEqual(money('GBP', 2890.3));
        expect(parser('en', {strategy: prefer('USD')}).parse('$ 433.80')).toEqual(money('USD', 433.8));
        const p = parser('en', {strategy: prefer('USD', 'CNY')});
        expect(p.parse('$ 433.80')).toEqual(money('USD', 433.8));
        expect(p.parse('¥ 2890.30')).toEqual(money('CNY', 2890.3));
        expect(parser('en', {strategy: prefer('KRW')}).parse('₩ 398526.56')).toEqual(money('KRW', 398526.56));
        expect(parser('en').parse('KSh 34,202.20')).toEqual(money('KES', 34202.2));
        expect(parser('en').parse('AED 1204.99')).toEqual(money('AED', 1204.99));

        // This is a weird hotchpotch of formats, semi english decimal with hungarian symbol
        // Hungarian would be 95 065,22 Ft
        // but english could be HUF 95,065.22
        expect(parser('en', {format: 'iii.fff CCC'}).parse('95065.22 Ft')).toEqual(money('HUF', 95065.22));

        expect(parser('en', {format: 'iii.fff CCC'}).parse('80.40 GBP')).toEqual(money('GBP', 80.4));
        expect(
            parser('en', {format: 'iii iii,ff CCC'}).parse('1' + String.fromCharCode(8239) + '025,00 EUR')
        ).toEqual(money('EUR', 1025.0));
        expect(parser('en', {format: 'i,i CCC'}).parse('550,000 IDR')).toEqual(money('IDR', 550000));
    });

    it('can accept format strings directly in the parse method', () => {
        expect(parse('80.40 GBP', 'en', {format: 'iii.fff CCC'})).toEqual(money('GBP', 80.4));
        expect(
            parse('1' + String.fromCharCode(8239) + '025,00 EUR', 'en', {format: 'iii iii,ff CCC'})
        ).toEqual(money('EUR', 1025.0));
        expect(parse('550,000 IDR', 'en', {format: 'i,i CCC'})).toEqual(money('IDR', 550000));
    });

    it('treats all forms of space as the same including nbsp 160 & 8239', () => {
        const spaces = [8239];
        for (const space of spaces) {
            expect(
                parser('fr').parse(`1${String.fromCharCode(space)}025,00${String.fromCharCode(space)}EUR`)
            ).toEqual(money('EUR', 1025.0));
        }
    });

    it('only parses at the word boundary', () => {
        expect(parser('fr').parseAll('1© 2019 Wynn Resorts Holdings, LLC. ')).toEqual([]);
        expect(parser('en').parseAll('Last 1 room remaining')).toEqual([]);
    });

    it('does not match any additional money when they adjoin', function () {
        expect(parser('en').parseAll('You save 11.40 EUR    102.60 EUR')).toEqual([
            money('EUR', 11.4),
            money('EUR', 102.6),
        ]);

        expect(parser('en').parseAll('11.40 EUR 102.60 EUR')).toEqual([money('EUR', 11.4), money('EUR', 102.6)]);

        expect(parser('en').parseAll('EUR 11.40    EUR 102.60')).toEqual([money('EUR', 11.4), money('EUR', 102.6)]);

        // Think this one would need a full grammar as currency is already non-greedy
        //
        // expect(parser('en').parseAll('EUR 11.40 EUR 102.60'),
        //     [money('EUR', 11.4), money('EUR', 102.6)]);
    });

    it('when a format string is provided automatically go into strict mode so the currency symbol has to be exactly where the user specifies', function () {
        expect(parser('en', {format: 'C i,i.f'}).parseAll('You save 11.40 EUR    102.60 EUR')).toEqual([]);
    });

    it('can convert format string to parts', () => {
        const f = 'i,iii.fff CCC';

        const parts: NumberFormatPart[] = PartsFromFormat.format.parse(f);
        expect(parts).toEqual([
            {type: 'integer', value: 'i'},
            {type: 'group', value: ','},
            {type: 'integer', value: 'iii'},
            {type: 'decimal', value: '.'},
            {type: 'fraction', value: 'fff'},
            {type: 'literal', value: ' '},
            {type: 'currency', value: 'CCC'},
        ] as NumberFormatPart[]);
    });

    it('can parse multiple monies in a string', function () {
        expect(parser('en').parseAll('Total: USD 100 Tax: USD 10')).toEqual([money('USD', 100), money('USD', 10)]);
    });

    it('ignores values that are very nearly valid money', function () {
        expect(parser('en').parseAll('Total: USD 100 Tax: USD 10 Nearly: DAN 10')).toEqual([
            money('USD', 100),
            money('USD', 10),
        ]);
    });

    it('has ponyfill for formatToParts', () => {
        for (const locale of numberLocales.filter(l => l != 'hy-Latn-IT-arevela')) {
            for (const [code] of currenciesWithDifferentDecimals) {
                for (const amount of amounts) {
                    const original = money(code, amount);
                    const formatter = Formatter.create(original.currency, locale);
                    const ponyResult = toPartsPonyfill(original, locale);
                    const nativeResult = formatter.formatToParts(original.amount);
                    expect(ponyResult).toEqual(nativeResult);
                }
            }
        }
    });

    it('can parse arabic numerals, separators and symbols', function () {
        expect(parser('ar-EG').parseAll('١٢٬٣٤٥٬٦٧٠٫٨٩ ج.م.‏')).toEqual([money('EGP', 12345670.89)]);
    });
});

export const currenciesWithDifferentDecimals: [string, Currency][] = Object.values(
    Object.entries(currencies).reduce((a, [code, currency]) => {
        a[currency.decimals] = [code, currency];
        return a;
    }, {} as any)
);

describe('CurrencySymbols', function () {
    beforeAll(function () {
        if (runningInNode() && process.env.NODE_ICU_DATA != './node_modules/full-icu') {
            console.log("To run these tests you must set 'NODE_ICU_DATA=./node_modules/full-icu'");
            // Skip all tests in this suite
            return;
        }
    });

    it('is flexible in parsing as long as there is a unique match', () => {
        const fr = CurrencySymbols.get('fr-FR');
        expect(fr.parse('$CA')).toEqual('CAD');
        expect(fr.parse('CAD')).toEqual('CAD');
    });

    it('supports additional 2 digit country code and symbol for $ ¥ £', () => {
        const en = CurrencySymbols.get('en');
        expect(en.parse('CA$')).toEqual('CAD');
        expect(en.parse('$CA')).toEqual('CAD');
        expect(en.parse('US$')).toEqual('USD');
        expect(en.parse('$US')).toEqual('USD');
        expect(en.parse('AU$')).toEqual('AUD');
        expect(en.parse('$AU')).toEqual('AUD');
        expect(en.parse('JP¥')).toEqual('JPY');
        expect(en.parse('¥JP')).toEqual('JPY');
        expect(en.parse('CN¥')).toEqual('CNY');
        expect(en.parse('¥CN')).toEqual('CNY');
        expect(en.parse('GB£')).toEqual('GBP');
        expect(en.parse('£GB')).toEqual('GBP');
        expect(en.parse('GI£')).toEqual('GIP');
        expect(en.parse('£GI')).toEqual('GIP');
    });

    it('can get pattern', () => {
        const en = CurrencySymbols.get('en');
        expect(new RegExp(en.pattern).test('$CA')).toEqual(true);
    });

    it('can also parse the normal ISO code', () => {
        const ru = CurrencySymbols.get('ru');
        expect(ru.parse('USD')).toEqual('USD');
    });
});

describe('RegexBuilder', function () {
    it('buildParts ensures that a currency and a space literal are at the start and end of the produced parts - needed to ensure Safari is as flexible in parsing as the other browsers', () => {
        const parts = RegexBuilder.buildParts(partsFrom(money('GBP', 1), 'en-GB', 'symbol'));
        expect(parts).toEqual([
            {type: 'currency', value: '£'},
            {type: 'literal', value: ' '},
            {type: 'integer', value: '1'},
            {type: 'literal', value: ' '},
            {type: 'currency', value: '£'},
        ]);
    });
});
