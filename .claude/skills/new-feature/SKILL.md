---
name: new-feature
description: Build a feature slice from an approved spec, test-first. Use when starting work on a docs/specs/ file. Runs test-writer, then implementation, then validate, then both reviewers.
argument-hint: [spec-name]
disable-model-invocation: true
---

Build the feature described by `docs/specs/<spec-name>.md`.

## 0. Gate on the spec

Read `docs/specs/<spec-name>.md`.

**Stop and ask if any of these is true:**

- The file does not exist.
- It still has `_TEMPLATE.md` placeholder text.
- Acceptance criteria are not Given/When/Then.
- The "Data touched and privacy impact" or "Security considerations" section is
  empty.

Do not invent a spec, and do not proceed on a draft. Say what is missing.

## 1. Scaffold the slice

```
cp -R src/features/_template src/features/<name>
```

Delete the folders the slice does not need. Keep `index.ts` minimal — it is the
public contract.

Add the route as a one-line re-export in `src/app/`:

```ts
export { <Name>Screen as default } from "@/features/<name>";
```

## 2. Failing tests first

Delegate to the **test-writer** subagent with the spec path. It turns each
acceptance criterion into a test and confirms they fail.

Do not write implementation until you have seen the failing output.

## 3. Implement until green

Smallest change per test. After each test goes green, run the related tests
again before moving on.

While implementing:

- Zod-parse anything crossing a boundary.
- `testID` on every interactive element, matching the testIDs named in the spec.
- Side effects go in `src/core`, never in the slice.
- Read from `useTheme()`; no hardcoded colours.

## 4. Validate

```
npm run validate
```

All of it must pass: typecheck, lint, format, knip, tests, doctor. Coverage
thresholds hold — 95% in `src/utils/**` and `src/core/security/**`.

## 5. Review

Run both, in parallel:

- **security-reviewer** — against the MASVS checklist and the security rules.
- **code-reviewer** — dependency rules, test quality, naming, dead code.

Fix every Critical and High finding, and decide explicitly on each Medium. Then
re-run `npm run validate`.

## 6. PR summary

Write, do not commit unless asked:

- What the feature does, in one sentence a non-engineer understands.
- Each acceptance criterion with the test that covers it.
- Data touched and privacy impact, lifted from the spec.
- Reviewer findings and how each was resolved.
- Anything a human must still do, added to `docs/SETUP_CHECKLIST.md`.
- New dependencies and why.
