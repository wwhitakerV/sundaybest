---
paths:
  - "**/*.test.{ts,tsx}"
  - "tests/**/*.{ts,tsx}"
  - "jest.config.js"
---

# Testing rules

## The loop

Red, green, refactor — and **show the red**. Run the test and paste the failure
before writing implementation. A test first seen passing is not evidence.

## What to assert

- Assert **behavior a user or caller can observe**, not internals. Query by
  text, role, or `testID`; never by component internals or snapshot blobs.
- One reason to fail per test. If the name needs "and", split it.
- Name the case, not the mechanism: "falls back to the light theme when the OS
  expresses no preference" beats "returns lightTheme".
- Cover the **boundaries**, not just the happy path: empty, missing, malformed,
  too long, and the error branch. The 95% thresholds in `src/utils/**` and
  `src/core/security/**` exist because those branches are where bugs hide.

## Mechanics specific to this project

- Render through `@tests/helpers/render`, never RNTL's `render` directly — the helper
  wraps `AppProviders` so a test cannot pass by skipping a provider the app has.
- Route-level tests use `renderApp()` (Expo Router's `renderRouter`), which
  discovers the real routes.
- The network is mocked with MSW at the boundary. `onUnhandledRequest` is
  `"error"`: add a handler with `server.use(...)` rather than mocking our client.
- Fixtures come from `tests/factories`, not inline literals.
- Real timers by default. Opt in per test with
  `jest.useFakeTimers({ advanceTimers: true })`; `renderApp()` already forces
  fake timers.
- Tests never live in `src/`. They mirror it under `tests/`
  (`tests/features/plans/components/StudyNav.test.tsx`) and import the code
  under test through `@/`. Routes in `src/app/` have no unit tests — test the
  feature screen, and cover routes in `tests/integration/`.

## Do not

- Do not lower a coverage threshold to go green. Add the missing test, or delete
  the untested code.
- Do not assert on redacted or generated values; assert the shape.
- Do not add a snapshot test in place of an assertion about behavior.
