import {AVLTree} from '../src/avltree';
import {range} from '../src/sequence';
import {array} from '../src/array';
import {map} from '../src/transducers/map';
import {take} from '../src/transducers/take';

describe('AVLTree', function () {
    const tree = AVLTree.empty<string, string>();

    it('supports isEmpty', function () {
        expect(tree.isEmpty).toBe(true);
        expect(AVLTree.create('a', 'value').isEmpty).toBe(false);
    });

    it('can build tree from multiple entries in one go', function () {
        for (let count = 0; count < 10; count++) {
            const entries = array(
                range(1),
                map(i => [i, i] as [number, number]),
                take(count)
            );
            const manual = entries.reduce((a, [k, v]) => a.insert(k, v), AVLTree.empty<number, number>());
            const tree = AVLTree.of(entries);
            expect(array(tree.entries())).toEqual(array(manual.entries()));
        }
    });

    it('supports contains', function () {
        const key = 'a';
        expect(tree.contains(key)).toBe(false);
        expect(AVLTree.create('a', 'value').contains(key)).toBe(true);
    });

    it('supports lookup', function () {
        const keyA = 'a';
        const valueA = 'valueA';
        const keyB = 'b';
        const valueB = 'valueB';
        expect(tree.lookup(keyA)).toBeUndefined();
        expect(tree.insert(keyA, valueA).lookup(keyA)).toBe(valueA);
        expect(tree.insert(keyA, valueA).insert(keyB, valueB).lookup(keyB)).toBe(valueB);
    });

    it('supports delete', function () {
        const keyA = 'a';
        const valueA = 'valueA';
        const keyB = 'b';
        const valueB = 'valueB';
        const t = tree.insert(keyA, valueA).insert(keyB, valueB);
        expect(t.contains('a')).toBe(true);
        expect(t.contains('b')).toBe(true);
        expect(t.delete(keyB).tree.contains('a')).toBe(true);
        expect(t.delete(keyA).tree.delete(keyB).tree.contains('a')).toBe(false);
    });

    it('supports first and last', function () {
        const tree = AVLTree.empty<number, number>().insert(3, 3).insert(4, 4).insert(5, 5);
        expect(tree.first()).toBe(3);
        expect(tree.last()).toBe(5);
    });

    it('balances right right case', function () {
        const tree = AVLTree.empty<number, null>();
        expect(tree.insert(3, null).insert(4, null).insert(5, null).toString()).toBe('(( 3=null ) 4=null ( 5=null ))');
    });

    it('balances right left case', function () {
        const tree = AVLTree.empty<number, null>();
        expect(tree.insert(3, null).insert(5, null).insert(4, null).toString()).toBe('(( 3=null ) 4=null ( 5=null ))');
    });

    it('balances left left case', function () {
        const tree = AVLTree.empty<number, null>();
        expect(tree.insert(5, null).insert(4, null).insert(3, null).toString()).toBe('(( 3=null ) 4=null ( 5=null ))');
    });

    it('balances left right case', function () {
        const tree = AVLTree.empty<number, null>();
        expect(tree.insert(5, null).insert(3, null).insert(4, null).toString()).toBe('(( 3=null ) 4=null ( 5=null ))');
    });

    it('balances deletion', function () {
        const tree = AVLTree.empty<number, null>();
        expect(
            tree
                .insert(0, null)
                .insert(1, null)
                .insert(2, null)
                .insert(3, null)
                .insert(4, null)
                .insert(5, null)
                .insert(6, null)
                .delete(3)
                .tree.toString()
        ).toBe('((( 0=null ) 1=null ) 2=null (( 4=null ) 5=null ( 6=null )))');
    });

    it('can iterate over keys', function () {
        const tree = AVLTree.empty<number, null>()
            .insert(0, null)
            .insert(1, null)
            .insert(2, null)
            .insert(3, null)
            .insert(4, null)
            .insert(5, null)
            .insert(6, null);
        expect(array(tree.keys())).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it('can iterate over values', function () {
        const tree = AVLTree.empty<number, string>().insert(0, 'a').insert(1, 'b').insert(2, 'c');
        expect(array(tree.values())).toEqual(['a', 'b', 'c']);
    });

    it('can iterate over entries', function () {
        const tree = AVLTree.empty<number, string>().insert(0, 'a').insert(1, 'b').insert(2, 'c');
        expect(array(tree.entries())).toEqual([
            [0, 'a'],
            [1, 'b'],
            [2, 'c'],
        ]);
    });
});
