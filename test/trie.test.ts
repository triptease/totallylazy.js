import {DEFAULT_COMPARATOR, Pair, pair, PrefixTree, Row, Trie, TrieFactory} from '../src/trie';
import {characters} from '../src/characters';
import {array} from '../src/array';

describe('Trie', function () {
    it('supports isEmpty', function () {
        expect(new Trie().isEmpty).toBe(true);
        expect(new Trie().insert(['a'], 'value').isEmpty).toBe(false);
    });

    it('can construct the tree in place', function () {
        expect(new TrieFactory().construct(['c', 'a', 't'], 'Mr Magoo').lookup(['c', 'a', 't'])).toBe('Mr Magoo');
    });

    it('supports contains', function () {
        const key = ['a'];
        expect(new Trie().contains(key)).toBe(false);
        expect(new Trie().insert(key, 'value').contains(key)).toBe(true);
    });

    it('supports lookup', function () {
        const keyA = ['a'];
        const valueA = 'valueA';
        const keyB = ['a', 'b'];
        const valueB = 'valueB';
        expect(new Trie().lookup(keyA)).toBeUndefined();
        expect(new Trie().insert(keyA, valueA).lookup(keyA)).toBe(valueA);
        expect(new Trie().insert(keyA, valueA).insert(keyB, valueB).lookup(keyB)).toBe(valueB);
    });

    it('can replace an element', function () {
        expect(new Trie().insert([1], 'old').insert([1], 'new').lookup([1])).toBe('new');
        const trie = new Trie().insert([1], 'old').insert([1, 2], 'preserves').insert([1], 'new');
        expect(trie.lookup([1])).toBe('new');
        expect(trie.lookup([1, 2])).toBe('preserves');
    });

    it('supports match', function () {
        const keyA = ['a'];
        const valueA = 'valueA';
        const keyB = ['a', 'b'];
        const valueB = 'valueB';
        expect(new Trie().match(keyA)).toEqual([]);
        expect(new Trie().insert(keyA, valueA).match(keyA)).toEqual([valueA]);
        expect(new Trie().insert(keyA, valueA).insert(keyB, valueB).match(keyA)).toEqual([valueA, valueB]);
    });

    it('supports delete', function () {
        const keyA = ['a'];
        const valueA = 'valueA';
        const keyB = ['a', 'b'];
        const valueB = 'valueB';
        const trie = new Trie().insert(keyA, valueA).insert(keyB, valueB);
        expect(trie.match([])).toEqual([valueA, valueB]);
        expect(trie.delete(keyB).match([])).toEqual([valueA]);
        expect(trie.delete(keyA).delete(keyB).match([])).toEqual([]);
    });

    it('supports entries', function () {
        const trie = new Trie().insert(['a'], 'valueA').insert(['a', 'b'], 'valueB').insert(['c', 'a', 'd'], 'valueC');
        expect(array(trie.entries())).toEqual([
            [['a'], 'valueA'],
            [['a', 'b'], 'valueB'],
            [['c', 'a', 'd'], 'valueC'],
        ]);
    });

    it('supports keys', function () {
        const trie = new Trie().insert(['a'], 'valueA').insert(['a', 'b'], 'valueB').insert(['c', 'a', 'd'], 'valueC');
        expect(array(trie.keys())).toEqual([['a'], ['a', 'b'], ['c', 'a', 'd']]);
    });

    it('supports values', function () {
        const trie = new Trie().insert(['a'], 'valueA').insert(['a', 'b'], 'valueB').insert(['c', 'a', 'd'], 'valueC');
        expect(array(trie.values())).toEqual(['valueA', 'valueB', 'valueC']);
    });
});

