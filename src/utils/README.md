# src/utils — pure functions

Deterministic helpers. Same input, same output, no observable side effects.

## Rules

- **One exported function per file**, and the file is named after it, matching
  its casing (`redaction/redactSensitive.ts` exports `redactSensitive`).
- Test beside it (`redaction/redactSensitive.test.ts`).
- **No barrel files.** Import the exact path so dead code stays visible to Knip
  and bundles stay honest.

## Never goes here

- React. No components, no hooks, no `react` or `react-native` imports.
- I/O of any kind: no fetch, no filesystem, no storage, no `Date.now()` hidden
  inside — take the clock as an argument.
- Imports from `@/app`, `@/features`, `@/core`, `@/ui`, or `@/hooks`.

Lint enforces all of the above.

## May import

`@/utils`, `@/types`.
