---
name: add-dependency
description: Evaluate, justify, and install a dependency. Use before adding any package. Checks maintenance and security history, installs with the right command, adds test mocks, and writes an ADR for a native module.
argument-hint: [package-name]
disable-model-invocation: true
---

Every dependency is a permanent liability: supply-chain surface, an upgrade
treadmill, and bundle size. Default to not adding one.

## 1. Justify it

Answer in the report, before installing:

- What does the app need that it cannot do today?
- Can `react-native`, the Expo SDK, or ~30 lines in `src/utils` do it? If yes,
  do that instead. Say what you compared.
- What breaks if this package is abandoned in a year?

A package used in one place for one function is usually worse than that
function.

## 2. Check maintenance and security

```
npm view <pkg> version time.modified maintainers license
npm view <pkg> dependencies
npm audit --json
```

Report:

- Last publish date, and release cadence.
- Open-issue and unreleased-fix signal.
- **Transitive dependency count** — this is the real cost.
- License, which must be permissive (MIT, Apache-2.0, BSD, ISC).
- Known advisories, and whether a fixed version exists. This project holds
  `npm audit` at **zero**; see the pins in `docs/PROJECT.md`.
- Whether it is ESM-only or CJS-only, and whether it ships TypeScript types.
  Under Jest, an ESM-only package needs adding to `transformIgnorePatterns` in
  `jest.config.js`.
- Whether it contains native code.

## 3. Install with the right command

- **Expo SDK package** → `npx expo install <pkg>` (resolves the SDK-matched
  version). Add `--dev` for a dev dependency.
- **Anything else** → `npm i --save-exact <pkg>@<version>`, or `-D` for dev.
  Never a caret or tilde range.

Then confirm nothing broke:

```
npm audit
npm run validate
```

## 4. Wire it into tests

- A side-effect SDK is imported **only** inside `src/core`. Add the wrapper
  there and import that. Lint blocks the import anywhere else — add the package
  to the restricted list in `eslint.config.js` if it belongs there.
- Add a native module mock in `tests/setup/jest.setup.ts`, in the native-module section.
  Keep it honest: a mock that always resolves hides every failure path.
- If it is ESM-only, add it to `EXTRA_TRANSFORMED_PACKAGES` in
  `jest.config.js`.

## 5. ADR for a native module

Any package with native code, a new permission, an entitlement, or a background
mode needs an ADR in `docs/adr/` before the code. Cover what it does, what was
rejected, the privacy impact, and how it gets removed if it does not work out.
Native modules also mean a new dev client build — note that in the report.

## 6. Report

Package and exact version, why, what you rejected, the maintenance and security
findings, install command used, test wiring added, ADR link if applicable, and
the `npm audit` plus `npm run validate` results.
