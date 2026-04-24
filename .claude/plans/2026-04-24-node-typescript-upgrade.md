# Node 20/22 + TypeScript 5.x Upgrade Plan

## Current State

| Item | Current | Target |
|---|---|---|
| Node | ~~18.12.0~~ 22.16.0 | 22.x (LTS) |
| TypeScript | ~~4.8.4~~ 5.9.3 | ^5.8.0 |
| `@types/node` | ~~13.13.52~~ 22.19.17 | ^22.0.0 |
| `full-icu` | ~~1.5.0~~ removed | remove |
| `esbuild` | ~~0.14.54~~ 0.25.12 | ^0.25.0 |
| `esbuild-runner` | ~~2.2.1~~ replaced by tsx 4.21.0 | `tsx` ^4.0.0 |

---

## Step 1: Upgrade TypeScript to 5.8.x ✅ DONE

### Changes made

**`package.json`**:
```diff
- "typescript": "^4.8.4"
+ "typescript": "^5.8.0"
```
Resolved to **5.9.3**.

**`tsconfig.json`** — added `moduleResolution` and `useDefineForClassFields`:
```diff
  {
      "compilerOptions": {
+         "moduleResolution": "node10",
+         "useDefineForClassFields": false,
          "composite": true,
          ...
```

- `moduleResolution: "node10"` — makes the current implicit default explicit. TS 5.x emits deprecation warnings about the ambiguity otherwise.
- `useDefineForClassFields: false` — **critical**. The `@lazy` and `@cache` decorators (`src/lazy.ts`, `src/cache.ts`) use `experimentalDecorators` and work by replacing getters on the prototype. TS 5.x with `target >= ES2022` defaults `useDefineForClassFields: true`, which silently breaks these decorators. Setting it explicitly now future-proofs against a later target bump.

**`src/files.ts`** — temporary fix for type error caused by `@types/node@13` `Buffer` not satisfying TS 5.9's `Uint8Array` definition:
```diff
  async bytes(): Promise<Uint8Array> {
-     return await promisify(fs.readFile)(this.absolutePath);
+     return new Uint8Array(await promisify(fs.readFile)(this.absolutePath));
  }
```
This wrapping was reverted in Step 2 — with `@types/node@22`, `Buffer` properly extends `Uint8Array`.

### Validation result
- **Compilation**: passes cleanly
- **Tests**: 6 failures in 4 suites — all **pre-existing** Node 22 ICU locale data differences (confirmed by running master on the same Node 22.22.1). Not caused by the TS upgrade. Specifically:
  - `nl` locale: `"vr 25 jan. 2019"` expected vs `"vr 25 jan 2019"` received (period after abbreviated month dropped in Node 22 ICU)
  - `ru` locale: visually identical but different Unicode codepoints in `"четверг, 28 июня 2001 г."`
  - `ar` formatToParts: leading RTL mark `‏` literal part no longer emitted in Node 22
- These test expectations will need updating in Step 5 when Node version is formally bumped

---

## Step 2: Upgrade `@types/node` ✅ DONE

### Changes made

**`package.json`** optionalDependencies:
```diff
- "@types/node": "^13.13.52"
+ "@types/node": "^22.0.0"
```
Resolved to **22.19.17**.

**`src/files.ts`** — three type errors from tightened Node API signatures in `@types/node@22`:

1. **Reverted Step 1 `Uint8Array` wrapping** — with `@types/node@22`, `Buffer` properly extends `Uint8Array`, so the `new Uint8Array(...)` wrapping is no longer needed:
   ```diff
     async bytes(): Promise<Uint8Array> {
   -     return new Uint8Array(await promisify(fs.readFile)(this.absolutePath));
   +     return await promisify(fs.readFile)(this.absolutePath);
     }
   ```

