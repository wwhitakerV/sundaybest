# ADR 0011 — Tests live in a mirrored `tests/` tree

- **Status:** Accepted
- **Date:** 2026-09-23
- **Deciders:** @wwhitakerv
- **Supersedes:** the "unit tests are colocated" part of [ADR 0002](./0002-testing-strategy.md)

## Context

ADR 0002 put each unit test beside its source. As `src/` grew, production
folders filled with non-shipping files: 80+ test files spread across every
slice, plus a separate `test/` folder for the render helper, setup, mocks,
factories, and integration tests. That meant two conventions for where tests
live, and source folders that were hard to scan.

## Decision

Every test, helper, mock, fixture, and factory lives under `tests/`. Unit tests
sit in a path that mirrors `src/`:

| Source                                       | Test                                                |
| -------------------------------------------- | --------------------------------------------------- |
| `src/features/plans/components/StudyNav.tsx` | `tests/features/plans/components/StudyNav.test.tsx` |
| `src/utils/steps/getStepState.ts`            | `tests/utils/steps/getStepState.test.ts`            |

Shared test infrastructure has named folders:

```
tests/
  helpers/render.tsx     render / renderApp through the real provider tree
  setup/jest.setup.ts    env defaults, MSW lifecycle, native-module mocks
  mocks/                 MSW handlers and in-memory fakes
  factories/             fixture builders
  integration/           route-level and cross-provider tests
  <mirror of src/>       unit tests
```

- Tests import the code under test through the `@/` alias, never a relative
  path, and import helpers through `@tests/*`.
- Nothing else in ADR 0002 changes: the three layers, render-through-
  `AppProviders`, MSW at the boundary, builder fixtures, and the coverage bars
  all stand.

## Consequences

### Good

- `src/` holds only shipping code, so reading a folder shows what the app does.
- One place for all test infrastructure, and one rule for where a test goes.
- Tooling scopes are one glob: Jest `testMatch`, the ESLint test override,
  Knip entries, and the Gitleaks fixture allowlist all point at `tests/**`.

### Bad

- A test no longer moves with its source automatically. Moving or renaming a
  source file means moving its mirrored test by hand. The mirror makes the
  target path obvious, and a stale test fails on its broken import.

## Verification

Every test moved with `git mv` (history preserved), relative imports were
rewritten to `@/` against each test's original location, and the full suite,
typecheck, lint, and Knip all ran green afterwards.
