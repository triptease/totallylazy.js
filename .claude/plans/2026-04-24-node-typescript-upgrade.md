# Node 20/22 + TypeScript 5.x Upgrade Plan

## Current State

| Item | Current | Target |
|---|---|---|
| Node | 18.12.0 | 22.x (LTS) |
| TypeScript | ~~4.8.4~~ 5.9.3 | ^5.8.0 |
| `@types/node` | ~~13.13.52~~ 22.19.17 | ^22.0.0 |
| `full-icu` | 1.5.0 | remove |
| `esbuild` | 0.14.54 | ^0.25.x |
| `esbuild-runner` | 2.2.1 | replace with `tsx` |

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

## Step 4: Replace `esbuild-runner` with `tsx`, upgrade `esbuild` — TODO

`esbuild-runner` is abandoned (last release 2022). `tsx` is actively maintained and a drop-in replacement.

### Files to change

**`package.json`** — devDependencies:
```diff
- "esbuild": "^0.14.54",
- "esbuild-runner": "^2.2.1",
+ "esbuild": "^0.25.0",
+ "tsx": "^4.0.0",
```

**`package.json`** — scripts (lines 17-18):
```diff
- "generate": "esr money/generate-currencies.ts",
- "perf": "esr perf/trie.ts",
+ "generate": "tsx money/generate-currencies.ts",
+ "perf": "tsx perf/trie.ts",
```

### Validation
```bash
pnpm install
pnpm exec tsc --build --force
pnpm test
pnpm run generate
pnpm run perf
```

---

## Step 5: Update Node version — TODO

### Files to change

**`.tool-versions`**:
```diff
- nodejs 18.12.0
+ nodejs 22.16.0
  pnpm 10.5.2
```

**`.nvmrc`**:
```diff
- v18.12
+ v22.16
```

### Notes
- CI (CircleCI) reads Node version from `.tool-versions` via `asdf install` — no other CI files need changing.
- No Dockerfiles exist in this repo.
- `jest@30.2.0` supports `^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0` — Node 22 is fine.
- `ts-jest@29.4.5` supports `>=20.0.0` — Node 22 is fine.

### Test expectation fixes required
Node 22 ships updated ICU locale data that changes formatting output. The following test expectations need updating (confirmed failing on Node 22.22.1 even on master):
- **`nl` locale** (`test/dates/dates.test.ts:467`): `"vr 25 jan. 2019"` → `"vr 25 jan 2019"` (period after abbreviated month removed)
- **`ru` locale** (`test/dates/formatting.test.ts:41`): `"четверг, 28 июня 2001 г."` — visually identical but different Unicode codepoints (likely thin space vs regular space)
- **`ar` formatToParts** (`test/money/parsing.test.ts:240`): leading RTL mark `‏` literal part no longer emitted — ponyfill expectation needs to match new native output
- These failures appear in 4 test suites: `dates.test.ts`, `datum.test.ts`, `formatting.test.ts`, `parsing.test.ts`

### Stale ICU guard cleanup required
Several test files contain `console.log` guards that check for `NODE_ICU_DATA` and warn if it's not set. These were needed when Node didn't bundle full ICU, but are now obsolete (Node 18+ includes full ICU). The guards were surfaced in Step 3 after removing the `NODE_ICU_DATA` env var from the test script. Files containing the stale guard (identified from test output):
- `test/dates/dates.test.ts:273`
- `test/dates/formatting.test.ts:10`
- `test/dates/datum.test.ts:20`, `:323`, `:379`
- `test/money/parsing.test.ts:261`

These guards should be removed entirely — they are no longer useful since no external ICU package is needed.

### Validation
```bash
asdf install nodejs 22.16.0  # or nvm install 22.16
pnpm install
pnpm exec tsc --build --force
pnpm test
```

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
