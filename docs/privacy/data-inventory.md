# Data inventory

What SundayBest collects, stores, and sends — and what it does not. Kept current
because the App Store privacy questionnaire, the privacy manifest in
`app.config.ts`, and the MASVS checklist all have to agree with it.

**Last reviewed:** 2026-09-20 (prompt 13 — final audit)

## Summary

**The app collects no personal data.** There are no accounts, no sign-in, no
analytics, no ads, and no tracking. Nothing about the user or the device leaves
the device today, because nothing in the app makes a network request yet.

This is a product constraint, not a current-state accident — see
[docs/PROJECT.md](../PROJECT.md).

Crash reporting (below) sends diagnostic data off the device once
`EXPO_PUBLIC_SENTRY_DSN` is configured — not yet, since the checklist item that
provisions it is outstanding — but it is scoped and code-reviewed as if it were
live from today, which is the point of writing this section now rather than
after the fact.

## Collected data

**The app itself collects nothing.** The one exception is a linked
third-party SDK's own declared capability, not something app code reads or
sends:

| Data                                  | Purpose                                            | Stored where    | Leaves device                                       | Linked to identity |
| ------------------------------------- | -------------------------------------------------- | --------------- | --------------------------------------------------- | ------------------ |
| Device ID, diagnostic data (freeRASP) | App integrity / tamper detection (not mounted yet) | Not by app code | Only if freeRASP emails a threat report — see below | No                 |

