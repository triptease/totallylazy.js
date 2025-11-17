import {infer, money, prefer} from '../../src/money';
import {NumberParser, numberParser} from '../../src/dates/formatting';
import {
    flexibleMoneyParser,
    flexibleParse,
    implicitMoneyParser,
    ImplicitMoneyParserOptions,
} from '../../src/money/flexible-parsing';

describe('ImplicitMoneyParser', () => {
    it(`handles bad inputs`, function () {
        expect(() => implicitMoneyParser({currency: 'GBP', locale: 'en'}).parse(undefined as any)).toThrow(
            /Expected string/
        );
        expect(implicitMoneyParser({currency: 'GBP', locale: 'en'}).parseAll(null as any)).toEqual([]);
        expect(implicitMoneyParser({currency: 'GBP', locale: 'en'}).parseAll(0.1 as any)).toEqual([]);
    });

    it('can parse and convert a number with a currency provided else where', function () {
        expect(implicitMoneyParser({currency: 'GBP'}).parse('1.23')).toEqual({amount: 1.23, currency: 'GBP'});
        expect(implicitMoneyParser({currency: 'EUR', locale: 'de'}).parse('1,23')).toEqual({
            amount: 1.23,
            currency: 'EUR',
        });
    });

    it('can infer decimal place with currencies that are not ambiguous', function () {
        expect(implicitMoneyParser({currency: 'EUR'}).parse('1.23')).toEqual({amount: 1.23, currency: 'EUR'});
        expect(implicitMoneyParser({currency: 'EUR'}).parse('1,23')).toEqual({amount: 1.23, currency: 'EUR'});
    });

    it('with ambiguous currencies falls back to locale', function () {
        expect(implicitMoneyParser({currency: 'BHD'}).parse('4,567')).toEqual({amount: 4567, currency: 'BHD'});
        expect(implicitMoneyParser({currency: 'BHD', locale: 'de'}).parse('4.567')).toEqual({
            amount: 4567,
            currency: 'BHD',
        });
    });

    it('even works with currency symbols', function () {
        expect(implicitMoneyParser({currency: '£'}).parse('1.23')).toEqual({amount: 1.23, currency: 'GBP'});
        expect(implicitMoneyParser({currency: '$', strategy: prefer('CAD')}).parse('1.23')).toEqual({
            amount: 1.23,
            currency: 'CAD',
        });
    });

    it('does not blow up on empty currency', function () {
        expect(() => implicitMoneyParser({currency: ''}));
        expect(() => implicitMoneyParser({} as ImplicitMoneyParserOptions));
    });
});

describe('NumberParser', () => {
    it(`handles bad inputs`, function () {
        expect(() => numberParser('en').parse(undefined as any)).toThrow(/Expected string/);
        expect(numberParser('en').parseAll(null as any)).toEqual([]);
        expect(numberParser('en').parseAll(0.1 as any)).toEqual([]);
    });

    it('can infer decimal separator from locale', function () {
        expect(numberParser('en').parse('1.23')).toBe(1.23);
        expect(numberParser('de').parse('1,23')).toBe(1.23);
        expect(numberParser('en').parse('1,234.56')).toBe(1234.56);
        expect(numberParser('de').parse('1.234,56')).toBe(1234.56);
        expect(numberParser('de').parse('1 234,56')).toBe(1234.56);
        expect(numberParser('de').parse("1'234,56")).toBe(1234.56);
    });

    it('can parse a number', function () {
        expect(numberParser('.').parse('1.23')).toBe(1.23);
        expect(numberParser(',').parse('1,23')).toBe(1.23);
        expect(numberParser('.').parse('1,234.56')).toBe(1234.56);
        expect(numberParser(',').parse('1.234,56')).toBe(1234.56);
        expect(numberParser(',').parse('1 234,56')).toBe(1234.56);
        expect(numberParser(',').parse("1'234,56")).toBe(1234.56);
    });

    it('can parse a negative number', function () {
        expect(numberParser('.').parse('-1.23')).toBe(-1.23);
    });

    it('can parse all numbers in a string', function () {
        expect(numberParser(',').parseAll('Total 1 234,56 Tax 234,56')).toEqual([1234.56, 234.56]);
    });

    it('does not join adjacent numbers in a string ', function () {
        expect(numberParser(',').parseAll('1     2')).toEqual([1, 2]);
    });

    it('will not blow up with some invalid inputs but returns any valid', function () {
        expect(numberParser(',').parseAll('Total 1,2.3.5  Tax 234,56')).toEqual([234.56]);
    });

    it('does not parse gibberish', function () {
        expect(() => numberParser('.').parse('1 and 23')).toThrow();
    });

    it('does not parse if multiple decimal separators', function () {
        expect(() => numberParser('.').parse('1.23.456')).toThrow();
    });

    it('throws with inconsistent separators', () => {
        expect(() => numberParser('.').parse("1,222'333.44")).toThrow();
        expect(() => numberParser('.').parse("1.222'333,44")).toThrow();
        expect(() => numberParser('.').parse("1.222'333.44")).toThrow();
    });

    it('handles large numbers with multiple group separators', () => {
        expect(numberParser('.').parse('1,234,568')).toBe(1234568);
    });

    it('can parse arabic numerals', () => {
        expect(numberParser('٫', 'ar-EG').parse('١٢٬٣٤٥٬٦٧٠٫٨٩')).toBe(12345670.89);
    });
});

