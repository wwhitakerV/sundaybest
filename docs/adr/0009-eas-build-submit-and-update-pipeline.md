# 9. EAS build, submit, and update pipeline

Date: 2026-09-19

## Status

Accepted

## Context

Up to this point there was no `eas.json`, no `expo-updates`, and no way to
build, submit, or ship an OTA update short of running EAS CLI commands by
hand with whatever flags someone remembered that day. This decision wires
the whole pipeline: three `eas.json` build profiles, `expo-updates` with a
fingerprint runtime policy and code signing, three EAS Workflows, and a
hand-rolled release script that decides the next version from Conventional
Commits.

## Decision

### `eas.json`'s `environment` field, not `env`

`eas.json`'s `env` object is documented as being for values you would
commit to git — not secrets, and not anything that should differ per
profile without also being visible in the repo. `EXPO_PUBLIC_ATTESTATION_ENABLED`
needs to be `false` in development and `true` in preview/production, and
the Sentry DSN and API URL are per-project values that shouldn't live in a
committed file even though they aren't secrets in the strict sense (see
ADR 0007/0004). Every build profile instead sets `"environment":
"development" | "preview" | "production"`, which pulls values from EAS's
own hosted environment variable store — created once via `eas env:create`
(checklist item) and never inline in this file. `submit.production` is
deliberately `{}`: App Store Connect credentials live in EAS's credential
storage via an Apple API key, never inline.

### `runtimeVersion: { policy: "fingerprint" }`

Confirmed against `expo-updates`' current documented config shape (not
memory): the fingerprint policy hashes the project's actual native surface
— SDK version, config, native modules — rather than requiring someone to
remember to bump a manual runtime version string whenever a native
dependency changes. It needs `@expo/fingerprint`, which is already a
transitive dependency of `expo` itself (verified with `npm ls
@expo/fingerprint` — no separate install needed) and no additional config
plugin beyond `expo-updates`' own, which autolinks without being listed in
`app.config.ts`'s `plugins` array (confirmed against the current
`expo-updates` install docs, which show no plugin-array entry in any
example).

This is also what makes the hotfix procedure in
[docs/release/runbook.md](../release/runbook.md) safe by construction: an
OTA update whose fingerprint doesn't match the running binary is refused by
`expo-updates` itself, rather than silently applying incompatible JS on top
of native code it wasn't built against.

### Code signing is a checklist item, not something run here

`npx expo-updates codesigning:generate` produces a private key that must
never be committed. `app.config.ts` already references
`codeSigningCertificate`/`codeSigningMetadata` with the exact paths that
command's companion `codesigning:configure` step would write, so the shape
is correct ahead of time — but generating the actual key/cert pair is a
one-time human action, tracked in `docs/SETUP_CHECKLIST.md`.

### `updates.url` and `extra.eas.projectId` are placeholders

Both need a real EAS project ID, which only exists after `eas init` runs
(also a checklist item — this session has no authenticated EAS account to
create one with). Written with an obvious `PLACEHOLDER_EAS_PROJECT_ID`
value and a comment pointing at the checklist, matching the existing
pattern for `associatedDomains` elsewhere in this file.

### EAS Workflows, confirmed against Expo's current example workflows

`.eas/workflows/*.yml` syntax was checked against Expo's actual,
currently-published example workflows (`deploy-to-production.yml`,
`e2e-tests.yml`, `publish-preview-update.yml`) rather than paraphrased
documentation, because EAS Workflows is new enough that a remembered shape
could easily be stale or invented:

- `type: maestro` is EAS Workflows' own built-in job type — no separate
  paid Maestro Cloud subscription, contrary to an earlier, less precise
  source that suggested a `maestro-cloud` type requiring one.
- `type: github-comment` with a `build_ids` param is the actual mechanism
  for "post a build link to the PR," not a custom curl step against the
  GitHub API.
- `pull_request_labeled: { labels: [...] }` and `push: { tags: [...] }`
  (glob patterns, so `v*.*.*` matches directly) are both real, current
  trigger syntax.
- A pre-packaged job type (`type: update`, `type: build`) runs against
  "the job's recorded commit" by default and has no way to override which
  ref it checks out — only a custom `steps:` job with an explicit
  `eas/checkout` (`with: { ref: ... }`) step can target an arbitrary
  branch. This is why `hotfix.yml`'s update step is a custom job calling
  `eas update` directly via `run:`, not `type: update` — the pre-packaged
  job type would have run against whatever ref triggered the
  `workflow_dispatch`, not necessarily the hotfix branch named in its
  `inputs.branch`.

