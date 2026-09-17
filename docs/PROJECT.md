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
- **This repo is in setup, not product build-out.** Prompts 1-13 establish
  tooling, architecture, testing, CI, and release plumbing. Do not import screen
  designs, invent features, or add product surface until the setup series is done.

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

`npm audit` must stay at zero. Three pins in `package.json` `overrides` keep it
there without moving off Expo SDK 57:

| Pin                                         | Why                                                                                                                                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `xcode > uuid@11.1.1`                       | uuid@7 missed a buffer bounds check in v3/v5/v6. Build-time only (`xcode` calls `uuid.v4()`); 11.1.1 still ships CJS.                                                                         |
| `query-string > decode-uri-component@0.5.0` | `<=0.4.2` decodes malformed percent-encoding in exponential time. It ships in the iOS bundle via expo-router's deep-link parsing, so a crafted `sundaybest://` link could hang the JS thread. |
| `react-dom@19.2.3`                          | Not a dependency (iOS only), but Expo declares it as an optional peer and npm will hoist a copy. Pinning stops it drifting ahead of `react@19.2.3`.                                           |

`decode-uri-component@0.5.0` is the only patched release and is ESM-only, so
`query-string@7.1.3`'s CJS `require` of it returns a module namespace instead of a
function. `patches/expo-router++query-string+7.1.3.patch` makes that one require
interop-aware; `patch-package` reapplies it on every install via `postinstall`.

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
  fake timers whether they asked or not. `test/setup.ts` restores real timers
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
