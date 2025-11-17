import {File} from '../src/files';
import {runningInNode} from '../src/node';
import {array} from '../src/array';
import * as path from 'path';

describe('files', function () {
    beforeAll(function () {
        if (!runningInNode()) {
            // Skip all tests in this suite if not running in Node
            return;
        }
    });

    it('can return absolute path', function () {
        if (!runningInNode()) return;
        expect(new File('example/child.txt', __dirname).absolutePath).toBe(
            path.resolve(__dirname, 'example/child.txt')
        );
    });

    it('can return name', function () {
        if (!runningInNode()) return;
        expect(new File('example/child.txt', __dirname).name).toBe('child.txt');
    });

    it('can list children', async () => {
        const size = (await array(new File('example/', __dirname).children())).length;
        if (!runningInNode()) return;
        expect(size).toBe(2);
    });

    it('can tell if directory', async () => {
        if (!runningInNode()) return;
        expect(await new File('../src', __dirname).isDirectory).toBe(true);
    });

    it('can tell if file exists', async () => {
        if (!runningInNode()) return;
        expect(await new File('some-random-file-that-does-not-exist', __dirname).exists).toBe(false);
    });

    it('can list descendants', async () => {
        const size = (await array(new File('example/', __dirname).descendants())).length;
        if (!runningInNode()) return;
        expect(size).toBe(3);
    });

    it('can get file content as bytes', async () => {
        const bytes: Uint8Array = await new File('../run', __dirname).bytes();
        if (!runningInNode()) return;
        expect(bytes.length).toBeGreaterThan(0);
    });

    it('can get file content as string', async () => {
        const content: string = await new File('../run', __dirname).content();
        if (!runningInNode()) return;
        expect(content.length).toBeGreaterThan(0);
    });

    it('can write file content as string', async () => {
        const file = File.tempDirectory.child('run');
        await file.content('foo');
        const content = await file.content();
        if (!runningInNode()) return;
        expect(content).toBe('foo');
    });
});
