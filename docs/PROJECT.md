# SundayBest — project values

Canonical project facts. Later setup prompts read this file instead of re-asking.

## Identity

| Key                   | Value                           |
| --------------------- | ------------------------------- |
| App name              | SundayBest                      |
| Slug                  | `sundaybest`                    |
| URL scheme            | `sundaybest`                    |
| Production bundle ID  | `com.walterwhitaker.sundaybest` |
| Expo owner (username) | `walterwhitakerv`               |
| Expo account email    | `walt.whitakerv@gmail.com`      |
| GitHub repo           | `wwhitakerV/sundaybest`         |
| Package manager       | npm (exec command: `npx`)       |
| Staging API base URL  | `api.sundaybest.com`            |
| Code owners           | `@wwhitakerv`                   |

## Settled decisions

- **The app ships as SundayBest.** Design files for a "Sermon Drop" concept exist
  outside this repo; the name, slug, scheme, and bundle ID above are final and
  were confirmed on 2026-09-15. Do not reconcile the two — this is decided.
- **The setup series (prompts 1-13) is complete.** Tooling, architecture,
  testing, CI, and release plumbing are established. Product build-out has
  started: real screens, features, and product surface are now in scope, built
  against the design references the user provides as they're given.
- **The app never follows the device's dark-mode setting.** `useTheme()` always
  returns `lightTheme` and `app.config.ts` pins `userInterfaceStyle` to `light`,
  so native chrome cannot go dark underneath it either. `darkTheme` stays
  defined in `tokens.ts` because a real dark theme is future work with its own
  design — it is not wired to the OS setting when it lands.

## Product constraints

- iOS only for now — no Android, no web.
- iPhone only — no iPad (`ios.supportsTablet: false`).
- Free — no in-app purchases, no subscriptions.
- No user accounts and no sign-in.
- No ads.
- No tracking — no analytics SDKs, no IDFA, no third-party telemetry.

## Toolchain

| Key          | Value                 | Source of truth                       |
| ------------ | --------------------- | ------------------------------------- |
| Expo SDK     | 57 (`expo@~57.0.23`)  | npm `expo@latest`, checked 2026-09-15 |
| React Native | 0.86.3                | SDK 57 bundled version                |
| React        | 19.2.3                | SDK 57 bundled version                |
| Node         | 24.21.0 (Krypton LTS) | `.nvmrc`, `engines.node`              |
| TypeScript   | `~6.0.3`              | template default                      |

Node 24.21.0 satisfies React Native 0.86.3's declared requirement
(`^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`).

## Dependency security pins

`npm audit` must stay at zero. Pins in `package.json` `overrides` keep it
there without moving off Expo SDK 57:

| Pin                                         | Why                                                                                                                                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `xcode > uuid@11.1.1`                       | uuid@7 missed a buffer bounds check in v3/v5/v6. Build-time only (`xcode` calls `uuid.v4()`); 11.1.1 still ships CJS.                                                                         |
| `query-string > decode-uri-component@0.5.0` | `<=0.4.2` decodes malformed percent-encoding in exponential time. It ships in the iOS bundle via expo-router's deep-link parsing, so a crafted `sundaybest://` link could hang the JS thread. |
| `react-dom@19.2.3`                          | Not a dependency (iOS only), but Expo declares it as an optional peer and npm will hoist a copy. Pinning stops it drifting ahead of `react@19.2.3`.                                           |

`decode-uri-component@0.5.0` is the only patched release and is ESM-only, so
`query-string@7.1.3`'s CJS `require` of it returns a module namespace instead of a
function. `patches/query-string+7.1.3.patch` makes that one require
interop-aware; `patch-package` reapplies it on every install via `postinstall`.
(Previously `patches/expo-router++query-string+7.1.3.patch`, scoped to a nested
copy under `expo-router` — installing `eas-cli` hoisted `query-string` to the
top level, so the patch was regenerated at its new path. Check
`patch-package`'s postinstall output after any dependency change; a
silently-failed patch does not fail the install.)

Do not bump `query-string` to 9.x to fix this: 9.x is `export default` only, so
expo-router's `__importStar(require("query-string")).stringify` becomes `undefined`
and every navigation with params throws.

## Code quality baseline

`npm run validate` is the gate: `typecheck` -> `lint` -> `format:check` ->
`knip:check` -> `check:env` -> `test` -> `doctor`.