2. **Removed custom `FileOptions` and `StreamOptions` type aliases** — these included a bare `string` union member which is too wide for `@types/node@22` (expects `BufferEncoding` not `string`). Replaced with Node's own types using `Parameters<>` utility type to extract the option types directly from the function signatures, since the internal interfaces (`ReadStreamOptions`, `WriteStreamOptions`) are not exported from the `fs` module:
   ```diff
   - read(options?: StreamOptions): Readable {
   + read(options?: Parameters<typeof fs.createReadStream>[1]): Readable {

   - async append(data: any, options?: FileOptions): Promise<void> {
   -     return await promisify(fs.appendFile)(this.absolutePath, data, options);
   + async append(data: any, options?: Parameters<typeof fs.appendFile>[2]): Promise<void> {
   +     return await promisify(fs.appendFile)(this.absolutePath, data, options as fs.WriteFileOptions);

   - write(options?: StreamOptions): Writable {
   + write(options?: Parameters<typeof fs.createWriteStream>[1]): Writable {
   ```

3. **Cast needed for `append`** — `promisify(fs.appendFile)` infers its options parameter from the callback-based overload where param index 2 can be either options or callback (`NoParamCallback`). The promisified version only accepts options, but TS can't narrow this automatically, so a cast to `fs.WriteFileOptions` is needed to bridge the type mismatch.

**`src/files.ts`** — replaced the custom `FileOptions` and `StreamOptions` type aliases with deprecated aliases pointing to Node's own types, to avoid breaking downstream consumers:
```typescript
/** @deprecated Use Node's fs types instead */
export type StreamOptions = Parameters<typeof fs.createReadStream>[1];
/** @deprecated Use Node's fs types instead */
export type FileOptions = Parameters<typeof fs.appendFile>[2];
```

### Validation result
- **Compilation**: passes cleanly
- **Tests**: same 6 pre-existing Node 22 ICU failures as Step 1 (no new failures introduced)

---

## Step 3: Remove `full-icu` ✅ DONE

Node 18+ ships with full ICU built-in. The `full-icu` package and `NODE_ICU_DATA` env var were unnecessary overhead — Node bundles the same ICU data natively since v13 (with full-icu becoming the default build in v18).

### Changes made

**`package.json`** — removed `full-icu` from optionalDependencies:
```diff
  "optionalDependencies": {
-     "@types/node": "^22.0.0",
-     "full-icu": "^1.5.0"
+     "@types/node": "^22.0.0"
  }
```

**`package.json`** — removed `NODE_ICU_DATA` from test script:
```diff
- "test": "NODE_ENV=development NODE_ICU_DATA=./node_modules/full-icu TZ='America/Los_Angeles' jest"
+ "test": "NODE_ENV=development TZ='America/Los_Angeles' jest"
```
The env var pointed at the now-removed package. Node's built-in ICU provides the same locale data, so the test script no longer needs it.

### Validation result
- **Compilation**: passes cleanly
- **Tests**: same 6 pre-existing Node 22 ICU failures, no new failures. All Intl/date tests that were passing before continue to pass — confirms Node's built-in ICU is sufficient.
- **Stale ICU guards in tests**: several test files still log `"To run these tests you must set 'NODE_ICU_DATA=./node_modules/full-icu'"`. These guards are now obsolete since Node provides full ICU natively. They should be removed in Step 5 alongside the ICU test expectation updates — see Step 5 for details.

---

## Step 4: Replace `esbuild-runner` with `tsx`, upgrade `esbuild` ✅ DONE

`esbuild-runner` is abandoned (last release 2022). `tsx` is actively maintained and a drop-in replacement. `esbuild` was also upgraded from 0.14.x (3 years old) to 0.25.x — `tsx` uses its own bundled esbuild internally, but the project's `esbuild` devDependency is kept since `ts-jest` has it as an optional peer.

### Changes made

**`package.json`** — devDependencies:
```diff
- "esbuild": "^0.14.54",
- "esbuild-runner": "^2.2.1",
+ "esbuild": "^0.25.0",
+ "tsx": "^4.0.0",
```
Resolved to **esbuild 0.25.12** and **tsx 4.21.0**.

