# ADR 0002 — Testing strategy

- **Status:** Accepted
- **Date:** 2026-09-15
- **Deciders:** @wwhitakerv

## Context

The architecture in [ADR 0001](./0001-feature-sliced-architecture.md) separates
pure helpers, presentation primitives, feature slices, and the side-effect layer
in `src/core`. A test strategy that ignores those seams ends up mocking
everything and asserting nothing.

Two constraints from `docs/PROJECT.md` shape this: the app has **no accounts and
no tracking**, so there is little server state to model; and it is
**security-first**, so the code that redacts, stores, and attests deserves a
higher bar than a screen's padding.

## Decision

Three layers, each with one job.

| Layer       | Lives in                              | Runs                                 | Asserts                         |
| ----------- | ------------------------------------- | ------------------------------------ | ------------------------------- |
| Unit        | beside the source (`Screen.test.tsx`) | Jest + jest-expo/ios                 | one module's behaviour          |
| Integration | `test/integration/`                   | Jest + Expo Router testing utilities | real routes, real provider tree |
| E2E         | `.maestro/` (prompt 12)               | Maestro on a simulator               | the shipped binary              |

- **Unit tests are colocated.** A test beside its source is found when the
  source is read, moves when it moves, and is deleted with it. `src/app/` is the
  exception: routes are one-line re-exports, so there is nothing there to test —
  the feature screen is the unit, and the route is covered by integration.
- **Integration tests render the real route tree** through
  `renderRouter("src/app")`, so routes are discovered the way the app discovers
  them. A renamed or broken route file fails the test; a hand-built navigator
  would not notice.
- **Everything renders through `AppProviders`.** `test/render.tsx` wraps every
  render in the same provider tree the app mounts, so a unit test cannot pass by
  accidentally skipping a provider that production has.
- **The network is mocked at the boundary, not in our code.** MSW intercepts
  HTTP, so the real client in `src/core/api` is exercised. `server.listen` uses
  `onUnhandledRequest: "error"`: an un-mocked request fails the test instead of
  hanging or escaping to the network.
- **Fixtures come from builders** in `test/factories`, so a schema change breaks
  one builder rather than thirty tests.

### Coverage

Global floor of 80% on lines, branches, functions, and statements. Two folders
are held to 95%: `src/utils/**` (pure functions — there is no excuse) and
`src/core/security/**` (redaction, storage, attestation, integrity).

`src/app/**` and type-only files are excluded from collection: routes are
re-exports, and types have nothing to execute.

**The empty-folder problem.** Jest fails a per-path threshold whose path has no
collected coverage — `Coverage data for ./src/core/security/ was not found` —
and `src/core/security` stays empty until a later prompt fills it. Options
considered:

| Option                                            | Why not                                        |
| ------------------------------------------------- | ---------------------------------------------- |
| Drop the strict paths until the folders exist     | Nothing would remember to add them back.       |
| Commit a placeholder file to satisfy the glob     | Fake source, and it would need deleting later. |
| `coveragePathIgnorePatterns` for the empty folder | Hides the folder rather than the threshold.    |

Instead `jest.config.js` attaches a strict entry only for folders that actually
contain a source file, computed at config load. `src/utils/` picked its 95%
threshold up the moment `redactSensitive.ts` landed — and immediately failed at
75% branch coverage until the untested branch got a test, which is the point.
`src/core/security/` will do the same on its first file, with nothing to
remember.

## Consequences

### Good

- Failures point at a layer: a unit test names the module, an integration test
  names the route.
- The 95% folders are the ones where a bug is a security bug.
- Un-mocked network access cannot pass silently.

### Bad

- jest-expo boots the React Native environment, so even a pure-function suite
  pays a few seconds of startup.
- The dynamic threshold is config that computes itself — unusual, and worth the
  comment block it carries.
- Colocated tests mean `src/` holds non-shipping files. Coverage collection and
  Knip both need to know about them.

## Verification

`npm run test` runs in `npm run validate`; `npm run test:ci` adds coverage with
thresholds enforced. The strategy was exercised by building
`src/utils/redaction/redactSensitive.ts` test-first: the suite failed with
`Cannot find module`, then passed at 16 tests, then the 95% branch threshold
rejected it at 75% until the non-phone digit-run branch was covered.

### Version constraints found while building this

- **`@testing-library/react-native` is pinned to 13.3.0, not 14.x.** RNTL 14
  made `render` async and switched from `react-test-renderer` to the new
  `test-renderer` package. Expo Router's `renderRouter` (SDK 57) calls
  `render()` synchronously and `Object.assign`s onto the result, so under RNTL
  14 it decorates a Promise: queries never exist and every assertion fails with
  "`render` function has not been called". expo-router declares
  `@testing-library/react-native: ^13.3.0` in devDependencies — 13.x is the
  tested pairing. Revisit only when expo-router supports async render.
- **`react-test-renderer` is pinned to 19.2.3**, matching `react@19.2.3` exactly.
  These version-lock together; 19.2.8 demands `react@^19.2.8` and fails install.
- **`babel.config.js` is required for Jest**, even though Metro needs no Babel
  config in a managed Expo app. Without it, React Native's own jest setup file
  fails to parse — it still ships Flow annotations
  (`value(id: TimeoutID): void`). `babel-preset-expo` also had to be a direct
  devDependency; it resolves only from inside `expo/node_modules` otherwise.
- **MSW is imported from `msw/native`, not `msw/node`.** MSW's docs send Jest
  users to the Node integration, but that assumes a node or jsdom environment.
  jest-expo resolves with React Native's export condition, and msw's package
  exports declare `"./node": { "react-native": null }` — the Node entry is
  deliberately unreachable, so `msw/node` fails with "Cannot find module".
- **jest-expo's `transform` only matches `\.[jt]sx?$`**, which misses the `.mjs`
  files ESM-only dependencies ship, and its `transformIgnorePatterns` allowlist
  covers only React Native and Expo packages. `jest.config.js` widens the first
  and appends to the second — including `decode-uri-component`, which is
  ESM-only precisely because of the security pin in ADR-adjacent notes in
  `docs/PROJECT.md`.