| Script                    | Does                                            |
| ------------------------- | ----------------------------------------------- |
| `typecheck`               | `tsc --noEmit`                                  |
| `lint` / `lint:fix`       | ESLint flat config                              |
| `format` / `format:check` | Prettier, the single source of formatting truth |
| `knip:check`              | unused files, exports, and dependencies         |
| `check:env`               | `.env*` files against the app's own Zod schema  |
| `test` / `test:ci`        | Jest; `test:ci` enforces coverage               |
| `doctor`                  | `expo-doctor`                                   |
| `icons`                   | regenerates the placeholder variant icons       |
| `validate`                | all of the above except `test:ci` and `icons`   |

### Constraints found while setting this up — do not "fix" these blindly

- **ESLint stays on 9.x.** `eslint-config-expo@57.0.2` depends on
  `eslint-plugin-react`, whose newest release (7.37.5) declares
  `eslint: ...|| ^9.7` and calls `context.getFilename()`, removed in ESLint 10.
  On ESLint 10 every lint run dies with
  `TypeError: ... contextOrFilename.getFilename is not a function`. Revisit only
  once eslint-plugin-react ships ESLint 10 support.
- **The knip script is `knip:check`, not `knip`.** expo-doctor's
  `PackageJsonCheck` flags any script whose name matches a file in
  `node_modules/.bin`, with no opt-out:
  `bins.filter((b) => pkg.scripts[b])`. A script named `knip` therefore makes
  `npm run doctor` fail forever. The same trap applies to `eslint`, `expo`,
  `expo-doctor`, `prettier`, and `tsc` — never use those as script names.
- **`exactOptionalPropertyTypes` is on and did not fight Expo's types.** It was
  the flag flagged as droppable; it turned out unnecessary to drop on this
  codebase. If it starts fighting a real Expo API later, narrow the call site
  rather than disabling the flag project-wide.
- **`settings.jest.version` is pinned to 29** in `eslint.config.js`.
  `jest/no-deprecated-functions` resolves the installed jest to read its
  deprecations and throws `Unable to detect Jest version` when jest is absent,
  so any test file would crash lint before prompt 4 installs `jest-expo@~57.0.5`
  (which is built on Jest 29).
- **Type-aware rules are noisy on test files until jest types exist.** Untyped
  `describe`/`it`/`expect` currently produce `@typescript-eslint/no-unsafe-call`
  and `no-unsafe-member-access`. Prompt 4 should make the jest globals typed
  rather than switch the rules off.
- **`expo-updates` is in knip's `ignoreDependencies`.** Knip's Expo plugin reports
  it as an unlisted dependency of the app config even though this app has no
  `updates` config and no OTA story. Replacing `app.json` with `app.config.ts`
  did not retire the ignore — knip just moved the report. Remove it if EAS Update
  is ever adopted.
- **`expo-status-bar` and `expo-system-ui` were removed** as genuinely unused
  (nothing imports them, nothing depends on them, and `expo export` plus
  expo-doctor both still pass). Re-add with `npx expo install` when first needed.

## Configuration and environments

Full rationale in [ADR 0004](./adr/0004-configuration-and-environments.md).

`app.json` is gone; `app.config.ts` is the app config, driven by `APP_VARIANT`.

| Variant       | Name                   | Bundle ID                               | Icon                          |
| ------------- | ---------------------- | --------------------------------------- | ----------------------------- |
| `development` | `SundayBest (Dev)`     | `com.walterwhitaker.sundaybest.dev`     | `assets/icon-development.png` |
| `preview`     | `SundayBest (Preview)` | `com.walterwhitaker.sundaybest.preview` | `assets/icon-preview.png`     |
| `production`  | `SundayBest`           | `com.walterwhitaker.sundaybest`         | `assets/icon.png`             |

- **`APP_VARIANT` defaults to `development`** when unset, and an unrecognised
  value throws. A default is unavoidable because `expo-doctor`, `expo export`,
  and `expo config` all evaluate the config without setting it. `development` is
  the safe default: a dev-identity build where production was wanted is loud and
  unshippable, while defaulting to production would let a forgotten variable
  claim the real bundle ID.
- `npm start`, `npm run ios`, and `npm run dev:mcp` set
  `APP_VARIANT=development` themselves.
- Runtime config is `src/core/config/env.ts` — the `EXPO_PUBLIC_*` variables
  parsed with Zod at module scope and frozen. `.env.example` documents them;
  `npm run check:env` validates `.env` files against the same schema and is part
  of `validate`.
- Placeholder icons are generated by `npm run icons`
  (`scripts/generate-icons.mjs`, no image dependency). Real artwork is a
  checklist item.

### Config traps found while building this — do not "fix" these blindly

- **`ios.config` never appears in `expo config --type public`.** Expo documents
  the key as excluded from the public manifest because it historically held API
  keys. `usesNonExemptEncryption` lives there, so verify it with
  `expo config --type prebuild` or `--full`, not `--type public`.
