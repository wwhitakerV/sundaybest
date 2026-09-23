# 4. Configuration and environments

Date: 2026-09-16

## Status

Accepted

## Context

Until now the app's identity lived in a static `app.json` with a single bundle
identifier, and nothing read `process.env` at all. That left four gaps:

1. **One identity.** A development build and a real build would claim the same
   bundle ID, so they could not coexist on a device and a tester could not tell
   which one they were looking at.
2. **No privacy manifest.** Apple requires apps that call required-reason APIs
   to declare why. React Native and several Expo modules call them, and Apple
   does not reliably parse the `PrivacyInfo.xcprivacy` files bundled inside
   static CocoaPods dependencies — the app has to declare them itself.
3. **No export-compliance answer**, so App Store Connect would ask on every
   upload and someone would answer it from memory under time pressure.
4. **Unvalidated configuration.** A missing or malformed environment variable
   would reach the app as `undefined` and surface far from its cause — a
   half-configured API URL, or attestation silently off in a shipped build.

## Decision

### Typed `app.config.ts`, three variants keyed on `APP_VARIANT`

`app.json` is replaced by `app.config.ts`, typed as
`({ config }: ConfigContext) => ExpoConfig`. Plugins are declared through the
typed factories their own packages export (`expo-router/plugin`,
`expo-splash-screen/plugin`) rather than string/tuple literals, so a wrong prop
name is a type error.

| Variant       | Name                   | Bundle ID                               |
| ------------- | ---------------------- | --------------------------------------- |
| `development` | `SundayBest (Dev)`     | `com.walterwhitaker.sundaybest.dev`     |
| `preview`     | `SundayBest (Preview)` | `com.walterwhitaker.sundaybest.preview` |
| `production`  | `SundayBest`           | `com.walterwhitaker.sundaybest`         |

Each has its own placeholder icon. Development and preview carry a visible
`DEV` / `PRE` badge; production carries the plain `SB` wordmark and no badge,
because a badge-stamped icon is worse to ship by accident than a plain one. All
three are placeholders — replacing them is a checklist item.

**`APP_VARIANT` defaults to `development` when unset, and an unrecognised value
throws.** A default is unavoidable: `expo-doctor`, `expo export`, and
`expo config` all evaluate the config without setting it, and `npm run validate`
has to pass. `development` is the right default because its failure mode is loud
and unshippable, whereas defaulting to `production` would let a forgotten
variable quietly claim the real bundle ID.

`APP_VARIANT` is deliberately not `EXPO_PUBLIC_`. It decides the app's identity
at build time and is read under Node; `EXPO_PUBLIC_*` is for values the
JavaScript bundle reads at runtime. `npm start`, `npm run ios`, and
`npm run dev:mcp` all set `APP_VARIANT=development`, so local work never runs
under production identity by accident.

### Privacy manifest sourced from the dependencies, not from a list

`ios.privacyManifests` declares four required-reason categories. Every entry was
taken from a `PrivacyInfo.xcprivacy` file installed in this project's own
`node_modules`, with the declaring package named in a comment:

| Category                                     | Reasons                    | From                                                   |
| -------------------------------------------- | -------------------------- | ------------------------------------------------------ |
| `NSPrivacyAccessedAPICategoryFileTimestamp`  | `C617.1` `0A2A.1` `3B52.1` | react-native, RCT-Folly, boost, glog, expo-file-system |
| `NSPrivacyAccessedAPICategoryUserDefaults`   | `CA92.1`                   | react-native, expo-constants                           |
| `NSPrivacyAccessedAPICategorySystemBootTime` | `35F9.1`                   | react-native (`ReactCommon/react/timing`), boost       |
| `NSPrivacyAccessedAPICategoryDiskSpace`      | `E174.1` `85F4.1`          | expo-file-system                                       |

`NSPrivacyTracking` is `false` and `NSPrivacyTrackingDomains` and
`NSPrivacyCollectedDataTypes` are empty, which matches the product constraint of
no ads and no tracking. Re-run `find node_modules -name PrivacyInfo.xcprivacy`
after adding any native module.

### `usesNonExemptEncryption: false`, with a gate before submission

`ios.config.usesNonExemptEncryption` is `false`. That is accurate today: the app
implements no cryptography of its own and relies only on the platform's TLS,
which is exempt. Setting it stops App Store Connect asking on every upload.

Prompt 7 introduces SQLCipher. Encrypting data at rest with a third-party
library can change the answer, so `docs/SETUP_CHECKLIST.md` requires
re-confirming it against Apple's guidance before the first submission rather
than trusting the comment in the config.

Note that Expo strips `ios.config` from the public manifest, so
`expo config --type public` will not show this key. Use `--type prebuild`.

### Environment parsed with Zod at startup, in two files

- **`src/core/config/env-schema.ts`** — pure. Imports `zod` and nothing else,
  touches no `process.env`, uses no path aliases. Exposes `parseEnv`, which
  returns a frozen `Env` or throws `EnvConfigError`.