describe('Flexible Parsing', function () {
    it(`handles bad inputs`, function () {
        expect(() => flexibleMoneyParser('en').parse(undefined as any)).toThrow(/Expected string/);
        expect(flexibleMoneyParser('en').parseAll(null as any)).toEqual([]);
        expect(flexibleMoneyParser('en').parseAll(0.1 as any)).toEqual([]);
    });

    it('ignores extra right to left unicode markers', function () {
        expect(flexibleMoneyParser('iw').parse('‏‏595 ₪')).toEqual(money('ILS', 595));
        expect(flexibleMoneyParser('iw').parseAll('‏‏595 ₪')).toEqual([money('ILS', 595)]);
    });

    it('should infer using locale by default', function () {
        expect(flexibleMoneyParser('en-ZM', {strategy: infer('en-ZM')}).parseAll('K 2,976')).toEqual([
            money('ZMW', 2976),
        ]);
        expect(flexibleMoneyParser('en-ZM').parseAll('K 2,976')).toEqual([money('ZMW', 2976)]);
    });

    it('examples work', function () {
        expect(flexibleMoneyParser('en-US', {strategy: prefer('HKD')}).parseAll('$1015 /Night')).toEqual([
            money('HKD', 1015),
        ]);
        expect(flexibleMoneyParser('en-SG').parseAll('SG$473')).toEqual([money('SGD', 473)]);
        expect(flexibleMoneyParser('en-JP').parseAll('￥19,800')).toEqual([money('JPY', 19800)]);
        expect(flexibleMoneyParser('pt-PT', {strategy: prefer('COP')}).parseAll('$ 811.569')).toEqual([
            money('COP', 811569),
        ]);
    });

    it('supports another unicode apostrophe for separator', () => {
        expect(flexibleParse("CHF 1'152", 'de-CH')).toEqual(money('CHF', 1152));
        expect(flexibleParse("CHF 1'152")).toEqual(money('CHF', 1152));
    });

    it('correctly parses Andorran Peseta', () => {
        expect(flexibleParse('ADP 271', 'en')).toEqual(money('ADP', 271));
    });

    it('correctly parses rupees', () => {
        expect(flexibleParse('Rs20,825', 'en-IN', {strategy: prefer('INR')})).toEqual(money('INR', 20825));
        expect(flexibleParse('Rs20,825', 'en-IN')).toEqual(money('INR', 20825));
        expect(flexibleParse('Rs20,825')).toEqual(money('INR', 20825));
        expect(flexibleParse('Rs20,825', 'en-IN')).toEqual(money('INR', 20825));
        expect(flexibleParse('₹20,825')).toEqual(money('INR', 20825));

        expect(flexibleParse('Rs20,825', 'en-PK')).toEqual(money('PKR', 20825));
        expect(flexibleParse('Rs20,825', 'en', {strategy: prefer('LKR')})).toEqual(money('LKR', 20825));
        expect(flexibleParse('රු20,825')).toEqual(money('LKR', 20825));
        expect(flexibleParse('20,825ரூ')).toEqual(money('LKR', 20825));
        expect(flexibleParse('Rs20,825', 'en-ID')).toEqual(money('IDR', 20825));
        expect(flexibleParse('20,825Rp', 'en-ID')).toEqual(money('IDR', 20825));
        expect(flexibleParse('20,825रु', 'en')).toEqual(money('NPR', 20825));
        expect(flexibleParse('₨20,825', 'en', {strategy: prefer('NPR')})).toEqual(money('NPR', 20825));
        expect(flexibleParse('20,825Re', 'en')).toEqual(money('NPR', 20825));
    });

    it('should handle negatives', function () {
        expect(flexibleMoneyParser().parseAll('EUR -221,38')).toEqual([money('EUR', -221.38)]);
        expect(flexibleMoneyParser().parseAll('EUR-241,38')).toEqual([money('EUR', -241.38)]);
    });

    it('does not treat a non adjacent hyphen as negative', function () {
        expect(flexibleMoneyParser().parseAll('EUR - 221,38')).toEqual([]);
    });

    it('can parse arabic numerals, separators and symbols', function () {
        expect(flexibleMoneyParser('ar-EG').parseAll('١٢٬٣٤٥٬٦٧٠٫٨٩ ج.م.‏')).toEqual([money('EGP', 12345670.89)]);
    });

    it('ignores extra delimiters', function () {
        expect(flexibleMoneyParser().parseAll('221,38 EUR.')).toEqual([money('EUR', 221.38)]);
        expect(flexibleMoneyParser().parseAll('221,38 EUR,')).toEqual([money('EUR', 221.38)]);
    });

    it('still supports currencies with a delimiter that is part of the code', function () {
        expect(flexibleMoneyParser().parseAll('221,38 лв.')).toEqual([money('BGN', 221.38)]);
        expect(flexibleMoneyParser().parseAll('221,38 A.M.')).toEqual([money('AZN', 221.38)]);
        expect(flexibleMoneyParser('da-DK').parseAll('221,38 kr.')).toEqual([money('DKK', 221.38)]);
        expect(flexibleMoneyParser('fo-FO').parseAll('221,38 kr.')).toEqual([money('DKK', 221.38)]);
        expect(flexibleMoneyParser('kl-GL').parseAll('221,38 kr.')).toEqual([money('DKK', 221.38)]);
        expect(flexibleMoneyParser('is-IS').parseAll('221,38 kr.')).toEqual([money('ISK', 221.38)]);
        expect(flexibleMoneyParser('nn-NO').parseAll('221,38 kr.')).toEqual([money('NOK', 221.38)]);
        expect(flexibleMoneyParser('sv-SE').parseAll('221,38 kr.')).toEqual([money('SEK', 221.38)]);
    });

    it('should use exact match for currency code or symbol', function () {
        expect(flexibleMoneyParser().parseAll('23 m')).toEqual([]);
        expect(flexibleMoneyParser().parseAll('23 M')).toEqual([money('LSL', 23)]);
    });

    it('do not use prefer strategy when explicit currency code is present', function () {
        expect(flexibleMoneyParser('en', {strategy: prefer('USD')}).parseAll('From $220 CAD')).toEqual([
            money('CAD', 220),
        ]);
    });

    it('handles when there is a false match on the currency regex', function () {
        expect(flexibleMoneyParser().parseAll('From 1 234,56 USD')).toEqual([money('USD', 1234.56)]);
    });

    it('can parse all numbers in a string', function () {
        expect(flexibleMoneyParser().parseAll('Total USD 1 234,56 Tax USD 234,56')).toEqual([
            money('USD', 1234.56),
            money('USD', 234.56),
        ]);
    });

    it('will not blow up with some invalid inputs but returns any valid', function () {
        expect(flexibleMoneyParser().parseAll('Total USD 1,2.3.5  Tax USD 234,56')).toEqual([money('USD', 234.56)]);
    });

    it('can parse when no group separators and decimal', () => {
        expect(flexibleParse('USD 1234')).toEqual(money('USD', 1234));
        expect(flexibleParse('USD1234')).toEqual(money('USD', 1234));
        expect(flexibleParse('1234 USD')).toEqual(money('USD', 1234));
        expect(flexibleParse('1234USD')).toEqual(money('USD', 1234));
    });

    it('supports the strategy for ambiguous currency', () => {
        expect(flexibleParse('$1234', 'en', {strategy: prefer('USD')})).toEqual(money('USD', 1234));
    });

    it('can parse when we have both currency code and symbol', () => {
        expect(flexibleParse('AUD $12,000.00', 'en-AU')).toEqual(money('AUD', 12000));
        expect(flexibleParse('AUD$ 12,000.00', 'en-AU')).toEqual(money('AUD', 12000));
    });

    it('can parse australian dollars', () => {
        expect(flexibleParse('AU$ 12', 'en-AU')).toEqual(money('AUD', 12));
        expect(flexibleParse('$AU 12', 'en-AU')).toEqual(money('AUD', 12));
        expect(flexibleParse('$12', 'en-AU')).toEqual(money('AUD', 12));
    });

    it('can parse canadian dollars', () => {
        expect(flexibleParse('CA$ 12', 'en-CA')).toEqual(money('CAD', 12));
        expect(flexibleParse('$CA 12', 'en-CA')).toEqual(money('CAD', 12));
        expect(flexibleParse('$12', 'en-CA')).toEqual(money('CAD', 12));
    });

    it('can parse when we have both group separators and decimal', () => {
        expect(flexibleParse('USD 1,234.56')).toEqual(money('USD', 1234.56));
        expect(flexibleParse('USD 1.234,56')).toEqual(money('USD', 1234.56));
        expect(flexibleParse('USD 1 234,56')).toEqual(money('USD', 1234.56));
        expect(flexibleParse("USD 1'234,56")).toEqual(money('USD', 1234.56));
    });

    it('can parse when we have both group separators and decimal with a 3 decimal place currency', () => {
        expect(flexibleParse('BHD 1,234.567')).toEqual(money('BHD', 1234.567));
        expect(flexibleParse('BHD 1.234,567')).toEqual(money('BHD', 1234.567));
        expect(flexibleParse('BHD 1 234,567')).toEqual(money('BHD', 1234.567));
        expect(flexibleParse("BHD 1'234,567")).toEqual(money('BHD', 1234.567));
    });

    it('can parse when we have no group separators but there are 2 digits after the decimal separator irrespective of the decimal places for the currency', () => {
        expect(flexibleParse('₩ 398526.56', undefined, {strategy: prefer('KRW')})).toEqual(money('KRW', 398526.56));
    });

    it('can parse when we have just a group separator but with a 2 decimal place currency', () => {
        expect(flexibleParse('USD 1,234')).toEqual(money('USD', 1234));
        expect(flexibleParse('USD 1.234')).toEqual(money('USD', 1234));
        expect(flexibleParse('USD 1 234')).toEqual(money('USD', 1234));
        expect(flexibleParse("USD 1'234")).toEqual(money('USD', 1234));
    });

    it('can parse when we have just a group separator but with a 4 decimal place currency', () => {
        expect(flexibleParse('CLF 1,234')).toEqual(money('CLF', 1234));
        expect(flexibleParse('CLF 1.234')).toEqual(money('CLF', 1234));
        expect(flexibleParse('UYW 1 234')).toEqual(money('UYW', 1234));
        expect(flexibleParse("UYW 1'234")).toEqual(money('UYW', 1234));
    });

    it('can parse when we have just a decimal separator but with a 2 decimal place currency', () => {
        expect(flexibleParse('USD 12,34')).toEqual(money('USD', 12.34));
        expect(flexibleParse('USD 12.34')).toEqual(money('USD', 12.34));
    });

    it('can parse when we have just a decimal separator but with a 4 decimal place currency', () => {
        expect(flexibleParse('CLF 12,3456')).toEqual(money('CLF', 12.3456));
        expect(flexibleParse('UYW 12.3456')).toEqual(money('UYW', 12.3456));
    });

    it('throws with invalid decimal separators', () => {
        expect(() => flexibleParse("USD 12'34")).toThrow();
        expect(() => flexibleParse('USD 12 34')).toThrow();
    });

    it('throws with inconsistent separators decimal separators', () => {
        expect(() => flexibleParse("USD 1,222'333.44")).toThrow();
    });

    it('throws with ambiguous value when there are 3 digits after a single separator at the end', () => {
        expect(() => flexibleParse('BHD 4.567')).toThrow();
        expect(() => flexibleParse('BHD 4,567')).toThrow();
        expect(() => flexibleParse('BHD 4,567')).toThrow();
        expect(() => flexibleParse('BHD 4,567')).toThrow();
    });

    it('can parse ambiguous value if decimal separator is supplied for a 3 decimal place currency', () => {
        expect(flexibleParse('BHD 4,567', undefined, {decimalSeparator: ','})).toEqual(money('BHD', 4.567));
    });

    it('can parse value with no decimal separator if it has multiple group separators', () => {
        expect(flexibleParse('USD 1,234,568')).toEqual(money('USD', 1234568));
    });

    it('can handle currency that is 2 character country code and symbol with or without a locale', () => {
        expect(flexibleParse('1000 $US', 'fr-FR')).toEqual(money('USD', 1000));
        expect(flexibleParse('1000 $US')).toEqual(money('USD', 1000));
    });

    it('only parses at the word boundary', () => {
        expect(flexibleMoneyParser('fr').parseAll('1© 2019 Wynn Resorts Holdings, LLC. ')).toEqual([]);
        expect(flexibleMoneyParser().parseAll('Last 1 room remaining')).toEqual([]);
    });

    it('does not match any additional money when they adjoin', function () {
        expect(flexibleMoneyParser().parseAll('You save 11.40 EUR    102.60 EUR')).toEqual([
            money('EUR', 11.4),
            money('EUR', 102.6),
        ]);

        expect(flexibleMoneyParser().parseAll('11.40 EUR 102.60 EUR')).toEqual([
            money('EUR', 11.4),
            money('EUR', 102.6),
        ]);

        expect(flexibleMoneyParser().parseAll('EUR 11.40    EUR 102.60')).toEqual([
            money('EUR', 11.4),
            money('EUR', 102.6),
        ]);
    });
});