**`package.json`** — scripts:
```diff
- "generate": "esr money/generate-currencies.ts",
- "perf": "esr perf/trie.ts",
+ "generate": "tsx src/money/generate-currencies.ts",
+ "perf": "tsx perf/trie.ts",
```

**Path fix for `generate`**: the original script referenced `money/generate-currencies.ts` but the file lives at `src/money/generate-currencies.ts`. `esr` must have resolved this differently (or the script was already broken). Fixed to the correct path during the `tsx` migration.

### Validation result
- **Compilation**: passes cleanly
- **Tests**: same 6 pre-existing Node 22 ICU failures, no new failures
- **`pnpm run generate`**: `tsx` successfully finds and executes the script. It fails with a `Forbidden` error from the external Wikidata API — this is a network/auth issue, not a `tsx` issue.
- **`pnpm run perf`**: runs successfully, benchmark output produced

---

## Step 5: Update Node version ✅ DONE

### Changes made

**`.tool-versions`** and **`.nvmrc`**: bumped from Node 18.12.0 to 22.16.0.

### ICU guard cleanup

Removed all `NODE_ICU_DATA` / `full-icu` guards from test files. These `beforeAll` blocks checked `process.env.NODE_ICU_DATA` and logged a warning, but were effectively no-ops (they didn't actually skip tests). They were needed historically when Node didn't bundle full ICU, but Node 18+ includes it natively, making them dead code. Also removed the now-unused `runningInNode` imports.

Files cleaned:
- `test/dates/dates.test.ts` — removed 1 guard + `runningInNode` import
- `test/dates/formatting.test.ts` — removed 1 guard + replaced `runningInNode` import with `removeUnicodeMarkers` import (needed for the whitespace fix below)
- `test/dates/datum.test.ts` — removed 3 guards + `runningInNode` import
- `test/money/parsing.test.ts` — removed 1 guard + `runningInNode` import

### ICU locale data fixes

Node 22 ships ICU 74+ which changes formatting output for several locales. Three distinct issues were fixed:

**1. `nl` locale — period removed after abbreviated month** (`test/dates/dates.test.ts`)

Updated hardcoded expectation:
```diff
- 'vr 25 jan. 2019'
+ 'vr 25 jan 2019'
```
**Why**: Node 22's ICU data for Dutch no longer includes a period after abbreviated month names. This is a data-only change from the Unicode CLDR project, not a bug.

**2. `ru` locale — narrow no-break space in `formatToParts`** (`test/dates/formatting.test.ts`)

Added whitespace normalization to `assertPartsMatch`:
```typescript
function normalizeWhitespace(s: string): string {
    return s.replace(/[\u200E\u200F\u202F\u00A0]/g, ' ');
}
```
Applied to both sides of the comparison before asserting equality.

**Why**: Node 22 has an internal inconsistency — `Intl.DateTimeFormat.format()` returns `U+0020` (regular space) before `г.` in Russian, but `formatToParts()` returns `U+202F` (narrow no-break space) for the same literal. The `LearningDateFormatter` learns patterns from `format()` output, so it produces regular spaces. Since both representations are semantically correct and the mismatch is a Node/ICU quirk (not a library bug), normalizing whitespace variants in the test comparison is the right approach.

**3. `ar` locale — RTL marks in ponyfill vs native** (`test/money/parsing.test.ts`)

Added RTL mark stripping to the native result before comparing with the ponyfill:
```typescript
function stripRtlMarkers(parts: NumberFormatPart[]): NumberFormatPart[] {
    return parts
        .map(p => ({...p, value: p.value.replace(/[\u200E\u200F]/g, '')}))
        .filter(p => p.value.length > 0);
}
```

**Why**: The library intentionally strips RTL/LTR Unicode markers (`U+200E`, `U+200F`) throughout its parsing and formatting pipeline (see `src/characters.ts:removeUnicodeMarkers`). This is by design — RTL marks cause issues with string matching and pattern learning. On Node 22, native `Intl.NumberFormat.formatToParts()` emits RTL mark literal parts for Arabic locales, but the ponyfill (which learns from `format()` output that has been stripped) doesn't include them. The test now strips RTL marks from the native result to match the library's intentional behaviour, rather than trying to make the ponyfill emit marks the library is designed to remove.

### stdout/stderr interleaving fix

**`test/run.test.ts`** — fixed flaky test for stdout/stderr ordering.

Changed from asserting a specific interleaving order to asserting all expected lines are present:
```diff
- expect(output.join('')).toBe('one\nthree\ntwo\nfour\n');
+ expect(output.join('').split('\n').sort()).toEqual(['', 'four', 'one', 'three', 'two']);
```

**Why**: The test runs a shell script that writes to both stdout and stderr without shell redirect. The test name itself acknowledges "order is not perfectly preserved". On Node 18, stdout happened to be buffered before stderr, producing `one, three, two, four`. On Node 22, the event loop timing changed, producing `one, two, four, three` instead. Since the point of the test is to verify that all output is captured (not the order), asserting sorted content is correct. The test was already flaky on Node 22 even on master — it passed in isolation but failed under full-suite load.

### Validation result
- **Compilation**: passes cleanly
- **Tests**: 412 passed, 20 suites, 0 failures

---

## Step 6 (optional): Bump TypeScript target to ES2022 — TODO

Once everything is green on Node 22, optionally modernise the compile target.

### Files to change

**`tsconfig.json`**:
```diff
- "target": "ES6",
+ "target": "ES2022",
```

**`jest.config.js`** line 13:
```diff
- target: 'ES6',
+ target: 'ES2022',
```

### Why
- Avoids emitting polyfills for features Node 22 supports natively (async/await, optional chaining, nullish coalescing, etc.)
- `useDefineForClassFields: false` (added in Step 1) protects the decorators

### Validation
```bash
pnpm exec tsc --build --force
pnpm test
```

---

## Step 7 (optional): Migrate jest.config.js ts-jest config — TODO

The `globals['ts-jest']` configuration path is deprecated in ts-jest 28+. Migrate to the `transform` key.

### Files to change

**`jest.config.js`**:
```diff
  module.exports = {
-   preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/test/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/*.d.ts',
    ],
-   globals: {
-     'ts-jest': {
-       tsconfig: {
-         target: 'ES6',
-         module: 'commonjs',
-       },
-     },
-   },
+   transform: {
+     '^.+\\.tsx?$': ['ts-jest', {
+       tsconfig: {
+         target: 'ES2022',
+         module: 'commonjs',
+       },
+     }],
+   },
    setupFiles: [],
    testTimeout: 10000,
    maxWorkers: 1,
  };
```

### Validation
```bash
pnpm exec tsc --build --force
pnpm test
```

---

## Locale change impact on consumers and possible reverse mappings

### What changed

Node 22 ships ICU 74+ with updated Unicode CLDR data. This changes the output of `Intl.DateTimeFormat.format()` and `Intl.NumberFormat.formatToParts()` for some locales. Since this library delegates formatting to `Intl`, its `format()` output changes accordingly. Three locale behaviours changed:

1. **`nl` (Dutch)**: abbreviated months lost trailing period — `"jan."` → `"jan"`, `"feb."` → `"feb"`, etc.
2. **`ru` (Russian)**: literal space before `г.` (year suffix) changed from `U+0020` to `U+202F` (narrow no-break space) in `formatToParts` output (but not in `format` output — a Node inconsistency)
3. **`ar` (Arabic)**: RTL marks (`U+200F`) in `formatToParts` output — this library already strips these intentionally, so no consumer-visible change here

### Impact assessment

**Parsing is unaffected.** The parser is already liberal:
- The `Spaces` class (`src/dates/formatting.ts`) normalizes `U+0020`, `U+00A0`, and `U+202F` — the `ru` whitespace change is already handled
- The parser treats trailing dots as optional — `"jan."` and `"jan"` both parse correctly for `nl`
- RTL marks are stripped by `removeUnicodeMarkers` before parsing

**Formatting output changes.** Consumers who compare `format()` output against hardcoded strings will break. For example, any code doing `if (format(date, 'nl', opts) === 'vr 25 jan. 2019')` will fail.

### If reverse mappings are needed

To preserve the old formatting output for consumers, a post-processing layer could normalize `format()` output to match the Node 18 ICU behaviour. This would sit in `ImprovedDateTimeFormat.format()` (`src/dates/format.ts:94`), which already does post-processing (it strips RTL markers).

#### Approach 1: Locale-specific format fixups

Add a fixup map that transforms the new ICU output back to the old form:

```typescript
// src/dates/format.ts
const localeFixups: Record<string, (value: string) => string> = {
    'nl': (value) => value.replace(
        /\b(jan|feb|mrt|apr|mei|jun|jul|aug|sep|okt|nov|dec)\b/gi,
        (match) => match + '.'
    ),
};

export class ImprovedDateTimeFormat implements DateFormatter {
    format(date: Date): string {
        let result = removeUnicodeMarkers(this.delegate.format(date));
        const fixup = localeFixups[this.locale] || localeFixups[this.locale.split('-')[0]];
        if (fixup) result = fixup(result);
        return result;
    }
}
```

**Pros**: targeted, only affects known changes, easy to understand.
**Cons**: brittle — requires manual maintenance for every CLDR update that changes locale output. Creates a growing list of fixups over time. Effectively fighting upstream Unicode decisions.

#### Approach 2: Whitespace normalization in format output

For the `ru` whitespace issue, normalize all exotic whitespace to regular space in `format()` output:

```typescript
format(date: Date): string {
    return removeUnicodeMarkers(this.delegate.format(date))
        .replace(/[\u202F\u00A0]/g, ' ');
}
```

This is already partially done — `removeUnicodeMarkers` strips RTL/LTR marks. Extending it to normalize whitespace would make `format()` output stable across ICU versions for whitespace changes.

**Pros**: generic, handles all future whitespace changes across all locales.
**Cons**: loses semantic meaning of narrow no-break space (which is typographically correct in some contexts).

#### Approach 3: Do nothing (recommended)

The formatting output is a thin wrapper around `Intl.DateTimeFormat`. Consumers should not depend on exact string output from locale-aware formatting — it's inherently tied to the ICU/CLDR version bundled with Node. The library's value is in **parsing** (which is already resilient to these changes), not in producing stable formatted strings.

Consumers comparing formatted output against hardcoded strings have a fragile pattern that will break on any Node upgrade. The right fix is on the consumer side: compare parsed `Date` objects or use format-then-parse round-trip assertions instead of string equality.

**If a consumer needs stable output**, they should pin their Node version or use the library's format string API (`parser('nl', 'dd MMM yyyy')`) which produces deterministic output independent of ICU data.

---

## Key Risk: Decorators

The `@lazy` and `@cache` decorators are used across ~13 source files. They rely on `experimentalDecorators: true` and prototype getter replacement. This pattern is safe under TS 5.x **as long as `useDefineForClassFields` is `false`**. Step 1 locks this in explicitly. Do not remove it.

Files using decorators (non-exhaustive):
- `src/lazy.ts` (defines `@lazy`)
- `src/cache.ts` (defines `@cache`)
- `src/money/currencies.ts`
- `src/dates/formatting.ts`
- `src/dates/builders.ts`
- Various other `src/` files

## No Changes Needed

- **CI config** (`.circleci/config.yml`) — reads `.tool-versions`, no hardcoded Node version
- **Module system** — stays CommonJS, no ESM migration required
- **`tslib`** — `^2.4.0` is compatible with TS 5.x and Node 22
- **`madge`**, **`prettier`**, **`benchmark`** — all compatible
- **`wikidata-sdk`**, **`xmldom`**, **`xpath`** — dev-time codegen tools, all compatible