describe('PrefixTree', function () {
    it('supports isEmpty', function () {
        expect(new PrefixTree().isEmpty).toBe(true);
        expect(new PrefixTree().insert('value').isEmpty).toBe(false);
    });

    it('supports contains', function () {
        const value = 'value';
        expect(new PrefixTree().contains(value)).toBe(false);
        expect(new PrefixTree().insert(value).contains(value)).toBe(true);
    });

    it('supports lookup', function () {
        const valueA = 'valueA';
        const valueB = 'valueB';
        expect(new PrefixTree().lookup(valueA)).toBeUndefined();
        expect(new PrefixTree().insert(valueA).lookup(valueA)).toBe(valueA);
        expect(new PrefixTree().insert(valueA).insert(valueB).lookup(valueB)).toBe(valueB);
    });

    it('supports match', function () {
        const valueA = 'valueA';
        const valueB = 'valueB';
        expect(new PrefixTree().match('val')).toEqual([]);
        expect(new PrefixTree().insert(valueA).match('val')).toEqual([valueA]);
        expect(new PrefixTree().insert(valueA).insert(valueB).match('val')).toEqual([valueA, valueB]);
    });

    it('supports delete', function () {
        const valueA = 'valueA';
        const valueB = 'valueB';
        const trie = new PrefixTree().insert(valueA).insert(valueB);
        expect(trie.match('')).toEqual([valueA, valueB]);
        expect(trie.delete(valueB).match('')).toEqual([valueA]);
        expect(trie.delete(valueA).delete(valueB).match('')).toEqual([]);
    });

    it('value can be a different type', function () {
        const trie = new PrefixTree<number>().insert('январь', 1).insert('января', 1).insert('янв.', 1);

        expect(trie.match('янва')).toEqual([1, 1]);
        expect(trie.match('янв')).toEqual([1, 1, 1]);
    });

    it('supports entries', function () {
        const trie = new PrefixTree<number>().insert('янв.', 1).insert('январь', 2).insert('января', 3);
        expect(array(trie.entries())).toEqual([
            ['янв.', 1],
            ['январь', 2],
            ['января', 3],
        ]);
    });

    it('supports keys', function () {
        const trie = new PrefixTree<number>().insert('янв.', 1).insert('январь', 2).insert('января', 3);
        expect(array(trie.keys())).toEqual(['янв.', 'январь', 'января']);
    });

    it('supports values', function () {
        const trie = new PrefixTree<number>().insert('янв.', 1).insert('январь', 2).insert('января', 3);
        expect(array(trie.values())).toEqual([1, 2, 3]);
    });

    it('can get height', function () {
        expect(new PrefixTree<number>().height).toBe(0);
        expect(new PrefixTree<number>().insert('1', 1).height).toBe(1);
        expect(new PrefixTree<number>().insert('12', 1).height).toBe(2);
        expect(new PrefixTree<number>().insert('123', 1).height).toBe(3);
        expect(new PrefixTree<number>().insert('1234', 1).height).toBe(4);
    });

    it('can search with levenshtein distance', function () {
        const trie = new PrefixTree().insert('Hotel A').insert('Hotel AB').insert('Some Hotel');

        const search = 'Hotel C';
        const [a, b] = trie.search(search, search.length * 0.75);
        expect(a).toEqual({value: 'Hotel A', distance: 1});
        expect(b).toEqual({value: 'Hotel AB', distance: 2});
    });

    it('the default search ignores case and language specific accents', function () {
        // https://github.com/hiddentao/fast-levenshtein/issues/7
        const trie = new PrefixTree().insert('Mikhaïlovitch').insert('Vikhaklovitch');

        const search = 'mikailovitch';
        const [a, b] = trie.search(search, 3);
        expect(a).toEqual({value: 'Mikhaïlovitch', distance: 1});
        expect(b).toEqual({value: 'Vikhaklovitch', distance: 3});
    });

    it('the default match also ignores case and language specific accents', function () {
        const trie = new PrefixTree().insert('Mikhaïlovitch').insert('Vikhaklovitch');

        expect(trie.match('mikhail')).toEqual(['Mikhaïlovitch']);
    });
});

describe('Row', function () {
    it('matches the wikipedia example for kitten vs sitting', function () {
        /*
        https://en.wikipedia.org/wiki/Levenshtein_distance
		k	i	t	t	e	n
	0	1	2	3	4	5	6
s	1	1	2	3	4	5	6
i	2	2	1	2	3	4	5
t	3	3	2	1	2	3	4
t	4	4	3	2	1	2	3
i	5	5	4	3	2	2	3
n	6	6	5	4	3	3	2
g	7	7	6	5	4	4	3
         */
        let row = Row.create(characters('kitten'), DEFAULT_COMPARATOR);
        expect(row.values).toEqual([0, 1, 2, 3, 4, 5, 6]);
        row = row.next('s');
        expect(row.values).toEqual([1, 1, 2, 3, 4, 5, 6]);
        row = row.next('i');
        expect(row.values).toEqual([2, 2, 1, 2, 3, 4, 5]);
        row = row.next('t');
        expect(row.values).toEqual([3, 3, 2, 1, 2, 3, 4]);
        row = row.next('t');
        expect(row.values).toEqual([4, 4, 3, 2, 1, 2, 3]);
        row = row.next('i');
        expect(row.values).toEqual([5, 5, 4, 3, 2, 2, 3]);
        row = row.next('n');
        expect(row.values).toEqual([6, 6, 5, 4, 3, 3, 2]);
        row = row.next('g');
        expect(row.values).toEqual([7, 7, 6, 5, 4, 4, 3]);
    });
});
