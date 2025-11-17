import {PreferredCurrencies} from '../../src/money/preferred-currencies';

describe('PreferredCurrencies', () => {
    it('dollarSymbol', () => {
        expect(PreferredCurrencies.dollarSymbol('AG')).toEqual('XCD');
        expect(PreferredCurrencies.dollarSymbol('AU')).toEqual('AUD');
        expect(PreferredCurrencies.dollarSymbol('BS')).toEqual('BSD');
        expect(PreferredCurrencies.dollarSymbol('BB')).toEqual('BBD');
        expect(PreferredCurrencies.dollarSymbol('BZ')).toEqual('BZD');
        expect(PreferredCurrencies.dollarSymbol('BM')).toEqual('BMD');
        expect(PreferredCurrencies.dollarSymbol('BN')).toEqual('BND');
        expect(PreferredCurrencies.dollarSymbol('CA')).toEqual('CAD');
        expect(PreferredCurrencies.dollarSymbol('CO')).toEqual('COP');
        expect(PreferredCurrencies.dollarSymbol('CU')).toEqual('CUP');
        expect(PreferredCurrencies.dollarSymbol('DM')).toEqual('XCD');
        expect(PreferredCurrencies.dollarSymbol('EC')).toEqual('USD');
        expect(PreferredCurrencies.dollarSymbol('FM')).toEqual('USD');
        expect(PreferredCurrencies.dollarSymbol('KY')).toEqual('KYD');
        expect(PreferredCurrencies.dollarSymbol('FJ')).toEqual('FJD');
        expect(PreferredCurrencies.dollarSymbol('GD')).toEqual('XCD');
        expect(PreferredCurrencies.dollarSymbol('GY')).toEqual('GYD');
        expect(PreferredCurrencies.dollarSymbol('HK')).toEqual('HKD');
        expect(PreferredCurrencies.dollarSymbol('JM')).toEqual('JMD');
        expect(PreferredCurrencies.dollarSymbol('KI')).toEqual('AUD');
        expect(PreferredCurrencies.dollarSymbol('KN')).toEqual('XCD');
        expect(PreferredCurrencies.dollarSymbol('LC')).toEqual('XCD');
        expect(PreferredCurrencies.dollarSymbol('LR')).toEqual('LRD');
        expect(PreferredCurrencies.dollarSymbol('MH')).toEqual('USD');
        expect(PreferredCurrencies.dollarSymbol('MX')).toEqual('MXN');
        expect(PreferredCurrencies.dollarSymbol('NA')).toEqual('NAD');
        expect(PreferredCurrencies.dollarSymbol('NZ')).toEqual('NZD');
        expect(PreferredCurrencies.dollarSymbol('SG')).toEqual('SGD');
        expect(PreferredCurrencies.dollarSymbol('SB')).toEqual('SBD');
        expect(PreferredCurrencies.dollarSymbol('SR')).toEqual('SRD');
        expect(PreferredCurrencies.dollarSymbol('SV')).toEqual('USD');
        expect(PreferredCurrencies.dollarSymbol('TL')).toEqual('USD');
        expect(PreferredCurrencies.dollarSymbol('TW')).toEqual('TWD');
        expect(PreferredCurrencies.dollarSymbol('TT')).toEqual('TTD');
        expect(PreferredCurrencies.dollarSymbol('TV')).toEqual('AUD');
        expect(PreferredCurrencies.dollarSymbol('VC')).toEqual('XCD');
        expect(PreferredCurrencies.dollarSymbol('ZW')).toEqual('USD');
    });

    it('does not switch dinar to dollar', () => {
        expect(PreferredCurrencies.dollarSymbol('SD')).toEqual('USD');
    });

    it('poundSymbol', () => {
        expect(PreferredCurrencies.poundSymbol('EG')).toEqual('EGP');
        expect(PreferredCurrencies.poundSymbol('FK')).toEqual('FKP');
        expect(PreferredCurrencies.poundSymbol('GI')).toEqual('GIP');
        expect(PreferredCurrencies.poundSymbol('GG')).toEqual('GBP');
        expect(PreferredCurrencies.poundSymbol('IM')).toEqual('GBP');
        expect(PreferredCurrencies.poundSymbol('JE')).toEqual('GBP');
        expect(PreferredCurrencies.poundSymbol('LB')).toEqual('LBP');
        expect(PreferredCurrencies.poundSymbol('SH')).toEqual('SHP');
        expect(PreferredCurrencies.poundSymbol('SS')).toEqual('SSP');
        expect(PreferredCurrencies.poundSymbol('SD')).toEqual('SDG');
        expect(PreferredCurrencies.poundSymbol('SY')).toEqual('SYP');
        expect(PreferredCurrencies.poundSymbol('GB')).toEqual('GBP');
    });

    it('yenSymbol', () => {
        expect(PreferredCurrencies.yenSymbol('CN')).toEqual('CNY');
        expect(PreferredCurrencies.yenSymbol('JP')).toEqual('JPY');
    });

    it('kroneSymbol', () => {
        expect(PreferredCurrencies.kroneSymbol('DK')).toEqual('DKK');
        expect(PreferredCurrencies.kroneSymbol('FO')).toEqual('DKK');
        expect(PreferredCurrencies.kroneSymbol('GL')).toEqual('DKK');
        expect(PreferredCurrencies.kroneSymbol('IS')).toEqual('ISK');
        expect(PreferredCurrencies.kroneSymbol('NO')).toEqual('NOK');
        expect(PreferredCurrencies.kroneSymbol('SE')).toEqual('SEK');
    });

    it('rupeeSymbol', () => {
        expect(PreferredCurrencies.rupeeSymbol('IN')).toEqual('INR');
        expect(PreferredCurrencies.rupeeSymbol('ID')).toEqual('IDR');
        expect(PreferredCurrencies.rupeeSymbol('MU')).toEqual('MUR');
        expect(PreferredCurrencies.rupeeSymbol('NP')).toEqual('NPR');
        expect(PreferredCurrencies.rupeeSymbol('PK')).toEqual('PKR');
        expect(PreferredCurrencies.rupeeSymbol('LK')).toEqual('LKR');
    });

    it('for', () => {
        expect(PreferredCurrencies.for('GB')).toEqual(['USD', 'GBP', 'JPY', 'DKK', 'INR']);
        expect(PreferredCurrencies.for('AU')).toEqual(['AUD', 'GBP', 'JPY', 'DKK', 'INR']);
        expect(PreferredCurrencies.for('SD')).toEqual(['USD', 'SDG', 'JPY', 'DKK', 'INR']);
        expect(PreferredCurrencies.for('CN')).toEqual(['USD', 'GBP', 'CNY', 'DKK', 'INR']);
        expect(PreferredCurrencies.for('PK')).toEqual(['USD', 'GBP', 'JPY', 'DKK', 'PKR']);
        expect(PreferredCurrencies.for(undefined)).toEqual(['USD', 'GBP', 'JPY', 'DKK', 'INR']);
    });
});
