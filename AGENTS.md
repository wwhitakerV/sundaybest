# AGENTS.md — rules for every coding agent on SundayBest

Canonical rulebook. `CLAUDE.md` imports this file. Facts live in
[docs/PROJECT.md](docs/PROJECT.md); this file is the rules.

## Expo has changed

Read the exact versioned docs at <https://docs.expo.dev/versions/v57.0.0/>
before writing any code. Assume anything you remember about Expo is out of date.

## Product constraints

- **iOS only, iPhone only.** No Android, no web, no iPad.
- **Free.** No purchases, no subscriptions.
- **No accounts, no sign-in.**
- **No ads. No tracking** — no analytics SDKs, no IDFA, no third-party telemetry.
- The app ships as **SundayBest**. The name is settled; do not reopen it.

## Commands

| Command                                   | Use                                                          |
| ----------------------------------------- | ------------------------------------------------------------ |
| `npm run validate`                        | The gate: typecheck, lint, format:check, knip, tests, doctor |
| `npm run typecheck`                       | `tsc --noEmit`                                               |
| `npm run lint` / `lint:fix`               | ESLint                                                       |
| `npm run format` / `format:check`         | Prettier                                                     |
| `npm run test` / `test:watch` / `test:ci` | Jest; `test:ci` enforces coverage                            |
| `npm run test:related <files>`            | Tests related to specific files                              |
| `npm run knip:check`                      | Unused files, exports, dependencies                          |
| `npm run ios` / `npm run start`           | Dev server                                                   |
| `npm run dev:mcp`                         | Dev server with Expo MCP local capabilities                  |

Install Expo SDK packages with `npx expo install`. Pin exact versions (no `^`,
no `~`) for everything else. Use npm, and `npx` where another runner would be used.

## Architecture and dependency rules

Feature-sliced; see [ADR 0001](docs/adr/0001-feature-sliced-architecture.md) and
each folder's README.

```
app -> features -> ui, core, hooks, utils, theme, types
core -> utils, theme, types
ui / hooks -> utils, theme, types
utils -> types
```

- `src/app/` holds routes only: one-line re-exports of feature screens. No logic,
  no tests.
- A feature slice is reachable **only** through its `index.ts`.
- `ui`, `hooks`, and `utils` never import `features`, `core`, or `app`.
- `src/utils` is pure: no React, no I/O.
- **Every side-effect SDK import lives in `src/core`** — secure storage, app
  integrity, networking, crash reporting, analytics. Wrap it there in a narrow
  typed API and import that.

ESLint enforces all of this. Do not "fix" the boundaries config without reading
the traps recorded in [docs/PROJECT.md](docs/PROJECT.md).

## TDD rules

Non-negotiable, and in this order:

1. **Write the failing test first, and show it failing.** A test you have not
   watched fail proves nothing — it may assert the wrong thing, or nothing.
2. **Smallest change that makes it pass.** No extra abstraction, no speculative
   options, no adjacent refactors.
3. **Refactor only while green.** Run the tests before and after; if they are
   red, you are debugging, not refactoring.

New behavior needs a test that fails first. Bug fixes start with a test that
reproduces the bug. See [ADR 0002](docs/adr/0002-testing-strategy.md).

## Conventions

- **`src/utils`**: one exported function per file, file named after it matching
  its casing (`redaction/redactSensitive.ts`). Test beside it. No barrel files.
- **Named exports everywhere.** `src/app/**` is the only exception, because Expo
  Router discovers routes by default export.
- **Zod at every boundary.** Anything crossing into the app — network responses,
  deep-link params, stored values, env config — is parsed, not cast. `as` on
  untrusted data is a bug.
- **A `testID` on every interactive element**, and on any element a test needs to
  find. Forward `testID` through wrapper components.
- Components in `PascalCase.tsx`, hooks and plain modules in `kebab-case.ts`.
- Colocate unit tests as `*.test.ts(x)`; never put tests in `src/app/`.

## Security never-dos

- **Never** put a secret in code, a committed file, or an `EXPO_PUBLIC_*`
  variable. Anything `EXPO_PUBLIC_` is compiled into the bundle and readable by
  anyone with the app.
- **Never** read, print, or invent real credentials. `.env.example` placeholders
  only. If a step needs credentials, an account action, or a paid plan: stop,
  ask, and add it to [docs/SETUP_CHECKLIST.md](docs/SETUP_CHECKLIST.md).
- **Never** store sensitive data outside secure storage. No tokens or personal
  data in AsyncStorage, plain files, or Redux persistence.
- **Never** import a side-effect SDK outside `src/core`.
- **Never** log user or device data. Route logging through
  `src/core/monitoring` and redact with `@/utils/redaction/redactSensitive`
  first.
- **Never** disable a lint or security rule without an ADR. No blanket
  `eslint-disable`; a single-line disable needs a reason on the line above, and
  turning a rule off project-wide needs an ADR explaining what replaces it.

## Definition of done

A change is done when all of these hold:

- [ ] `npm run validate` passes.
- [ ] New behavior has a test that was seen to fail first.
- [ ] Coverage thresholds hold: 80% global, 95% in `src/utils/**` and
      `src/core/security/**`.
- [ ] Dependency rules pass without new exceptions.
- [ ] No new `TODO` without an issue link, and no dead code (knip is clean).
- [ ] Anything a human must do is in `docs/SETUP_CHECKLIST.md`.
- [ ] Docs updated when behavior changed: the folder README, `docs/PROJECT.md`,
      or a new ADR for a decision.
- [ ] A Conventional Commit, scoped to one logical change.

## Working agreement

- **Verify against current docs, never memory.** Check every version, API, and
  config key against the Expo MCP server or the Expo skills / versioned docs
  before writing code.
- **Install Expo SDK packages with `npx expo install`;** pin exact versions for
  everything else.
- **Use npm** for installs and scripts, and `npx` wherever another package
  runner would be used.
- **Never read, print, or create real secrets** (see above).
- **Finish every task by running its verification steps**, then make a
  [Conventional Commit](https://www.conventionalcommits.org/).
- **Report honestly.** If a step was skipped or a check failed, say so with the
  output. Do not claim a verification you did not run.