- **`app.config.ts` must not import from `src/`.** A nested `.ts` import
  resolves under `npx expo config --type public` but throws
  `Cannot find module` under `expo config --full`, which is the path
  `expo-doctor` takes — that path evaluates the config as CommonJS with no
  TypeScript require hook. The variant list is therefore repeated in both files
  on purpose.
- **ESLint's config-file block had to split by module system.** `app.config.ts`
  matched a block that set `sourceType: "commonjs"`, which makes `export default`
  a parse error. `eslint.config.js` now has `CJS_CONFIG_FILES` and
  `ESM_CONFIG_FILES` (the latter also covering `scripts/**`).
- **`process.env` is typed `any`** by `expo-modules-core`'s
  `[key: string]: any` index signature, so every read is an unchecked `any` and
  the type-aware lint rules flag the assignment.
  `src/types/expo-public-env.d.ts` merges the four `EXPO_PUBLIC_*` names into
  `NodeJS.ProcessEnv`. `APP_VARIANT` is deliberately _not_ declared there: it
  does not exist at runtime on a device, so app code must not be able to read it.
- **Only literal `process.env.EXPO_PUBLIC_X` reads work.** Expo's Babel plugin
  rewrites statically-written member expressions only. In a release build it
  inlines the value; in dev and under Jest it rewrites to `expo/virtual/env`,
  which is `export const env = process.env`. Either way `process.env[name]` and
  destructuring yield `undefined` in a release bundle.
- **`expo-updates` stays in knip's `ignoreDependencies`.** Knip's Expo plugin
  now reports it against `app.config.ts` instead of `app.json`, so removing
  `app.json` did not retire the ignore.
- **`.env` is required before `npm start`** (`cp .env.example .env`). The schema
  has no defaults on purpose — a production build that forgot
  `EXPO_PUBLIC_APP_VARIANT` would otherwise report itself as `development` and
  turn verbose logging on in a shipped app.
- **`AppProviders.tsx` must keep its side-effect `import "@/core/config/env"`.**
  It looks removable and is not. Nothing else in the app imports the config, so
  without it Metro drops the module from the bundle and the startup validation
  never runs — verified by exporting a release bundle and finding neither the
  configured API URL nor the error message in it.
- **`expo export` does not catch a missing variable**, because bundling never
  executes the module. A build with no `.env` exports cleanly and fails on
  launch. `npm run check:env` is the build-time guard.

## Security foundation

Full rationale in [ADR 0005](./adr/0005-app-attest-and-encrypted-storage.md);
threats in [docs/security/threat-model.md](./security/threat-model.md); control
coverage in [docs/security/masvs-checklist.md](./security/masvs-checklist.md).

The app has no accounts, so the backend authenticates the **install** with Apple
App Attest rather than a user. The backend does not exist yet — it is specified
in [docs/api/attestation.md](./api/attestation.md), with matching Zod schemas in
`src/core/api/contracts/` and a fake server in `tests/mocks/`.

| Module                             | Does                                         |
| ---------------------------------- | -------------------------------------------- |
| `src/core/security/secure-storage` | Keychain, typed keys, Zod-validated reads    |
| `src/core/security/attestation`    | App Attest flow, typed results, never throws |
| `src/core/security/session`        | Short-lived tokens, single-flight refresh    |
| `src/core/security/database-key`   | Generates and keeps the SQLCipher key        |
| `src/core/storage/database`        | SQLCipher adapter and the migration runner   |

`@expo/app-integrity` is pinned to an **exact** version (`57.0.2`): it is a young
library on the path that decides whether the backend trusts a request.

### Security traps found while building this — do not "fix" these blindly

- **`expo-sqlite` cannot be imported at the top of a Jest test file.** Its entry
  point pulls in `hooks.tsx`, which requires `expo-asset` — installed only at
  `node_modules/expo/node_modules/expo-asset`. Metro resolves that nested copy;
  Jest's resolver does not, so the suite dies with
  `Cannot find module 'expo-asset'` before a single test runs. Use
  `jest.mock("expo-sqlite", factory)` so the real module never executes. Do not
  "fix" it by installing `expo-asset` at the root just to satisfy Jest.
- **`AppIntegrity.isSupported` is `undefined` under Jest**, and is a module-scope
  **const** in the library, evaluated at import time. Read it inside the call,
  never captured at our own module scope, and compare against `true` rather than
  coercing — otherwise an absent constant reads as available.
- **`@expo/app-integrity` reports `isSupported === true` on non-iOS.** The
  library computes `Platform.OS === "ios" ? native.isSupported : true`, meaning
  "the Android path is available". Check the platform **first**, or a non-Apple
  platform looks like it has App Attest.
- **SQLCipher does not work in Expo Go.** `useSQLCipher` is a native build flag,
  so the encrypted database needs a development build.