`build-preview.yml`'s Maestro job is gated behind
`if: ${{ hashFiles('.maestro/*.yml') != '' }}` since `.maestro/` currently
holds only a `.gitkeep` — prompt 12 is what adds real flows. The job is
written now so nothing else needs to change once flows exist; today it
simply never runs.

### `eas-cli` is invoked with `npx`, never installed as a project dependency

Tried first: `npm install --save-dev eas-cli`, pinned exact per AGENTS.md.
`expo-doctor` flagged it immediately — "EAS CLI should not be installed in
your project. Instead, install it globally or use npx" — which is Expo's
own documented convention, not a style preference: `eas-cli` is meant to
track the CLI's own release cadence independently of the project's
`package.json`, and every command in this repo's docs/workflows/scripts
uses `npx eas-cli`/`npx expo-updates` accordingly. Removing it also
resolved a real, if temporary, `npm audit` regression — see "Bad" below.

### The release script is hand-rolled, not a library

Explicitly chosen over `conventional-changelog-cli`/
`conventional-recommended-bump`: this is a single-maintainer project's
release process, not a shared tool, and `scripts/release.mjs` follows the
same house style as `scripts/check-env.mjs`/`generate-icons.mjs` — a small,
readable script with no new dependency chain to keep current. The
trade-off is real: it only handles this project's actual commit style
(`type(scope): subject`, a `!` or `BREAKING CHANGE:` footer for a major
bump), not every edge case the Conventional Commits spec allows. That's an
accepted limitation, not an oversight — see "Alternatives considered."

## Consequences

### Good

- Nothing in this pipeline has a real secret inline anywhere — the Apple
  API key, the Sentry auth token, and the code-signing private key all live
  outside git entirely (EAS credentials, EAS environment variables, or a
  password manager respectively).
- A hotfix cannot silently ship a native-incompatible update: the
  fingerprint runtime policy refuses it structurally, not by convention.
- The release script's dry-run-by-default design means running it costs
  nothing to try — only `--apply` mutates anything.

### Bad

- **None of this can actually run end to end yet.** `eas init`, the GitHub
  connection, the Apple API key, the code-signing key/cert, and the EAS
  environment variables are all still checklist items. `eas.json` and the
  workflow files are correct in shape but unverified by an actual EAS
  build, since that needs an authenticated account this session doesn't
  have.
- **`build-preview.yml`'s Maestro job is inert until prompt 12.** Nothing
  breaks today, but nothing is actually being E2E-tested either.
- **Installing `eas-cli`, even briefly, reopened `npm audit` to non-zero**
  (13 vulnerabilities, all in its own transitive devDependencies — `npm
audit --omit=dev` stayed clean throughout, since none of it reaches the
  shipped app) and, separately, broke `expo-doctor` entirely: `eas-cli`'s
  own dependency tree happened to hoist a root-level copy of
  `@expo/config-plugins`, which `@sentry/react-native`'s Expo plugin
  requires without declaring as its own dependency — removing `eas-cli`
  removed that accidental copy and `expo config` briefly failed with
  `Cannot find module '@expo/config-plugins'` until a further `npm
install` re-resolved the tree and hoisted `expo`'s own nested copy to the
  root correctly. Neither problem exists once `eas-cli` is invoked via
  `npx` instead of installed, which is the actual fix, not the dependency
  overrides tried first (removed again once `eas-cli` came out of
  `package.json` — see "Alternatives considered").
- **The release script's Conventional Commit parsing is intentionally
  narrower than the full spec** — see the trade-off above. A commit message
  that doesn't match `type(scope)?: subject` is silently excluded from the
  changelog rather than erroring, which is the safer failure mode for a
  script that shouldn't block a release over a malformed message, but it
  does mean a genuinely important commit with a malformed subject line
  could be missed. `commitlint`'s pre-commit hook (ADR 0008) is what
  actually prevents malformed messages from entering history in the first
  place, so this is a second layer, not the only one.

### Neutral

- `docs/SETUP_CHECKLIST.md` gained a full new section, "EAS build, submit,
  and update pipeline," covering every account-level action above.
- `docs/release/runbook.md` documents the normal release, hotfix, and
  rollback procedures end to end.