`NSPrivacyCollectedDataTypes` in `app.config.ts` is the machine-readable form
of this: `DeviceID`, `OtherDiagnosticData`, and `OtherDataTypes`, all
`NSPrivacyCollectedDataTypeLinked: false` and `...Tracking: false`, copied
verbatim from `freerasp-react-native`'s bundled `TalsecRuntime.xcframework`
manifest (found via `find node_modules -name PrivacyInfo.xcprivacy`, prompt
13's audit — missed when that dependency first landed). freeRASP is a real,
linked native dependency but **is not mounted at any screen yet** (see
`docs/SETUP_CHECKLIST.md`, "Runtime integrity (freeRASP)") — Apple's manifest
requirement is about what's linked into the binary, not what's actively
exercised, so the declaration has to be here regardless. Diagnostic/crash
data from Sentry does not get its own row here: Apple's privacy-label
category for that is **Diagnostics**, tracked separately in
`docs/SETUP_CHECKLIST.md` rather than as a "collected data type" entry — see
"Diagnostics and crash reporting" below.

## Tracking

None. `NSPrivacyTracking` is `false` and `NSPrivacyTrackingDomains` is empty.

The app has no IDFA access, no `expo-tracking-transparency`, and no third-party
analytics or attribution SDK. ESLint blocks importing one outside `src/core`, and
adding one at all requires an ADR.

## Data stored on the device

| Store               | Contents today                                   | Notes                                                                     |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| `UserDefaults`      | React Native and `expo-constants` internals only | Not written by app code. Declared in the privacy manifest as `CA92.1`.    |
| App container files | React Native / Expo runtime files                | Declared as `FileTimestamp` and `DiskSpace` usage.                        |
| Keychain            | _nothing yet_                                    | `src/core/security/secure-storage` is the only place allowed to write it. |

Nothing sensitive is stored anywhere, so nothing is currently at rest that would
need encrypting. Prompt 7 adds an encrypted local database (SQLCipher); this
table must be updated when it lands, along with the export-compliance answer.

## Data sent off the device

| Endpoint                                     | Trigger                                                                                  | Contents                                                                                                     | Why                                                         |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Sentry ingest (via the DSN)                  | An unhandled render error, or an explicit `logger.error(...)` call                       | Redacted stack trace, error message, breadcrumbs, release/dist tag — see "Diagnostics" below                 | Crash visibility during setup and early builds              |
| Talsec (freeRASP), directly to `watcherMail` | A detected threat signal — but freeRASP isn't mounted anywhere yet, so never fires today | Whatever Talsec's native SDK includes in its own threat report; not something app code constructs or redacts | App-integrity monitoring, once mounted (see PLATFORM-3 gap) |

`watcherMail` (`src/core/security/integrity/freerasp-integrity.ts`) is an
email address Talsec's native SDK sends a threat report to directly — not a
request this app's own client code makes, and not something
`redactSensitive` ever sees, since it never passes through app code. Worth
naming explicitly: it is a real off-device flow, distinct from anything
Sentry does, and it exists whether or not `useIntegrityMonitor` is ever
mounted at a screen (mounting only decides whether it can ever fire — the
capability ships in the binary either way, which is why it's in the privacy
manifest above regardless).

`EXPO_PUBLIC_API_URL` is configured but no other code calls it yet. When the
first product request lands, this section gets a second row: the endpoint, what
is in the request, what comes back, and why each field is needed.

## Diagnostics and crash reporting

**Off by default, everywhere.** `EXPO_PUBLIC_SENTRY_DSN` is empty in
`.env.example`, and `createSentryReporter` (`src/core/monitoring/crash-reporter.ts`)
never calls `Sentry.init` while it is unset — not gated by build variant, gated
by DSN presence, so a build with no DSN sends nothing regardless of variant.
Provisioning the real DSN is an outstanding checklist item
(`docs/SETUP_CHECKLIST.md`), so reporting has never actually been live.

What ships once it is:

- **Crash reports, stack traces, and breadcrumbs only.** No user identity, no
  account (there is none), no IDFA, no stable device identifier of any kind.
  Nothing in `crash-reporter.ts` calls `Sentry.setUser` or reads a device-ID
  API — enforced by omission, called out in a comment there so it does not get
  quietly added back.
- **`sendDefaultPii: false`**, explicit in the `Sentry.init` call rather than
  relying on the SDK default.
- **Every event and breadcrumb is scrubbed before it leaves the device.** The
  `beforeSend`/`beforeBreadcrumb` hooks run every string field (message,
  exception value, breadcrumb message/data, `extra`) through
  `@/utils/redaction/redactSensitive`, and strip `user`/`request` from the
  event outright rather than trusting a redaction rule to catch every shape
  Sentry's own instrumentation might attach there.
- **`release`/`dist` are the app version and the EAS Update id** (falling back
  to `"local"` — this app has no `expo-updates` dependency yet, so that is the
  value today), not a device or install identifier.
- `src/core/monitoring/logger.ts` never writes to the console in production
  (enforced twice: at runtime, and again by `metro.config.js`'s
  `drop_console` minifier config stripping every `console.*` call from a
  release bundle), and every message/context it handles is redacted the same
  way before an `error`-level call reaches the reporter.
- The Sentry auth token needed to upload source maps from EAS Build/Update is
  a secret and is never in this repo — see `docs/SETUP_CHECKLIST.md`.

Apple's App Store privacy label for this is **Diagnostics → Crash Data**: not
linked to the user, not used for tracking. Answering the actual questionnaire
is a checklist item (`docs/SETUP_CHECKLIST.md`), done once, before the first
submission.

## Third-party SDKs with data access

| SDK                              | Data it can reach                                                                | In use                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `expo-router`, `expo-linking`    | Deep-link URLs, including any parameters                                         | Yes — parse them with Zod, never trust them                                   |
| `expo-constants`                 | App config, `UserDefaults`                                                       | Yes                                                                           |
| `expo-file-system` (via `expo`)  | App container files, disk space                                                  | Transitively                                                                  |
| `expo-splash-screen`             | None                                                                             | Yes                                                                           |
| `@sentry/react-native`           | Whatever the app explicitly forwards — see "Diagnostics" above                   | Yes, gated on `EXPO_PUBLIC_SENTRY_DSN` being non-empty                        |
| `freerasp-react-native` (Talsec) | Device ID and diagnostic/integrity signals, per its own bundled privacy manifest | Linked, not yet mounted at any screen — see PLATFORM-3 in the MASVS checklist |

No SDK in this list transmits anything the app has not explicitly redacted and
handed to it first, except `freerasp-react-native`, whose native code can
email a threat report directly to `watcherMail` without passing through app
code at all — see "Data sent off the device" above.

## When to update this file

- Adding any SDK that reads user or device data, or that makes a request.
- Adding a network call, a stored value, or a log line about the user.
- Before answering the App Store privacy questionnaire.
- Any change to `ios.privacyManifests`.

A change to what the app collects needs an ADR as well as a row here.
