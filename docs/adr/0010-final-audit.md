# 10. Final audit

Date: 2026-09-20

## Status

Accepted

## Context

Prompt 13 of the setup series, and the last one: a full audit of everything
built across prompts 1-12 before calling the setup phase done. Not a new
decision so much as a record of what the audit found and fixed, since two of
its findings changed shipped behavior (a privacy-manifest gap and a test
coverage gap on a fail-closed security path) and both need the same
traceability every other decision in this repo gets.

## Decision

### `src/core/security/` and `src/core/api/` audit

Delegated to the `security-reviewer` subagent against three questions: real
secrets, adapters behind interfaces with SDK-level mocks, and error-path
test coverage. Full transcript in the session; summary:

- **No hardcoded secret, credential, or API key anywhere** in either tree.
  Every credential-shaped string is a documented `PLACEHOLDER_*` constant or
  a test fixture, both already accounted for.
- **Every adapter is behind an interface with a native-SDK-level mock** —
  `expo-secure-storage.ts`, `expo-database-key.ts`,
  `expo-app-attest-device.ts`, and `pinning.ts` each implement a port
  declared in a separate file, and each test mocks the underlying SDK
  (`expo-secure-store`, `expo-crypto`, `@expo/app-integrity`,
  `react-native-ssl-public-key-pinning`), never the adapter itself.
- **One real gap**: `src/core/api/client.ts`'s fail-closed session/assertion
  failure paths (`sessionFailureToApiError`'s `unavailable` case;
  `assertionFailureToApiError`'s `disabled`/`unsupported`/`needs-attestation`
  cases; the `DEVICE_ERROR` → `INTERNAL` remap on both) were entirely
  untested — 72.3% branch coverage against ~100% on almost every other file
  in scope. Fixed with explicit tests for each branch in
  `client.test.ts`, bringing it to 89% branches. The underlying logic was
  already correct; only the test coverage was missing. Contributing cause:
  `jest.config.js`'s `STRICT_COVERAGE_PATHS` holds `src/utils` and
  `src/core/security` to a 95% floor, but not `src/core/api` — this gap was
  absorbed by the 80% global average rather than failing the gate outright.
  Not changed in this pass (a coverage-policy change is its own decision,
  not a drive-by fix during an audit), but worth naming here for whoever
  picks it up.
- One low-severity, non-blocking note: `validate-deep-link.ts`'s
  `params-not-allowed` branch is currently unreachable, since both entries
  in `ALLOWED_ROUTES` use `z.object({})` and Zod strips unknown keys rather
  than failing. Not a vulnerability — the effect is that deep-link query
  params are silently ignored, which is the safe default — but worth a note
  so a future route with a real param schema doesn't assume this branch was
  already exercised.

### Privacy manifest re-audit found a real gap

`app.config.ts`'s privacy-manifest comment has always said to re-run
`find node_modules -name PrivacyInfo.xcprivacy` after adding a native
module — re-running it for this audit found that `freerasp-react-native`'s
bundled `TalsecRuntime.xcframework` ships its own `PrivacyInfo.xcprivacy`,
missed when that dependency was added (prompt 6). Its `FileTimestamp` and
`SystemBootTime` reasons were already covered by react-native's own
entries (same reason codes); its `UserDefaults` reason (`1C8F.1`) was not,
and its `NSPrivacyCollectedDataTypes` declaration (`DeviceID`,
`OtherDiagnosticData`, `OtherDataTypes`, all not linked to identity and not
used for tracking) had no corresponding entry in `app.config.ts` at all —
that array was empty.

Fixed by adding the missing reason code and copying the three collected-data
entries verbatim from Talsec's own manifest, and by adding freeRASP to
`docs/privacy/data-inventory.md`'s tables — including the `watcherMail`
field, which is a genuine, distinct off-device data flow (Talsec's native
code emails a threat report directly, never through app code or
`redactSensitive`) that the data inventory didn't mention at all before this
audit. freeRASP is not mounted at any screen yet, but Apple's manifest
requirement is about what's linked into the binary, not what's actively
exercised at runtime, so the declaration has to be present regardless.

