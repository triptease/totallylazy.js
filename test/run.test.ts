import {File} from '../src/files';
import {run} from '../src/run';
import {array} from '../src/array';

describe('run', function () {
    function script(name: string) {
        return [new File('example-scripts/' + name, __dirname).absolutePath];
    }

    it('when running a command streams stdout', async () => {
        const command = script('working.sh');
        const result = await array(run({command}));
        expect(result.join('')).toBe('Hello\nWorld\n');
    });

    it('can use shell redirect to get stdout and stderr in correct order (exec 2>&1)', async () => {
        const command = script('shell-redirect.sh');
        const result = await array(run({command}));
        expect(result.join('')).toBe('stout\nstderr\n');
    });

    it('can capture exit code and stdout', async () => {
        const command = script('failing.sh');
        const output: string[] = [];
        let exitCode: number | undefined = undefined;

        try {
            for await (const text of run({command})) {
                output.push(text);
            }
        } catch (e: any) {
            exitCode = e.code;
        }

        expect(output).toEqual(['This command returns an exit code of 1\n']);
        expect(exitCode).toBe(1);
    });

    it('without shell redirect stdout and stderr are buffered (so order is not perfectly preserved)', async () => {
        const command = script('no-redirect.sh');
        const output: string[] = [];
        let exitCode: number | undefined = undefined;

        try {
            for await (const text of run({command})) {
                output.push(text);
            }
        } catch (e: any) {
            exitCode = e.code;
        }

        expect(output.join('')).toBe('one\nthree\ntwo\nfour\n');
        expect(exitCode).toBe(1);
    });

    it('throw on missing script', async () => {
        const command = script('missing.sh');
        try {
            await array(run({command}));
            expect(true).toBe(false); // Should have thrown
        } catch (e: any) {
            // The error code can be 'ENOENT' (string) or a numeric code depending on system
            expect(e.code === 'ENOENT' || (typeof e.code === 'number' && e.code !== 0)).toBe(true);
        }
    });

    it('can run a command with multiple arguments', async () => {
        const result = await array(run({command: ['ls', '-a', 'package.json']}));
        expect(result).toEqual(['package.json\n']);
    });
});