- **`PRAGMA key` has no parameterised form**, so the key is concatenated into
  SQL. `sqlcipher-database.ts` re-validates the key against
  `/^[0-9a-f]{64}$/` before interpolating even though `database-key.ts` generates
  exactly that format. Do not remove the second check as redundant — it is the
  one standing between a malformed key and SQL injection.
- **A wrong SQLCipher key fails silently at `PRAGMA key`** and only errors on the
  first read. The adapter runs a `SELECT count(*) FROM sqlite_master` probe at
  open so that failure surfaces where its cause is obvious.
- **Jest mock factories may only reference `mock`-prefixed variables.** A
  factory that closes over `supported` fails with "not allowed to reference any
  out-of-scope variables"; `mockSupported` is fine.
- **Nothing calls the security modules yet.** They are reachable from their tests
  only. Wiring them into startup is a later prompt, deliberately.

## Network security and device integrity

Full rationale in [ADR 0006](./adr/0006-network-security-and-device-integrity.md).

| Module                          | Does                                                            |
| ------------------------------- | --------------------------------------------------------------- |
| `src/core/api/client.ts`        | Typed requests, Zod-parsed responses, typed failures, one retry |
| `src/core/api/query-client.ts`  | TanStack Query defaults; nothing persisted                      |
| `src/core/api/pinning/`         | TLS public-key pinning, placeholder hashes                      |
| `src/core/security/integrity/`  | freeRASP signals mapped to one small policy                     |
| `src/core/security/screen/`     | `usePrivacyScreen` — screenshots and app-switcher blur          |
| `src/core/security/deep-links/` | Allowlist for every inbound URL                                 |

### The most surprising thing in this repo

**`EXPO_PUBLIC_USE_RN_FETCH=1` is load-bearing and must never be removed.**

Expo SDK 57 replaces `globalThis.fetch` with `expo/fetch`
(`expo/src/winter/runtime.native.ts:41`). `expo/fetch` is a native module with
its own `URLSession` (`expo/ios/Fetch/ExpoFetchModule.swift:133`) and **no
authentication-challenge handler at all** — grepping that directory for
`challenge` or `serverTrust` returns nothing. TrustKit pins by intercepting that
callback, so it cannot see a single `expo/fetch` request.

The consequence is the nasty part: removing this variable leaves an app that
works perfectly, passes every test, and has **no TLS pinning whatsoever**, with
nothing to notice. That is why it is a required field in the env schema rather
than a line in `.env.example` — the app refuses to launch without it.

The cost: React Native's fetch does not stream response bodies. Nothing needs
that today. If something does, the decision reopens — it does not get quietly
reverted.

### Other traps from this prompt

- **Never write `\uXXXX` escapes in a regex character class here.** Twice, an
  escape like `\u0000` reached disk as a _literal_ control byte, which made git
  treat the source file as **binary**. `validate-deep-link.ts` uses an explicit
  code-point loop instead, which is plain text and says the same thing. Behaviour
  was identical either way, so tests did not catch it — `file` and `git diff`
  did.
- **A `Response` body can only be read once.** A Jest mock using
  `mockResolvedValue(new Response(...))` hands the _same_ instance to every call
  and fails the second one with "Body has already been read" — which real `fetch`
  never does. `client.test.ts` has an `alwaysJson` helper that builds a fresh one
  per call; use it for anything that expects a retry.
- **A Jest mock factory may only close over `mock`-prefixed variables.** A
  factory referencing `supported` fails with "not allowed to reference any
  out-of-scope variables"; `mockSupported` is fine.
- **`react-native-ssl-public-key-pinning` has no Expo config plugin**, and does
  not need one: it is autolinked and configured at runtime. It does need a
  development build — it is unavailable in Expo Go, where
  `isSslPinningAvailable()` returns false and `initializePinning` reports `false`
  rather than throwing.
- **`freerasp-react-native` has no `codegenConfig`**, so it is a legacy native
  module running through the New Architecture interop layer on RN 0.86. It works;
  it is the likeliest of the native dependencies to break on an SDK upgrade.
- **Pinning cannot be verified from a cold test run.** TLS sessions are cached,
  so a connection that already succeeded keeps succeeding after the pins change.
  The manual bad-certificate test has to start from a cold launch.
- **`useFreeRasp` is a hook, so it cannot be called conditionally.** Gate it by
  choosing whether to _render_ the component that calls it —
  `shouldMonitorIntegrity(variant)` exists for exactly that.

## Logging and crash reporting

Full rationale in
[ADR 0007](./adr/0007-logging-and-crash-reporting.md).

