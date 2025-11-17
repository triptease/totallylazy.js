import {array} from '../src/array';

export function assertSync<T>(actual: Iterable<T>, ...expected: T[]) {
    expect(array(actual)).toEqual(expected);
}

export async function assertAsync<T>(iterable: AsyncIterable<T>, ...expected: T[]) {
    expect(await array(iterable)).toEqual(expected);
}

export async function assertThrows<T>(iterable: Iterable<T>, error: any) {
    try {
        await array(iterable);
        expect(true).toBe(false); // Should have thrown
    } catch (e) {
        expect(e).toEqual(error);
    }
}

export async function assertAsyncThrows<T>(iterable: AsyncIterable<T>, error: any) {
    try {
        await array(iterable);
        expect(true).toBe(false); // Should have thrown
    } catch (e) {
        expect(e).toEqual(error);
    }
}