- **`src/core/config/env.ts`** — reads the four variables and calls `parseEnv` at
  module scope, so a misconfigured build fails at launch with the variables
  named.

The split exists so `scripts/check-env` can import the schema directly. A second
copy of a validation rule is a copy that drifts, and the drift is silent.

`src/core/providers/AppProviders.tsx` carries a side-effect
`import "@/core/config/env"`. That import is what makes "parses at startup" true:
without it the module is unreachable from the entry point, Metro leaves it out of
the bundle, and the startup check silently does not run. This was caught by
exporting a release bundle and finding neither the configured API URL nor the
error message in it.

Three decisions inside the schema are worth recording:

- **Every variable is read by literal dot notation.** Not style: Expo's Babel
  plugin only rewrites statically-written `process.env.EXPO_PUBLIC_*` member
  expressions. `process.env[name]` or destructuring compiles to a lookup on an
  object that does not exist in a release bundle and yields `undefined`.
- **https is required outside `development`.** `EXPO_PUBLIC_API_URL` is refined
  against the variant, so a preview or production build cannot be pointed at
  plaintext http. Development keeps http for a local server.
- **Failures report field names and a fixed expectation, never the value.** Zod's
  own messages are discarded. The message is what gets pasted into a terminal, a
  CI log, or a bug report, and an operator who put a real credential in the wrong
  variable must not leak it by running the app. A test plants a secret-shaped
  string and asserts it is absent from the thrown message.

**No schema defaults.** A missing variable is an error, not something to paper
over. Defaulting `EXPO_PUBLIC_APP_VARIANT` would mean a production build that
forgot it would report itself as `development` at runtime — turning verbose
logging on in a shipped app. The cost is that a fresh checkout must run
`cp .env.example .env`, which is a per-developer checklist item.

### `scripts/check-env`, in the validate gate

`npm run check:env` validates `.env.example` and every `.env*` file present
against `parseEnv`, and is part of `npm run validate`. Validating the example
proves the documented template still satisfies the schema. It prints file names
and failing variable names only.

It imports the `.ts` schema directly under Node's native type stripping, which
needs no transpiler dependency. Node 24 is the version `.nvmrc` pins.

### Feature flags behind an interface

`src/core/config/flags.ts` exposes `FlagSource` (`isEnabled`, `snapshot`) with a
static implementation, `createStaticFlagSource(env)`. Every flag is **derived
from `Env`**, never declared twice, and the module only carries flags that have a
real consumer:

| Flag             | Derived from                      |
| ---------------- | --------------------------------- |
| `attestation`    | `EXPO_PUBLIC_ATTESTATION_ENABLED` |
| `crashReporting` | whether a Sentry DSN is set       |
| `verboseLogging` | variant is not `production`       |

Taking `Env` as an argument rather than reading the singleton makes the rules
testable without reloading modules. A remote source can implement `FlagSource`
later; whatever it is, it stays in `src/core`, because it is a network
dependency.

## Consequences

**Good**

- Three variants coexist on a device, visibly distinct on the home screen.
- Identity, privacy posture, and export compliance are code, reviewed in a diff.
- A misconfigured environment fails at launch or in `validate`, not in
  production, and the failure names the variable without echoing its value.
- One schema serves the app, the tests, and the CI check.

**Costs and things to watch**

- **The variant list is duplicated** in `app.config.ts` and `env-schema.ts`.
  Importing the schema into the config was tried and reverted: it works under
  `expo config --type public` but breaks under `expo config --full`, which is the
  path `expo-doctor` takes, because that path evaluates the config as CommonJS
  with no TypeScript require hook. Two short lists a reviewer reads side by side
  beat an import that works under one command and not another.
- **`APP_VARIANT` and `EXPO_PUBLIC_APP_VARIANT` can disagree** — one sets the
  build's identity, the other what the running app believes. Nothing enforces
  the match yet. The EAS build profiles (a later prompt) should set both from one
  place.
- **`.env` is required for `npm start`**, by choice. See above.
- `tests/setup/jest.setup.ts` injects the development defaults, so tests have an environment
  the way a build does.
- **`expo export` does not catch a missing variable.** Bundling never executes
  the module, so a build with no `.env` exports cleanly and fails on launch
  instead. `npm run check:env` is the build-time guard; that is why it is in
  `validate`.

## Alternatives considered

- **Three static config files** (`app.development.json`, …). Rejected: no shared
  defaults, so the privacy manifest would be copied three times.
- **`expo-constants` `extra` for runtime config** instead of `EXPO_PUBLIC_*`.
  Rejected: it is the same public data with an extra indirection, and it is not
  available before the native module initialises.
- **Casting `process.env` to a typed object.** Rejected — that is the `as`-on-
  untrusted-data pattern the security rules forbid. The values come from outside
  the program.
- **`dotenv` as a dependency** for `check-env`. Rejected: a dozen lines of
  parsing avoids a runtime dependency, and Node's type stripping removes the need
  for a transpiler too.
