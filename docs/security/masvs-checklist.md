# MASVS checklist — SundayBest

**Last reviewed:** 2026-09-17 (prompt 7 — security foundation, part 1)

All 24 controls of **OWASP MASVS v2**, each with a status and where in this
repository it is enforced. Control statements are quoted verbatim from
<https://github.com/OWASP/masvs>; verify against
<https://mas.owasp.org/MASVS/> rather than this file when it matters.

This is the list `security-reviewer` works through. Read it with
[threat-model.md](./threat-model.md), which explains _why_ the `n/a` entries are
`n/a` rather than unfinished.

**Status means:**

- **done** — implemented and tested for everything the app currently does. It
  can stop being true when the app grows, hence the review triggers at the end.
- **planned** — a real gap, with the work named.
- **n/a** — does not apply to this product, with the reason. Never used to mean
  "not done yet".

## MASVS-STORAGE — Storage

| Control   | Statement                                     | Status      | Where                                                                                                                                                                                                                                                                                                                                                                                               |
| --------- | --------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| STORAGE-1 | "The app securely stores sensitive data."     | **done**    | `src/core/security/secure-storage/expo-secure-storage.ts` pins `WHEN_UNLOCKED_THIS_DEVICE_ONLY` in one constant applied to every call — no iCloud sync, no backups, unreadable while locked. The database is SQLCipher-encrypted (`app.config.ts` → `useSQLCipher: true`) with a key from `src/core/security/database-key`. `no-restricted-imports` confines every storage SDK to `src/core`.       |
| STORAGE-2 | "The app prevents leakage of sensitive data." | **planned** | In place: `no-console` outside `src/core/monitoring`; `@/utils/redaction/redactSensitive`; every error message in `src/core/security` carries field names and never values, with tests that plant a credential-shaped string and assert its absence. Missing: screenshot/app-snapshot protection and pasteboard policy (see PLATFORM-3), and an explicit backup-exclusion review once tables exist. |

## MASVS-CRYPTO — Cryptography

| Control  | Statement                                                                                       | Status   | Where                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRYPTO-1 | "The app employs current strong cryptography and uses it according to industry best practices." | **done** | No cryptography is implemented in this codebase — that is the control being satisfied, not a gap. AES-256 comes from SQLCipher and P-256 from the Secure Enclave via App Attest. `.claude/rules/security.md` requires an ADR before any crypto primitive is chosen.                                                                                                                                                                      |
| CRYPTO-2 | "The app performs key management according to industry best practices."                         | **done** | `src/core/security/database-key/database-key.ts`: 32 bytes from `expo-crypto`'s CSPRNG, generated on the device on first launch, never derived from a device identifier or constant, stored only in the keychain, never logged. It refuses a short read or an all-zero buffer rather than producing a guessable key. The App Attest private key is generated in and never leaves the Secure Enclave — the app only ever holds a `keyId`. |

## MASVS-AUTH — Authentication and Authorization

The app has **no accounts and no sign-in**, so this category is almost entirely
not applicable. The install-level equivalent — proving a request came from the
real app — is App Attest, tracked under RESILIENCE.

| Control | Statement                                                                                                 | Status  | Where                                                                                                                                                                                                                   |
| ------- | --------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUTH-1  | "The app uses secure authentication and authorization protocols and follows the relevant best practices." | **n/a** | There is no user identity to authenticate and no authorization model. Revisit the whole category if accounts are ever added. The session tokens in `src/core/security/session` authenticate an _install_, not a person. |
| AUTH-2  | "The app performs local authentication securely according to the platform best practices."                | **n/a** | No biometric or passcode gate. `requireAuthentication` is deliberately unused and `faceIDPermission` is `false` in `app.config.ts`, so the app does not claim a Face ID capability it has no use for.                   |
| AUTH-3  | "The app secures sensitive operations with additional authentication."                                    | **n/a** | No operation is sensitive in that sense — no payments, no account changes, no data sharing.                                                                                                                             |

