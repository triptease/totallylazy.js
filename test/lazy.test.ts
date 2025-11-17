import {lazy} from '../src/lazy';

describe('lazy', () => {
    it('laziness is per instance not per class', () => {
        class Foo {
            public count = 0;
            @lazy get a() {
                this.count++;
                return 'expensive thing';
            }
        }

        const foo1 = new Foo();
        const foo2 = new Foo();

        foo1.a;
        expect(foo1.count).toBe(1);
        foo1.a;
        expect(foo1.count).toBe(1);
        foo2.a;
        expect(foo2.count).toBe(1);
    });
});
