# Data inventory

What SundayBest collects, stores, and sends — and what it does not. Kept current
because the App Store privacy questionnaire, the privacy manifest in
`app.config.ts`, and the MASVS checklist all have to agree with it.

**Last reviewed:** 2026-09-19 (prompt 9 — logging and crash reporting)

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

| Data   | Purpose | Stored where | Leaves device | Linked to identity |
| ------ | ------- | ------------ | ------------- | ------------------ |
| _None_ | —       | —            | —             | —                  |

`NSPrivacyCollectedDataTypes` in `app.config.ts` is an empty array, which is the
machine-readable form of this table. Diagnostic/crash data does not get a row
here: Apple's privacy-label category for crash data is **Diagnostics**, tracked
separately in `docs/SETUP_CHECKLIST.md` rather than as a "collected data type"
entry, because it is not linked to identity and not used for tracking — see
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

| Endpoint                    | Trigger                                                            | Contents                                                                                     | Why                                            |
| --------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Sentry ingest (via the DSN) | An unhandled render error, or an explicit `logger.error(...)` call | Redacted stack trace, error message, breadcrumbs, release/dist tag — see "Diagnostics" below | Crash visibility during setup and early builds |

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

| SDK                             | Data it can reach                                              | In use                                                 |
| ------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| `expo-router`, `expo-linking`   | Deep-link URLs, including any parameters                       | Yes — parse them with Zod, never trust them            |
| `expo-constants`                | App config, `UserDefaults`                                     | Yes                                                    |
| `expo-file-system` (via `expo`) | App container files, disk space                                | Transitively                                           |
| `expo-splash-screen`            | None                                                           | Yes                                                    |
| `@sentry/react-native`          | Whatever the app explicitly forwards — see "Diagnostics" above | Yes, gated on `EXPO_PUBLIC_SENTRY_DSN` being non-empty |

No SDK in this list transmits anything the app has not explicitly redacted and
handed to it first.

## When to update this file

- Adding any SDK that reads user or device data, or that makes a request.
- Adding a network call, a stored value, or a log line about the user.
- Before answering the App Store privacy questionnaire.
- Any change to `ios.privacyManifests`.

A change to what the app collects needs an ADR as well as a row here.