## MASVS-NETWORK — Network Communication

| Control   | Statement                                                                                   | Status      | Where                                                                                                                                                                                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NETWORK-1 | "The app secures all network traffic according to the current best practices."              | **done**    | https is enforced by the **config schema**, not by convention: `src/core/config/env-schema.ts` refines `EXPO_PUBLIC_API_URL` to reject `http` in every variant except development, so a preview or production build cannot be pointed at plaintext. No ATS exemptions in `app.config.ts`.              |
| NETWORK-2 | "The app performs identity pinning for all remote endpoints under the developer's control." | **planned** | Not implemented. Deliberate deferral, not an oversight — pinning is bypassable by the device owner, who is the party in the threat model most able to intercept traffic, and it brings a bricking risk on certificate rotation. Reason recorded in [threat-model.md](./threat-model.md) (boundary B5). |

## MASVS-PLATFORM — Platform Interaction

| Control    | Statement                                   | Status      | Where                                                                                                                                                                                                                                                                                                                                                                             |
| ---------- | ------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PLATFORM-1 | "The app uses IPC mechanisms securely."     | **planned** | Deep links (`sundaybest://` and universal links) are the only IPC. In place: the Zod-at-the-boundary rule in `AGENTS.md`, and the `decode-uri-component@0.5.0` pin plus patch that closed a real ReDoS in expo-router's link parsing. Missing: there are no parameterised routes yet, so per-route parsing lands with the routes. `associatedDomains` is currently a placeholder. |
| PLATFORM-2 | "The app uses WebViews securely."           | **n/a**     | There is no WebView. `react-native-webview` is not a dependency, and adding one would need an ADR.                                                                                                                                                                                                                                                                                |
| PLATFORM-3 | "The app uses the user interface securely." | **planned** | Nothing sensitive is on screen yet — the app renders one label. Needed before it is: app-snapshot protection on backgrounding, a pasteboard policy, and `secureTextEntry` / keyboard-cache review for any field that takes sensitive input.                                                                                                                                       |

## MASVS-CODE — Code Quality

| Control | Statement                                                              | Status      | Where                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------- | ---------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CODE-1  | "The app requires an up-to-date platform version."                     | **planned** | `app.config.ts` sets no explicit `ios.deploymentTarget`, so the app inherits Expo SDK 57's default. Should be pinned deliberately rather than inherited, especially since App Attest needs iOS 14+.                                                                                                                                                                                                                                                                                                                  |
| CODE-2  | "The app has a mechanism for enforcing app updates."                   | **planned** | No forced-update path and no EAS Update. Belongs with the release work (prompt 11). Until then a vulnerable build cannot be retired except by an App Store release users choose to install.                                                                                                                                                                                                                                                                                                                          |
| CODE-3  | "The app only uses software components without known vulnerabilities." | **done**    | `npm audit` is at zero and stays there: three `overrides` pins and one `patch-package` patch, each with its reason in [PROJECT.md](../PROJECT.md). `npm run knip:check` removes unused dependencies so the surface stays small. Not yet enforced in CI — that is prompt 10's job, and the gap is worth knowing about.                                                                                                                                                                                                |
| CODE-4  | "The app validates and sanitizes all untrusted inputs."                | **done**    | Zod at every boundary that exists: `src/core/config/env-schema.ts` (environment), `src/core/api/contracts/attestation.ts` (server responses), `secure-storage` (keychain reads, which are attacker-editable on a device its owner controls), and `migrations.ts` (`user_version`, read from a file). The database key is format-checked before it is interpolated into `PRAGMA key`, because SQLCipher has no parameterised form for it. `as` on untrusted data is a review failure per `.claude/rules/security.md`. |

## MASVS-RESILIENCE — Resilience Against Reverse Engineering and Tampering

