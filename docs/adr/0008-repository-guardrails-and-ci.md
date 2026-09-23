# 8. Repository guardrails and CI

Date: 2026-09-19

## Status

Accepted

## Context

Up to this point `npm run validate` was the only gate, and it only ran when
someone remembered to run it. There was no CI, no git hooks, no automated
dependency updates, and no GitHub-side governance (CODEOWNERS, PR/issue
templates, a way to report a vulnerability). This decision adds all of that:
lefthook-managed git hooks, a CI workflow, Renovate, and the GitHub
governance files, plus a branch-protection script that is written but
deliberately not run by an agent.

## Decision

### Git hooks: lefthook, not husky

`lefthook` (Go binary, npm-distributed) over `husky`/`simple-git-hooks`
because its own `postinstall` script runs `lefthook install` automatically —
confirmed by reading `node_modules/lefthook/postinstall.js` directly rather
than trusting a general claim about "auto-install on `npm install`" — and it
skips that install inside CI unless `LEFTHOOK=1` is explicitly set, so a CI
runner never ends up with hooks installed that could interfere with
anything. No extra `prepare` script was needed.

`pre-commit` runs eslint, prettier, gitleaks, and related tests in parallel
on staged files (`lefthook.yml`), `commit-msg` runs commitlint against
Conventional Commits, `pre-push` runs the full `npm run validate`. `eslint`
and `prettier` use `stage_fixed: true` so a fix they apply gets re-staged
automatically rather than leaving the commit inconsistent with what was
actually committed.

### gitleaks is a Go binary, never an npm package

**The `gitleaks` package on the npm registry is not the real tool.** It's
an unrelated wrapper (v1.0.0, by a different author) confirmed by reading
its own `npm view` metadata before writing any config against it. Real
gitleaks is downloaded as a binary release from
`github.com/gitleaks/gitleaks/releases` (current: v8.30.1), both for the
local pre-commit hook (a per-developer install, `docs/SETUP_CHECKLIST.md`)
and in CI, where the exact release asset is downloaded and checksum-verified
against the release's own `_checksums.txt` before running.

**`detect`/`protect` are deprecated as of gitleaks v8.19** in favor of `git`,
`dir`, and `stdin` subcommands — confirmed against the project's own
deprecation notice and command-translation gist, not memory, since `detect`
is old enough to be what most existing documentation and tutorials still
show. `lefthook.yml` uses `gitleaks git --pre-commit --staged`; CI uses
`gitleaks git` (full history, `fetch-depth: 0` on the checkout so gitleaks'
`git log -p` has something more than the last commit to scan).

**gitleaks' own default allowlist filters obviously-fake secrets** (an
alphabet-sequence stopword check, among others) — verified by testing with
values like `AKIAIOSFODNN7EXAMPLE` and a `ghp_...abcdefghijklmnopqrstuvwxyz`
string, both of which gitleaks' trace-level logs showed matching a rule and
then being suppressed by its own global allowlist. A realistic-looking fake
secret was needed to actually prove detection works end to end; recorded
here so nobody "fixes" a future test that uses an obviously-fake value and
gets confused when it doesn't trigger.

