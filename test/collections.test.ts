import {AsyncIteratorHandler} from '../src/collections';
import {array} from '../src/array';

describe('AsyncIteratorHandler', function () {
    it('will queue up data until it is consumed', async () => {
        const handler = new AsyncIteratorHandler<number>();
        handler.value(1);
        handler.value(2);
        handler.close();

        expect(await array(handler)).toEqual([1, 2]);
    });

    it('will wait until data is available', async () => {
        const handler = new AsyncIteratorHandler<number>();
        const one = handler.next();
        const two = handler.next();
        const finished = handler.next();
        handler.value(1);
        expect(await one).toEqual({value: 1, done: false});
        handler.value(2);
        expect(await two).toEqual({value: 2, done: false});
        handler.close();
        expect(await finished).toEqual({value: undefined, done: true});
    });

    it('can also return different type', async () => {
        const handler = new AsyncIteratorHandler<number, string>();
        const one = handler.next();
        const two = handler.next();
        const finished = handler.next();
        handler.value(1);
        expect(await one).toEqual({value: 1, done: false});
        handler.value(2);
        expect(await two).toEqual({value: 2, done: false});
        handler.close('RETURN');
        expect(await finished).toEqual({value: 'RETURN', done: true});
    });
});