| Control      | Statement                                              | Status      | Where                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------ | ------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RESILIENCE-1 | "The app validates the integrity of the platform."     | **planned** | The App Attest client half is done (`src/core/security/attestation`): Apple signs a statement that the app is genuine and unmodified on real hardware. Two halves are missing — jailbreak and tamper detection (`src/core/security/integrity`, empty, part 2), and the **server-side verification** without which attestation is decorative. Server work is in [SETUP_CHECKLIST.md](../SETUP_CHECKLIST.md). |
| RESILIENCE-2 | "The app implements anti-tampering mechanisms."        | **planned** | App Attest is the mechanism, and `session.clear()` exists as the response to a detected tamper. Same gap as RESILIENCE-1: the server must actually verify assertions, enforce the monotonic counter, and rate-limit per key.                                                                                                                                                                                |
| RESILIENCE-3 | "The app implements anti-static analysis mechanisms."  | **n/a**     | Deliberate. JavaScript ships to the device, so obfuscation delays rather than prevents, and there is **no secret in the bundle for it to protect** — `EXPO_PUBLIC_*` values are public by construction and every real secret lives server-side. Accepting this is proportionate for an app with no accounts, no payments, and no personal data.                                                             |
| RESILIENCE-4 | "The app implements anti-dynamic analysis techniques." | **n/a**     | Deliberate, same reasoning. Anti-debugging on a device the attacker owns is a speed bump; the defence is server-side verification of every assertion.                                                                                                                                                                                                                                                       |

## MASVS-PRIVACY — Privacy

| Control   | Statement                                                   | Status      | Where                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------- | ----------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PRIVACY-1 | "The app minimizes access to sensitive data and resources." | **done**    | The app requests **no permissions at all** — no camera, location, contacts, notifications, or Face ID. `ios.privacyManifests` in `app.config.ts` declares only the required-reason APIs its dependencies actually use, each sourced from a `PrivacyInfo.xcprivacy` in `node_modules` and commented with which package needs it. Lint confines every side-effect SDK to `src/core`, so the reachable surface is one auditable folder. |
| PRIVACY-2 | "The app prevents identification of the user."              | **done**    | No accounts, no IDFA, no analytics, no third-party telemetry; `NSPrivacyTracking` is `false` and `NSPrivacyTrackingDomains` is empty. The only identifier is the App Attest `keyId`, which is per-install and genuinely reset by a reinstall. Open question, recorded in [the API contract](../api/attestation.md): whether `keyId` becomes a retention subject once it is logged server-side.                                       |
| PRIVACY-3 | "The app is transparent about data collection and usage."   | **planned** | [data-inventory.md](../privacy/data-inventory.md) is current and says the app collects nothing. Missing: the App Store privacy questionnaire, and in-app disclosure — including telling the user plainly that there is **no account and therefore no recovery**, so losing the device loses the data (abuse case U7).                                                                                                                |
| PRIVACY-4 | "The app offers user control over their data."              | **planned** | Nothing is stored yet, so there is nothing to export or delete. Needed with the first tables: a delete that actually removes rather than hides, and a decision on whether export is offered at all.                                                                                                                                                                                                                                  |

## Summary

| Status  | Count |
| ------- | ----- |
| done    | 8     |
| planned | 10    |
| n/a     | 6     |

The `planned` entries cluster in three places, which is the honest read of where
this app stands: **the server does not exist yet** (RESILIENCE-1/2, AUTH by
implication), **there is no product surface yet** (PLATFORM-3, PRIVACY-3/4,
STORAGE-2), and **release plumbing is later prompts** (CODE-1/2, and CODE-3's CI
gate).

## Review triggers

- Before any TestFlight or App Store submission.
- When the backend lands — RESILIENCE-1 and RESILIENCE-2 cannot go `done`
  without it.
- When the first table is created (STORAGE-2, PRIVACY-4).
- When any permission, entitlement, or native module is added (PRIVACY-1).
- If accounts are ever added — the whole AUTH category stops being `n/a`.
