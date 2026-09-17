# Data inventory

What SundayBest collects, stores, and sends — and what it does not. Kept current
because the App Store privacy questionnaire, the privacy manifest in
`app.config.ts`, and the MASVS checklist all have to agree with it.

**Last reviewed:** 2026-09-16 (prompt 6 — configuration and environments)

## Summary

**The app collects no personal data.** There are no accounts, no sign-in, no
analytics, no ads, and no tracking. Nothing about the user or the device leaves
the device today, because nothing in the app makes a network request yet.

This is a product constraint, not a current-state accident — see
[docs/PROJECT.md](../PROJECT.md).

## Collected data

| Data   | Purpose | Stored where | Leaves device | Linked to identity |
| ------ | ------- | ------------ | ------------- | ------------------ |
| _None_ | —       | —            | —             | —                  |

`NSPrivacyCollectedDataTypes` in `app.config.ts` is an empty array, which is the
machine-readable form of this table.

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

None. `EXPO_PUBLIC_API_URL` is configured but no code calls it yet.

When the first request lands, this section records: the endpoint, what is in the
request, what comes back, and why each field is needed.

## Diagnostics and crash reporting

Not enabled. `EXPO_PUBLIC_SENTRY_DSN` is optional and empty by default, and the
`crashReporting` feature flag is off whenever it is unset.

**Prompt 9 adds diagnostics and must update this file** before or with that
change. A crash reporter that ships stack traces, breadcrumbs, and device
metadata is data leaving the device, and it needs a row above, a privacy-manifest
review, and the App Store questionnaire answered accordingly. The existing rules
already constrain it: logging goes through `src/core/monitoring` and is redacted
with `@/utils/redaction/redactSensitive` first, and nothing about the user or
device gets logged.

## Third-party SDKs with data access

| SDK                             | Data it can reach                        | In use                                      |
| ------------------------------- | ---------------------------------------- | ------------------------------------------- |
| `expo-router`, `expo-linking`   | Deep-link URLs, including any parameters | Yes — parse them with Zod, never trust them |
| `expo-constants`                | App config, `UserDefaults`               | Yes                                         |
| `expo-file-system` (via `expo`) | App container files, disk space          | Transitively                                |
| `expo-splash-screen`            | None                                     | Yes                                         |

No SDK in this list transmits anything.

## When to update this file

- Adding any SDK that reads user or device data, or that makes a request.
- Adding a network call, a stored value, or a log line about the user.
- Before answering the App Store privacy questionnaire.
- Any change to `ios.privacyManifests`.

A change to what the app collects needs an ADR as well as a row here.
