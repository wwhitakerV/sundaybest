---
name: tdd-cycle
description: Run one red-green-refactor loop for a single behavior. Use for a bug fix, a small addition, or one acceptance criterion at a time.
argument-hint: [behavior to implement]
disable-model-invocation: true
---

One behavior, one loop. If the request covers several behaviors, do the first and
say what remains.

## Red

1. Name the behavior in one sentence. If it needs "and", it is two behaviors —
   split and do the first.
2. Write **one** test asserting it, under `tests/` at the path mirroring the
   source (`tests/<same path>/X.test.tsx`); `tests/integration/` if it crosses
   routes or providers.
3. Run it:
   ```
   npm run test:related <test file>
   ```
4. **Paste the failure.** Then read it: is it failing for the reason you expect?
   `Cannot find module` is fine for new code. An assertion failing because the
   assertion is wrong means fix the test, not the code.

Do not continue without a red run.

## Green

5. Smallest change that passes. No extra abstraction, no options nobody asked
   for, no drive-by refactors.
6. Re-run. Paste the passing output.

## Refactor

7. Only now, and only while green. Improve names, remove duplication, extract
   the thing that has appeared three times.
8. Re-run after every step. Red means you are debugging — revert and go again.

## Close

9. `npm run validate`.
10. Report: the behavior, the test name, the red output, the green output, and
    what you changed in refactor. If you skipped refactoring, say so.

## Bug fixes

Same loop, but the red test **reproduces the bug** first. A fix without a test
that failed before it is not a fix; it is a hope.