| Module                                   | Does                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| `src/core/monitoring/logger.ts`          | Leveled logger; redacts everything, never touches console in production    |
| `src/core/monitoring/crash-reporter.ts`  | `@sentry/react-native` wrapped behind `CrashReporter`; no-op with no DSN   |
| `src/core/monitoring/error-boundary.tsx` | `ErrorBoundary`/`SuspenseFallback`, re-exported from `src/app/_layout.tsx` |

Crash reporting is gated on `EXPO_PUBLIC_SENTRY_DSN` being set, not on build
variant — a build with no DSN sends nothing in any variant, matching
`.env.example`'s empty default. `metro.config.js` strips every `console.*`
call from a production/release bundle as a second, independent guarantee
alongside the logger's own runtime check.

### Traps found while building this — do not "fix" these blindly

- **`@sentry/react-native/metro`'s `withSentryConfig` breaks `expo export`.**
  Tried in `metro.config.js`: wrapping the config with it makes
  `npx expo export -p ios` fail with `TypeError: Cannot read properties of
undefined (reading 'match')`, thrown from inside Sentry's own Metro
  serializer once it processes the real module graph (`withSentryConfig`
  itself returns without error). `metro.config.js` only applies
  `drop_console`; source maps still work via the release/dist tag without
  Debug IDs. Checklist item to revisit against a newer `@sentry/react-native`.
- **`Constants.manifest2` types as `any` here.** Its declared type comes from
  `expo-manifests`, which is not an installed package — this app has no
  `expo-updates` dependency. `crash-reporter.ts`'s `currentUpdateId()` reads
  the field back out through an explicit runtime type guard rather than
  trusting the type, and ESLint's type-aware rules would otherwise flag the
  access as unsafe.
- **`core` cannot import `ui`.** The dependency graph is
  `core -> utils, theme, types` only. `error-boundary.tsx`'s `ErrorScreen`
  builds its layout from `View`/`SafeAreaView` directly rather than
  `@/ui/Screen`, which would be the obvious choice but is a disallowed import
  from `src/core`.
- **Expo Router's `ErrorBoundary`/`SuspenseFallback` exports are function
  components with `{ error, retry }` / `{ route, params }` props, not a
  `children`-wrapping class.** Router catches the render error itself
  (`expo-router/build/views/Try.d.ts`) and renders the exported component
  with those props. A class component that wraps `children` the way a plain
  React error boundary does would never receive anything meaningful from
  Router.
- **A test file that imports anything from `logger.ts` or
  `error-boundary.tsx` must mock `@sentry/react-native` and `expo-constants`,
  even if it never exercises the crash reporter.** Both modules construct a
  real `crashReporter` singleton at import time (`export const crashReporter
= createSentryReporter(defaultEnv)`), and the unmocked SDK starts a
  `setInterval` as an import-time side effect in its tracing integration,
  which keeps Jest's process alive after the run
  (`AsyncExpiringMap.startCleanup`). See the mocks at the top of
  `logger.test.ts`, `crash-reporter.test.ts`, and `error-boundary.test.tsx`.
- **`jest.resetModules()` invalidates mock references captured before the
  reset.** `crash-reporter.ts` guards `Sentry.init` behind a module-scope
  `let initialized`, which would otherwise leak across every test in
  `crash-reporter.test.ts` in the same run. `resetModules()` per test fixes
  that, but it also re-runs the `jest.mock(...)` factories, so the mocked
  `@sentry/react-native` module must be re-`require`'d alongside
  `crash-reporter` in the same call — see `freshReporter()` in that file.

## Repository guardrails and CI

Full rationale in [ADR 0008](./adr/0008-repository-guardrails-and-ci.md).

| File                                 | Does                                                                                                |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `lefthook.yml`                       | pre-commit (eslint/prettier/gitleaks/related tests), commit-msg (commitlint), pre-push (`validate`) |
| `commitlint.config.js`               | Conventional Commits, via `@commitlint/config-conventional`                                         |
| `.gitleaks.toml`                     | extends gitleaks' defaults; allowlists `.env.example` and test fixtures only                        |
| `.github/workflows/ci.yml`           | mirrors `validate` step-by-step, plus audit/OSV-Scanner/gitleaks/SBOM                               |
| `renovate.json`                      | weekly schedule; Expo SDK grouped and never auto-merged                                             |
| `scripts/setup-branch-protection.sh` | `gh api` calls for `main`'s protection rules — written, not run                                     |

### Traps found while building this — do not "fix" these blindly

- **The `gitleaks` package on npm is not the real tool.** It's an unrelated
  wrapper by a different author (v1.0.0). Real gitleaks is a Go binary,
  downloaded from `github.com/gitleaks/gitleaks/releases` — both locally
  (per-developer install, see `docs/SETUP_CHECKLIST.md`) and in CI (pinned
  version, checksum-verified download). Never `npm install gitleaks`.