### The setup checklist is reorganized, not shortened

Consolidated 70 checkbox items (many duplicated across sections that grew
independently prompt-by-prompt) into five named groups — **Accounts &
credentials**, **Security**, **EAS & builds**, **Per developer**, **Before
first submission** — each item given a one-line reason and a link to the
file or doc it depends on. No item was marked done: every single one needs
a real account action (2FA, a D-U-N-S number, a real API key, a real
device) that this session cannot take, even where all the code and config
that depends on it is already written and tested. Marking something "done"
that only looks done from the code side would be worse than leaving it
unchecked.

## Consequences

### Good

- The two real findings (privacy manifest, `client.ts` coverage) are both
  fixed, not just noted — this audit changed shipped config and added
  tests, not only documentation.
- The setup checklist is now organized by who acts and when, rather than by
  which prompt happened to add the item — someone picking this repo up
  cold can work through one group at a time instead of reading 13 prompts'
  worth of accumulated sections.

### Bad

- **`src/core/api` still isn't in `STRICT_COVERAGE_PATHS`.** The specific
  gap this audit found is closed, but the structural reason it could exist
  in the first place — `src/core/api` held to the 80% global bar instead of
  the 95% bar `src/core/security` gets, despite CLAUDE.md naming both as
  plan-mode-gated, "leaves the device" paths — is still true. Left as a
  named follow-up rather than changed here, since widening a coverage
  policy project-wide is its own decision worth its own review, not a
  drive-by during an audit pass.
- **The deep-link `params-not-allowed` branch is still unreachable.** Noted,
  not fixed — no route needs it yet, and forcing it reachable today (e.g.
  via `.strict()` schemas) would be manufacturing a test for code with no
  live purpose yet.

### Neutral

- `docs/security/masvs-checklist.md` updated: PRIVACY-1's evidence now
  mentions the freeRASP manifest re-audit, CODE-3 reflects that CI now
  enforces `npm audit`/OSV-Scanner/gitleaks (prompt 10), CODE-2's reasoning
  updated now that `expo-updates` exists but no forced-update gate does
  (prompt 11), and CODE-4 records the `client.ts` coverage fix.
- `README.md` rewritten from the unedited `create-expo-app` template to
  describe the actual project, prerequisites, clone/run steps, the
  `new-feature` and `release` skills, and a table of every doc and what it
  covers.

## Alternatives considered

| Option                                                          | Why not                                                                                                                                                                               |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mark checklist items "done" based on code/config being ready    | Conflates "the code is ready for this" with "this account action happened." Every item here needs a human to actually do something outside this repo; none of that happened today.    |
| Add `src/core/api` to `STRICT_COVERAGE_PATHS` in this same pass | A project-wide coverage policy change deserves its own review, not a side effect of fixing one file's specific gap. Named as a follow-up instead.                                     |
| Force the deep-link `params-not-allowed` branch reachable       | Would mean adding a real param schema and a route to use it, purely to exercise a branch — manufacturing product surface for a test, which the setup-only scope of this repo forbids. |

## Verification

- `npm run validate` passes (typecheck, lint, format, knip, 424 tests,
  expo-doctor 21/21).
- `npx expo export -p ios` (production, minified) succeeds with the updated
  privacy manifest.
- `npx expo config --type prebuild --json` confirms
  `ios.privacyManifests.NSPrivacyCollectedDataTypes` resolves to the three
  new entries exactly as written.
- `client.test.ts`'s new tests pass and raise `client.ts` from 72.3% to
  89.23% branch coverage, confirmed via a scoped coverage run
  (`--collectCoverageFrom="src/core/api/client.ts"`).
- No test file found under `src/app/`; every interactive element in the
  codebase (one: the error boundary's retry action) has a `testID`.
- `.claude/settings.json` confirmed denying `.env*`/`keys/**` reads and
  requiring confirmation on EAS build/submit/update/credentials and git
  push/commit/add — verified empirically (this session read
  `.env.example` successfully throughout, and the broader `.env*` deny was
  never bypassed).