## Alternatives considered

| Option                                                                                  | Why not                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `conventional-changelog-cli` / `conventional-recommended-bump`                          | Handles every Conventional Commits edge case correctly, but adds a chain of new dependencies for a single-maintainer project's release script. Explicit user choice to hand-roll instead.                                                           |
| `nativeVersion` or `sdkVersion` runtime policy                                          | Requires remembering to bump a version string by hand on every native-relevant change; `fingerprint` computes compatibility rather than trusting a human to track it.                                                                               |
| `type: update` for the hotfix's publish step                                            | Runs against the workflow's own trigger ref, not an arbitrary branch named at dispatch time — wrong tool for "publish from this specific hotfix branch."                                                                                            |
| Literal `EXPO_PUBLIC_*` values in `eas.json`'s `env`                                    | Works, but puts non-secret-but-still-shouldn't-be-committed, per-profile values in a file everyone with repo access can read — EAS-hosted environment variables are the documented pattern for exactly this case.                                   |
| Inline Apple API key path / Sentry auth token in `eas.json`                             | Both are real secrets; `eas.json` is committed. EAS credentials storage and EAS environment variables (secret visibility) are what these are for.                                                                                                   |
| `eas-cli` as a pinned devDependency, with `npm audit` overrides for its transitive tree | `expo-doctor` explicitly rejects installing `eas-cli` in the project at all; `npx eas-cli` is the documented pattern, and it sidesteps the audit noise and the `@expo/config-plugins` hoisting accident entirely rather than working around either. |

## Verification

- `npm run validate` passes with `expo-updates` installed and removed from
  `knip.json`'s `ignoreDependencies` (it was there specifically pending
  this adoption, per `docs/PROJECT.md`'s own prior note).
- `npx eas-cli build:configure --platform ios` reaches (and stops at) "An
  Expo user account is required to proceed" — the honest result, since this
  session has no authenticated EAS account. `npx eas-cli config --platform
ios --profile <name>` (no login needed to reach schema validation) caught
  a real bug first: `autoIncrement: "buildNumber"` failed with `"build.
production.autoIncrement" must be a boolean` against this CLI version's
  actual schema, contradicting what the fetched docs had said about
  string values being accepted. Fixed to `autoIncrement: true`; all three
  profiles then pass schema validation and only fail at the login prompt,
  confirming the schema itself — not just the docs' description of it — is
  correct.
- Every `.eas/workflows/*.yml` file parses as valid YAML and matches the
  field shapes confirmed against Expo's current docs above; two real syntax
  bugs were caught this way (`build_ids: [${{ ... }}]` needed quoting, and
  a `run:` command mixing a colon inside a double-quoted `${{ }}` value
  needed a block scalar instead) before they could have failed silently in
  an actual EAS Workflows run.
- `node scripts/release.mjs` (dry run) ran against this repo's real commit
  history and correctly picked out exactly the `feat`/`fix`/`perf` commits,
  correctly excluded `docs`/`test`/`chore`/unstructured commits, and
  correctly computed a minor bump (`1.0.0` → `1.1.0`) from the highest
  bump found. Two real bugs were caught and fixed in the process: `git
describe`'s expected "no tags yet" error was leaking to stderr, and a
  `%x00`-delimited multi-commit `git log` parse was attaching each
  record's trailing newline to the _next_ record's hash.
- `npm audit` was reintroduced to non-zero (13 vulnerabilities, all in
  `eas-cli`'s own transitive devDependencies) by installing `eas-cli` as a
  devDependency at all. Tried `overrides` first — `ajv`, `diff`, `joi`,
  `minimatch`, `nanoid`, `tar`, `ts-deepmerge`, `uuid`, `yaml` — which
  worked but needed a scoped `ajv` override (unscoped broke ESLint, which
  depends on an incompatible older `ajv` via `@eslint/eslintrc`) and an
  unscoped `nanoid` pinned to a _specific_ safe `3.x` release rather than
  the newest `6.x` (unscoped-latest broke Jest, since `expo-router` needs
  the CJS-compatible `3.x` line and `6.x` is ESM-only). Both fixes worked,
  but the actual resolution was simpler: `eas-cli` doesn't belong in
  `package.json` at all (see "Decision" above), and removing it made every
  one of these overrides unnecessary — confirmed by deleting them and
  reinstalling, with `npm audit` staying at zero.