- **`gitleaks detect`/`protect` are deprecated (v8.19+)** in favor of `git`/
  `dir`/`stdin` subcommands. Still functional, but `lefthook.yml` and
  `ci.yml` both use the current names (`gitleaks git ...`) since this is new
  configuration, not a migration.
- **gitleaks' own default allowlist suppresses obviously-fake secrets** —
  an alphabet-sequence stopword filter, among others. A test value like
  `AKIAIOSFODNN7EXAMPLE` or `ghp_...abcdefghijklmnopqrstuvwxyz` will match a
  rule and then get silently allowlisted by gitleaks itself, not by
  `.gitleaks.toml`. Use a value that doesn't contain a recognizable
  alphabet run when hand-testing detection.
- **`actions/checkout`, `actions/setup-node`, `actions/cache`, and
  `actions/upload-artifact` have all moved well past v4.** Resolve each
  action's actual current release and its SHA before pinning — a
  memory-based "v4 is probably still current" guess would have pinned a
  stale major version.
- **`gitleaks/gitleaks-action` needs a paid license for organization
  repositories.** CI downloads and runs the binary directly instead.
- **`config:base` was renamed to `config:recommended`** as Renovate's
  current base preset. Verify against Renovate's own docs before writing a
  config from memory.
- **knip already understands `lefthook.yml` and `commitlint.config.js`
  natively.** Adding `lefthook`/`@commitlint/*` to `knip.json`'s
  `ignoreDependencies` produces a "remove from ignoreDependencies"
  configuration hint rather than silence — only `@cyclonedx/cyclonedx-npm`
  (invoked from `ci.yml`, which knip doesn't parse) actually needs the
  ignore entry.

## EAS build, submit, and update pipeline

Full rationale in
[ADR 0009](./adr/0009-eas-build-submit-and-update-pipeline.md).

| File                                  | Does                                                                                                |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `eas.json`                            | development/preview/production build profiles; `environment`, never `env`, for anything per-profile |
| `.eas/workflows/build-preview.yml`    | lint/test → iOS preview build → (optional) Maestro → PR comment                                     |
| `.eas/workflows/build-production.yml` | lint/test → iOS production build → App Store submit → production channel update                     |
| `.eas/workflows/hotfix.yml`           | manual-only; publishes an OTA update straight to `production` from a named branch                   |
| `scripts/release.mjs`                 | hand-rolled semver bump from Conventional Commits; dry-run by default, `--apply` to tag and push    |
| `docs/release/runbook.md`             | normal release, hotfix OTA, and rollback procedures                                                 |

`app.config.ts`'s `runtimeVersion: { policy: "fingerprint" }` ties every OTA
update to the exact native surface it was built against — an update whose
fingerprint doesn't match the running binary is refused by `expo-updates`
itself. `updates.url` and `extra.eas.projectId` are placeholders until
`eas init` runs (`docs/SETUP_CHECKLIST.md`).

### Traps found while building this — do not "fix" these blindly

- **`eas.json`'s `env` field is for values you'd commit to git, not for
  anything that should differ per profile without also being visible in
  the repo.** `EXPO_PUBLIC_ATTESTATION_ENABLED`, the API URL, and the
  Sentry DSN all go through EAS-hosted environment variables instead,
  referenced per profile via `"environment"` — never `env`.
- **A pre-packaged EAS Workflows job type (`type: update`, `type: build`)
  always runs against "the job's recorded commit"** — the ref that
  triggered the workflow — and has no field to override which branch it
  checks out. `hotfix.yml`'s publish step is a custom `steps:` job with an
  explicit `eas/checkout` (`ref: ${{ inputs.branch }}`) followed by a raw
  `eas update` command, specifically because `type: update` would have
  ignored the branch named in the workflow's own `inputs.branch`.
- **`type: maestro` is EAS Workflows' own built-in job** — confirmed
  against Expo's actual current example workflow files, not a paraphrase.
  No separate paid Maestro Cloud subscription is needed, despite an
  earlier, less precise source suggesting a `maestro-cloud` type that
  would have needed one.
- **A flow-sequence value containing `${{ ... }}` needs quoting in YAML**
  (`["${{ needs.build.outputs.build_id }}"]`, not
  `[${{ needs.build.outputs.build_id }}]`) — the unquoted form parses as a
  nested flow mapping and fails. Caught by actually parsing every workflow
  file with a real YAML parser rather than trusting hand-written syntax.
- **A double-quoted string containing both a colon and a `${{ }}`
  expression inside a `run:` value is a YAML trap** (e.g.
  `run: eas update --message "hotfix: ${{ inputs.branch }}"`) — some
  parsers read the colon as starting a nested mapping. A block scalar
  (`run: >-`) sidesteps it entirely.
- **`@expo/fingerprint` does not need installing separately.** It's
  already a transitive dependency of `expo` itself (`npm ls
@expo/fingerprint` confirms this) — the fingerprint runtime policy just
  needs `expo-updates` installed and `runtimeVersion` configured.
- **`eas.json`'s `autoIncrement` is boolean-only on `eas-cli@24.7.0`**,
  not `"version" | "buildNumber" | boolean` as some documentation
  describes — `npx eas-cli config --platform ios` (no login required to
  reach schema validation) rejected `autoIncrement: "buildNumber"` with
  `must be a boolean`. Use `true`/`false`; verify against `eas config`'s
  own schema error, not a doc's prose description, if this ever needs
  changing again.
- **`eas-cli` does not belong in `package.json` at all.**
  `expo-doctor` explicitly rejects installing it as a project dependency —
  "install it globally or use npx" — and every command in this repo
  (`docs/SETUP_CHECKLIST.md`, the release skill, the workflow files) uses
  `npx eas-cli`/`npx expo-updates` accordingly. Installing it even
  temporarily reopened `npm audit` to non-zero (13 vulnerabilities, all in
  its own transitive devDependencies) and broke `expo config` entirely for
  one install cycle — its dependency tree happened to hoist a root-level
  `@expo/config-plugins` that `@sentry/react-native`'s Expo plugin needs
  but doesn't declare, so removing `eas-cli` again briefly took that
  accidental copy with it until a further `npm install` re-resolved
  `expo`'s own copy to the root correctly. `npm audit` overrides
  (`ajv`, `diff`, `joi`, `minimatch`, `nanoid`, `tar`, `ts-deepmerge`,
  `uuid`, `yaml`) were tried and worked, but were unnecessary once
  `eas-cli` came back out of `package.json` — removed again rather than
  left in place for a problem that no longer exists.
- **Installing `eas-cli` (even temporarily) moved `query-string` from a
  nested copy under `expo-router` to the top level**, and this part
  persisted after removing `eas-cli` again — npm's deduplication had
  already settled on a single shared copy.
  `patches/expo-router++query-string+7.1.3.patch` (path-scoped to the old
  nested location) silently stopped applying — `patch-package`'s
  postinstall reported the failure, it did not fail the install.
  Re-generated as `patches/query-string+7.1.3.patch` (no `expo-router++`
  prefix, since it now targets the top-level package). If `query-string`
  ever moves back to being nested under `expo-router` (a future dependency
  change could do this in either direction), the patch
  will need regenerating again — check `patch-package`'s postinstall
  output after any dependency change, not just this one.

## Final audit

Full rationale in [ADR 0010](./adr/0010-final-audit.md). The last prompt of
the setup series audited every prior one; the two findings that changed
shipped behavior:

- **`app.config.ts`'s privacy manifest was missing `freerasp-react-native`'s
  own declarations.** Re-running
  `find node_modules -name PrivacyInfo.xcprivacy` (which the file's own
  comment says to do after adding a native module — missed when freeRASP
  landed in prompt 6) found a bundled `PrivacyInfo.xcprivacy` in its
  `TalsecRuntime.xcframework` declaring a `UserDefaults` reason code the
  app's manifest didn't have, and an `NSPrivacyCollectedDataTypes` array
  (`DeviceID`, diagnostics) where the app's was empty. Fixed; see
  [docs/privacy/data-inventory.md](./privacy/data-inventory.md) for the
  full picture, including the `watcherMail` off-device flow that had no
  documentation anywhere before this audit.
- **`src/core/api/client.ts`'s fail-closed failure paths were untested.**
  `sessionFailureToApiError`'s `unavailable` case and
  `assertionFailureToApiError`'s `disabled`/`unsupported`/
  `needs-attestation` cases — the paths that refuse a request when
  attestation cannot run at all — had no test exercising them; branch
  coverage was 72.3%. Fixed with explicit tests per branch, now at 89%.

### Traps found while building this — do not "fix" these blindly

- **`src/core/api` is not in `jest.config.js`'s `STRICT_COVERAGE_PATHS`.**
  Only `src/utils` and `src/core/security` hold the 95% floor; `src/core/api`
  sits under the 80% global bar despite CLAUDE.md naming it alongside
  `src/core/security` as a plan-mode-gated, "leaves the device" path. This
  is why the `client.ts` gap above existed without failing the coverage
  gate — the low-coverage file was averaged against near-100% files
  elsewhere. Not changed in this audit (a coverage-policy widening is its
  own decision); a real candidate for the next time this file is touched.
- **The setup checklist's every item stays unchecked, on purpose.** The
  code and config each item depends on being ready is not the same thing
  as the account action itself having happened. Do not mark an item done
  because the repo-side work for it is finished.

## Architecture

Feature-sliced, with the dependency direction enforced in ESLint. Full rationale
in [ADR 0001](./adr/0001-feature-sliced-architecture.md); each folder under `src/`
has a README stating what belongs there and what must never go there.

```
app -> features -> ui, core, hooks, utils, theme, types
core -> utils, theme, types
ui / hooks -> utils, theme, types
utils -> types
```

- A slice is reachable only through its `index.ts`.
- Side-effect SDKs (secure storage, app integrity, networking, crash reporting,
  analytics) may be imported only inside `src/core`.
- `src/utils` is pure: no React, no I/O.
- `src/app` is the only place default exports are allowed (Expo Router needs them).

### Two lint-config traps — read before touching eslint.config.js

- **`boundaries/elements` must use folder patterns** (`"src/ui"`), never
  file-path patterns (`"src/ui/**/*"`). The pattern is matched against the
  _containing folder_, so a file-path pattern needs an extra segment, matches
  nothing, and every file falls through as an unrecognised element. The rule then
  reports **zero errors while enforcing nothing**. This actually happened while
  building the skeleton and was caught only by committing deliberate violations.
  `mode: "full"` also works but is deprecated in v7, and `partialMatch: false` is
  **not** its replacement despite what the deprecation notice says —
  `Settings.js` treats `partialMatch: false` as effective _folder_ mode.
- **`eslint-import-resolver-typescript` must stay a root devDependency.** Expo's
  flat config registers only the `node` resolver, while eslint-plugin-import's
  TypeScript config asks for a `typescript` resolver that ships nested inside
  `eslint-config-expo` and is not resolvable from the project root. Without the
  root copy every `@/*` import is unresolved, which silently disables
  `boundaries/dependencies` as well. Pinned to 3.10.1 to match Expo's nested copy
  (interface version 2; 4.x switched to the new resolver API).

After changing any boundary rule, re-prove it with a deliberately illegal import
rather than trusting a clean lint run.

### Test harness constraints — see [ADR 0002](./adr/0002-testing-strategy.md)

- **`@testing-library/react-native` stays on 13.3.0.** RNTL 14 made `render`
  async; expo-router's `renderRouter` calls it synchronously and `Object.assign`s
  onto the result, so under 14 every assertion fails with "`render` function has
  not been called". expo-router devDepends on `^13.3.0`.
- **`react-test-renderer` is pinned to 19.2.3**, matching `react@19.2.3` exactly.
  19.2.8 requires `react@^19.2.8` and fails install.
- **`babel.config.js` exists for Jest, not Metro.** Without it, React Native's
  jest setup file fails to parse — it still ships Flow annotations.
  `babel-preset-expo` and `babel-jest` are direct devDependencies because the
  config names them.
- **MSW is imported from `msw/native`.** msw's exports set
  `"./node": { "react-native": null }`, and jest-expo resolves with the
  react-native condition, so `msw/node` is unreachable here.
- **`jest.config.js` widens jest-expo's transform to `.mjs`/`.cjs`** and appends
  to its `transformIgnorePatterns` allowlist. Do not replace either — clobbering
  the allowlist stops React Native itself being transformed.
- **`tsconfig.json` sets `types: ["jest"]`.** Without it TypeScript does not pick
  up `@types/jest`, and every test file fails with `Cannot find name 'describe'`
  plus a wall of `no-unsafe-call` from the type-aware lint rules.
- **Per-path coverage thresholds are computed at config load** and attach only to
  folders that contain a source file, because Jest fails a threshold whose path
  has no coverage data. `./src/utils/` is live now; `./src/core/security/`
  activates by itself on its first file.
- **`renderRouter` calls `jest.useFakeTimers()` itself**, so route tests run on
  fake timers whether they asked or not. `tests/setup/jest.setup.ts` restores real timers
  after every test.

### Knip ignores

`src/features/_template/**` is a scaffold and unreferenced by design.
`src/features/home/store.ts` and `types.ts` are placeholder seams kept so `home`
mirrors `_template`; delete the ignores when the slice puts them to work.

`expo-mcp` is ignored because nothing imports it: the Expo CLI resolves the
installed package when the dev server runs with `EXPO_UNSTABLE_MCP_SERVER=1`
(`npm run dev:mcp`). It is a real dependency with no import site.

## Layout

- `src/app/` — expo-router routes only (screens and layouts).
- `src/` — all other application code.
- `docs/` — project documentation, including `SETUP_CHECKLIST.md`.