`.gitleaks.toml` extends gitleaks' bundled rules (`[extend] useDefault =
true`) rather than replacing them, and its own `[allowlist]` covers exactly
two things: `.env.example` and test fixtures (`tests/mocks/**`,
`tests/factories/**`, `*.test.tsx?`). Verified end to end against a scratch
repo: a fake secret in `tests/mocks/fake.test.ts` was allowed, the identical
string in `src/core/real.ts` was flagged — the allowlist is scoped
correctly, not a blanket exemption.

### CI mirrors `validate`, then adds supply-chain scanning

`.github/workflows/ci.yml` runs, in one job, in this order: checkout (full
history) → Node from `.nvmrc` with npm's built-in cache → `npm ci` → every
step of `npm run validate` individually (so a failure names the exact step,
not just "validate failed") → coverage upload → `npm audit --omit=dev`
(mirrors `docs/PROJECT.md`'s "must stay at zero," no `--audit-level`
threshold to hide behind) → OSV-Scanner → gitleaks (binary, not
`gitleaks/gitleaks-action` — that Action requires a paid license for
organization-owned repositories, which this prompt explicitly called out) →
a CycloneDX SBOM, uploaded as an artifact.

Every third-party `uses:` is pinned to a full commit SHA with a `# vX.Y.Z`
comment, resolved against each action's actual current release at the time
of writing (not memory — `actions/checkout` etc. had all moved well past
the v4 that would have been the "obviously safe" guess). `permissions:
contents: read` at the workflow level; nothing in this workflow needs to
write anything. `concurrency` cancels a superseded run for the same ref.

### Renovate groups the SDK, never bumps it alone

`renovate.json` extends `config:recommended` (the current base preset name
— `config:base` was renamed some time ago, confirmed against current docs
rather than assumed). A `packageRules` entry groups every `expo`/`expo-*`/
`@expo/*` package plus the `react`/`react-native`/`react-native-*` peers the
SDK pins, with `automerge: false` — an Expo SDK upgrade is deliberate, via
Expo's own upgrade guide and `npx expo install --fix`, never something
Renovate should quietly do package-by-package. GitHub Actions are pinned by
digest (`pinDigests: true` scoped to `matchManagers: ["github-actions"]`).
Only dev-dependency patch updates automerge, and only once CI has passed —
which is toothless without required status checks, which is exactly what
`scripts/setup-branch-protection.sh` sets up. Vulnerability alerts
(`osvVulnerabilityAlerts`, `vulnerabilityAlerts.enabled`) are not subject to
the weekly schedule.

### Governance files, and a script that is written but not run

`.github/CODEOWNERS` lists `@wwhitakerv` as the catch-all and again,
explicitly, for `src/core/security/`, `app.config.ts`, `eas.json`, `.eas/`,
and `.github/` — redundant with the wildcard today, but it makes the
audit-sensitive surface visible in the file itself. The PR template asks
for a spec link, real test evidence, a security checklist drawn from
`.claude/rules/security.md`, screenshots, and privacy impact. Issue
templates cover bug reports and feature specs;
`.github/ISSUE_TEMPLATE/config.yml` disables blank issues and points a
security report at GitHub's private Security Advisory flow instead — the
same flow `SECURITY.md` documents, since it needs no new contact
infrastructure and is GitHub's own supported private-disclosure path.

`scripts/setup-branch-protection.sh` sets required PR reviews, Code Owner
review, the CI job as a required, up-to-date status check, signed commits,
linear history, and blocks force pushes — via `gh api`, since the fuller
ruleset (signed commits especially) needs the REST API rather than `gh`'s
higher-level porcelain. It is **not executed** here: the prompt that asked
for it was explicit that it should be written and checklisted, not run, and
it also cannot be dry-run in this environment since the `gh` CLI isn't
installed locally.

## Consequences

### Good

- The same gate now runs whether or not a human remembers to run it:
  locally on every commit/push, and again in CI on every PR.
- Three independent layers now exist for "don't commit a secret": the local
  gitleaks pre-commit hook, the CI gitleaks job, and (once the checklist
  item lands) GitHub's own push protection.
- An Expo SDK bump can never happen as a side effect of routine dependency
  churn — it is gated behind `automerge: false` and a human decision.

### Bad

- **Branch protection, the Renovate app installation, secret-scanning
  push-protection, and commit signing are all still checklist items.**
  Every "automerged only after CI passes" and "required review" guarantee
  above is aspirational until `scripts/setup-branch-protection.sh` actually
  runs — the config files are ready, the enforcement is not yet live.
- **CI cannot be fully exercised locally.** OSV-Scanner's GitHub Action and
  the gitleaks-in-CI step were verified as separately-runnable commands
  (the underlying binary/CLI), but the actual GitHub Actions runtime
  (`actions/checkout`, `actions/setup-node`, artifact upload) is only
  provable by an actual workflow run once this is pushed.
- **Two npm packages named `gitleaks` and `renovate-config-validator`-style
  confusion is a standing trap** for anyone who reaches for `npm install
gitleaks` out of habit — recorded here and in `docs/PROJECT.md` so it
  doesn't get reintroduced.

### Neutral

- `docs/SETUP_CHECKLIST.md` gained a full new section, "Repository
  guardrails and CI," covering every account-level action above.

## Alternatives considered

| Option                                                            | Why not                                                                                                                                                                           |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `husky` instead of `lefthook`                                     | Requires its own `prepare` script wiring and a separate glob-filtering tool (`lint-staged`) to get the same staged-file behavior lefthook does natively.                          |
| `gitleaks/gitleaks-action` in CI                                  | Requires a paid license for organization-owned repositories — explicitly ruled out by the prompt this ADR implements.                                                             |
| `gitleaks detect`/`protect`                                       | Deprecated since v8.19; still functional but the current subcommands (`git`, `dir`, `stdin`) are what new configuration should target.                                            |
| A single combined "lint and scan" CI step instead of one per tool | A single failing step would hide which check actually failed; splitting each `validate` sub-step and each scanner into its own named step makes a red CI run legible at a glance. |
| Running `setup-branch-protection.sh` immediately                  | Explicitly out of scope for this change — the prompt asked for it to be written and checklisted, not executed, and admin `gh` access isn't available in this environment anyway.  |

## Verification

- `npx lefthook validate` accepts `lefthook.yml`; `npx lefthook install`
  registers real `pre-commit`, `commit-msg`, and `pre-push` hooks in
  `.git/hooks/` (confirmed by inspecting the generated hook scripts).
- A real gitleaks v8.30.1 binary, downloaded and checksum-verified exactly
  as the CI step does, ran against this repository's actual history:
  `10 commits scanned... no leaks found`.
- The same binary, run against a scratch repository with a realistic fake
  secret staged in both an allowlisted test-fixture path and a real source
  path, allowed the former and flagged exactly the latter.
- `npx renovate-config-validator renovate.json` (via the real `renovate`
  package, not a guess) reports `Config validated successfully`.
- `npm run validate` passes with the new config files present
  (`lefthook.yml`, `commitlint.config.js`, `.gitleaks.toml`,
  `renovate.json`, `.github/**` are all outside anything `typecheck`/
  `lint`/`test` touch; `knip:check` needed `@cyclonedx/cyclonedx-npm` added
  to `ignoreDependencies` since nothing in `src/`/`tests/` imports it — knip
  already understood `lefthook.yml` and `commitlint.config.js` natively via
  its own plugins and needed no ignore entry for those).
- A non-Conventional-Commits commit message is rejected by the `commit-msg`
  hook (real output captured in this session's final report, not asserted
  from memory).
