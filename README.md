# SundayBest

An iOS-only, iPhone-only app. Free, no accounts, no ads, no tracking. See
[docs/PROJECT.md](docs/PROJECT.md) for the full set of product and technical
decisions this repo is built on.

This repo is in **setup**, not product build-out — the architecture, testing
harness, security foundation, CI, and release pipeline are in place; product
screens haven't been built yet. `docs/SETUP_CHECKLIST.md` tracks everything
still needed before a real submission (accounts, credentials, and a small
number of code changes that need a real device or a paid plan to verify).

## Prerequisites

- **Node 24.21.0** (see `.nvmrc`) and **npm ≥ 11**. `nvm use` picks up the
  pinned version if you use nvm.
- **Xcode**, for the iOS simulator and native builds. This is an iOS-only
  app — there's no Android or web target to fall back on.
- **A `.env` file** — see "Clone and run" below.
- The `gitleaks` binary on your `PATH` for the pre-commit hook
  (`brew install gitleaks`, **not** `npm install gitleaks` — that npm
  package is an unrelated tool). See
  [docs/SETUP_CHECKLIST.md](docs/SETUP_CHECKLIST.md), "Per developer".

## Clone and run

```sh
git clone https://github.com/wwhitakerV/sundaybest.git
cd sundaybest
nvm use          # if you use nvm
npm install      # also installs git hooks via lefthook
cp .env.example .env
npm run ios      # or: npm start
```

`npm install` installs git hooks automatically (pre-commit lint/format/
secret-scan/related-tests, commit-msg Conventional Commits check, pre-push
`npm run validate`) — see [ADR 0008](docs/adr/0008-repository-guardrails-and-ci.md).

The app refuses to launch without a valid `.env`; `npm run check:env`
validates it against the same schema the app enforces at startup.

### Everyday commands

| Command                | Does                                                          |
| ---------------------- | ------------------------------------------------------------- |
| `npm run ios`          | Dev server, iOS simulator, `APP_VARIANT=development`          |
| `npm run dev:mcp`      | Same, with Expo MCP local capabilities (screenshots, tapping) |
| `npm run validate`     | The gate: typecheck, lint, format, knip, tests, doctor        |
| `npm test`             | Jest, watch mode off                                          |
| `npm run test:related` | Jest for files related to what you're touching                |

Full command list in [AGENTS.md](AGENTS.md).

## Architecture, in one picture

Feature-sliced, with the dependency direction enforced by ESLint:

```
app -> features -> ui, core, hooks, utils, theme, types
core -> utils, theme, types
ui / hooks -> utils, theme, types
utils -> types
```

`src/app/` holds routes only — one-line re-exports of feature screens. Every
side-effect SDK (secure storage, networking, crash reporting, app integrity)
is wrapped inside `src/core` and imported from there; nothing else may import
one directly. Full rules in [AGENTS.md](AGENTS.md); the reasoning behind each
one is in [docs/adr/](docs/adr/) and [docs/PROJECT.md](docs/PROJECT.md).

## Building a feature

Features are built test-first, from a written spec, using the `new-feature`
skill:

1. **Write the spec.** Copy `docs/specs/_TEMPLATE.md` to
   `docs/specs/<name>.md` and fill it in — Given/When/Then acceptance
   criteria, what data it touches, and its privacy/security impact. The
   skill won't proceed on a draft.
2. **Run the skill**: `/new-feature <name>` in Claude Code. It scaffolds the
   slice from `src/features/_template/`, writes failing tests from the
   spec's acceptance criteria, implements until they're green, runs
   `npm run validate`, and runs the security and code reviewers.
3. **Review the PR summary** it produces: what the feature does, each
   acceptance criterion mapped to its test, privacy impact, reviewer
   findings and how each was resolved, and anything added to
   `docs/SETUP_CHECKLIST.md`.

Doing it by hand instead of via the skill still means: a spec first, a
failing test before any implementation, `npm run validate` passing, and both
reviewers run before you call it done — see
[ADR 0002](docs/adr/0002-testing-strategy.md) and
[.claude/rules/testing.md](.claude/rules/testing.md).

## Releasing

Also a skill: `/release` runs
[scripts/release.mjs](scripts/release.mjs), which reads Conventional Commits
since the last tag and picks the version bump (`feat` → minor, `fix`/`perf`
→ patch, a `!` or `BREAKING CHANGE:` footer → major). It's a dry run by
default — nothing changes until you re-run it with `--apply`, which bumps
`package.json`, writes `CHANGELOG.md`, tags, and pushes. The pushed tag
triggers [`.eas/workflows/build-production.yml`](.eas/workflows/build-production.yml):
lint → test → build → submit to App Store Connect → publish the matching
EAS Update channel entry.

Full walkthrough, plus the hotfix-OTA and rollback procedures, in
[docs/release/runbook.md](docs/release/runbook.md).

## Where the docs are

| Doc                                                                  | Covers                                                                                          |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [AGENTS.md](AGENTS.md)                                               | The rules — architecture, TDD, conventions, security never-dos                                  |
| [docs/PROJECT.md](docs/PROJECT.md)                                   | Canonical project facts, toolchain, and every trap found building this                          |
| [docs/adr/](docs/adr/)                                               | Architecture decisions, one per significant choice, with alternatives                           |
| [docs/SETUP_CHECKLIST.md](docs/SETUP_CHECKLIST.md)                   | Every remaining human/account action, grouped by who and when                                   |
| [docs/security/masvs-checklist.md](docs/security/masvs-checklist.md) | OWASP MASVS control coverage                                                                    |
| [docs/security/threat-model.md](docs/security/threat-model.md)       | What this app defends against, and what it deliberately doesn't                                 |
| [docs/privacy/data-inventory.md](docs/privacy/data-inventory.md)     | What the app collects, stores, and sends — kept in sync with `app.config.ts`'s privacy manifest |
| [docs/api/attestation.md](docs/api/attestation.md)                   | The App Attest contract the (not-yet-built) backend must implement                              |
| [docs/release/runbook.md](docs/release/runbook.md)                   | Normal release, hotfix OTA, and rollback procedures                                             |
| [docs/specs/](docs/specs/)                                           | Feature specs, one per slice, written before implementation                                     |

Each folder under `src/` also has its own `README.md` stating what belongs
there and what must never go there.
