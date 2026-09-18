# Threat model — SundayBest

**Last reviewed:** 2026-09-17 (prompt 7 — security foundation, part 1)

What this app is actually defending, from whom, and what is deliberately left
undefended. Reviewed against [MASVS](./masvs-checklist.md); decisions live in
[ADR 0005](../adr/0005-app-attest-and-encrypted-storage.md).

## The shape of the problem

SundayBest has **no accounts and no sign-in**. That removes a whole class of
threats — no password database, no credential stuffing, no session fixation
against a user identity, no account takeover — and creates one specific problem
in their place:

> The backend has no user to authenticate, so it must decide whether to trust a
> request on the strength of the **client** alone.

An unauthenticated API is an open API. Anyone can read the endpoint out of the
bundle and call it from `curl`. App Attest is the answer: Apple's Secure Enclave
signs a statement that a request came from a genuine, unmodified build of _this_
app on real Apple hardware. It authenticates the **install**, not the person.

That distinction runs through everything below. App Attest tells the server
"this is the real app"; it never tells the server "this is a particular user",
and it cannot stop a determined attacker who owns the device.

## Assets

Ranked by what an attacker gains.

| #   | Asset                          | Where it lives                                    | Why it matters                                                                                               |
| --- | ------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| A1  | App Attest private key         | Secure Enclave, non-exportable                    | Signs assertions. Whoever can use it can mint requests the backend trusts.                                   |
| A2  | App Attest `keyId`             | Keychain (`attestation.keyId`)                    | Names the attested install. Not secret on its own, but it is the backend's rate-limit and reputation handle. |
| A3  | SQLCipher database key         | Keychain (`database.key`)                         | Decrypts everything stored locally.                                                                          |
| A4  | Session tokens                 | Access token in memory; refresh token in keychain | Short-lived authority to call the API.                                                                       |
| A5  | The user's local content       | Encrypted SQLite                                  | The reason the app exists. Currently empty — no tables yet.                                                  |
| A6  | The API endpoint and its shape | Compiled into the bundle, therefore public        | Not an asset to hide. Treated as known to the attacker.                                                      |

**Not assets:** there are no user credentials, no personal data
(see [data inventory](../privacy/data-inventory.md)), and no analytics identity.
`EXPO_PUBLIC_*` values are public by construction.

## Trust boundaries

```
  ┌─────────────────────── the device (attacker may own it) ────────────────────────┐
  │                                                                                 │
  │   Secure Enclave ──(B1)── app process ──(B2)── OS keychain                       │
  │                              │  │                                               │
  │                              │  └──(B3)── encrypted SQLite file                 │
  │                              │                                                  │
  │                    (B4) deep links, pasteboard, other apps                      │
  └──────────────────────────────│──────────────────────────────────────────────────┘
                                 │
                               (B5) TLS
                                 │
                        ┌────────▼────────┐
                        │     backend     │  (does not exist yet — see api contract)
                        └─────────────────┘
```

| ID  | Boundary                    | What crosses it                                                                 | Who can observe or interfere                                                                    |
| --- | --------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| B1  | Secure Enclave ↔ app        | `keyId` in, attestation and assertion blobs out. The private key never crosses. | A jailbroken device's owner can call the API as the app does, but still cannot extract the key. |
| B2  | App ↔ keychain              | `keyId`, database key, refresh token                                            | The OS. On a jailbroken device, the device owner.                                               |
| B3  | App ↔ database file         | Everything stored locally, encrypted                                            | Anyone with filesystem access, including a backup, gets ciphertext only.                        |
| B4  | App ↔ other apps and the OS | `sundaybest://` and universal-link URLs                                         | Any app on the device can open a link into ours. **All deep-link input is hostile.**            |
| B5  | Device ↔ backend            | Challenges, attestations, assertions, tokens, API payloads                      | Anyone on the network path. Also the device owner, via a proxy with a trusted root.             |

## STRIDE

Per boundary. **Status** is one of _in place_, _planned_, or _accepted_.

### B1/B2 — the device and its key stores

| Threat                                                                   | STRIDE                 | Mitigation                                                                                                                                                                         | Status                                  |
| ------------------------------------------------------------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Read the App Attest private key off the device                           | Information disclosure | Key is generated in and never leaves the Secure Enclave; the app only ever holds a `keyId`.                                                                                        | In place — by platform                  |
| Read the database key out of the keychain via a backup or another device | Information disclosure | `WHEN_UNLOCKED_THIS_DEVICE_ONLY`: not in backups, not synced to iCloud, unreadable while locked. One constant, applied by the adapter to every call so no call site can weaken it. | In place                                |
| Read the database key while the device is locked                         | Information disclosure | Same policy — the item is unavailable when locked.                                                                                                                                 | In place                                |
| Tamper with a keychain entry so the app loads attacker-chosen state      | Tampering              | Every read is Zod-validated against a per-key schema; a value that fails is deleted and reported as absent, not returned.                                                          | In place                                |
| Read local content off the filesystem or out of a backup                 | Information disclosure | SQLCipher with a 256-bit on-device key held in the keychain, so the file is ciphertext without it.                                                                                 | In place                                |
| Patch the app binary to skip checks                                      | Tampering              | Not defensible on a device the attacker owns. The server verifies attestations itself and never trusts a client claim of "I checked".                                              | Accepted, with server-side compensation |
| Jailbreak detection bypass                                               | Tampering              | Detection is planned (`src/core/security/integrity`, part 2) and will be advisory — reported to the server, never the sole gate.                                                   | Planned                                 |

### B4 — deep links and other apps

| Threat                                                                 | STRIDE                 | Mitigation                                                                                                                                   | Status                                    |
| ---------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| A crafted `sundaybest://` link drives the app into an unintended state | Tampering / elevation  | Every deep-link parameter is parsed with Zod at the boundary; `as` on untrusted input is a lint-and-review failure.                          | In place (rule); per-route as routes land |
| A malformed link hangs the JS thread                                   | Denial of service      | `decode-uri-component` pinned to 0.5.0 with a patch — this was a real ReDoS in expo-router's link parsing (see [PROJECT.md](../PROJECT.md)). | In place                                  |
| Sensitive data leaks via screenshot, app snapshot, or pasteboard       | Information disclosure | No sensitive data on screen yet. Tracked as MASVS-PLATFORM-3.                                                                                | Planned                                   |

### B5 — the network

| Threat                                                                   | STRIDE                             | Mitigation                                                                                                                                                                                                                      | Status                    |
| ------------------------------------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Plaintext traffic is read or modified                                    | Information disclosure / tampering | https is enforced **by the config schema**, not by convention: `EXPO_PUBLIC_API_URL` is refined to reject `http` in every variant except development ([env-schema.ts](../../src/core/config/env-schema.ts)). No ATS exemptions. | In place                  |
| A proxy with a trusted root reads traffic on a device the owner controls | Information disclosure             | Certificate pinning is not implemented. It raises the cost for a casual attacker and is bypassable by the device owner, so it is deferred rather than skipped.                                                                  | Planned (MASVS-NETWORK-2) |
| A captured assertion is replayed                                         | Spoofing                           | Challenges are single-use and time-limited, and App Attest assertions carry a counter the server must require to increase per key. Both are server-side obligations, specified in the [API contract](../api/attestation.md).    | Planned — server          |
| A stolen access token is used after the app is closed                    | Spoofing                           | Access tokens are short-lived and kept **in memory only**; only the refresh token persists, and refreshing requires a fresh assertion.                                                                                          | In place (client half)    |
| Token endpoint is brute-forced or flooded                                | Denial of service                  | Rate limits per attested `keyId`, specified in the API contract.                                                                                                                                                                | Planned — server          |

## Abuse cases specific to having no login

These are the ones that get missed, because the usual mitigation is "make them
sign in" and that is not available.

| #   | Abuse case                                                                                                                                                              | Why it is attractive                                       | Response                                                                                                                                                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U1  | **Scripted client.** Read the API URL out of the bundle and call it from a script, skipping the app entirely.                                                           | Free access to whatever the backend does, at any volume.   | This is the threat App Attest exists for. The server rejects any request without a valid assertion over a fresh challenge.                                                                                                                    |
| U2  | **Assertion replay.** Capture one valid request and resend it.                                                                                                          | Turns a single legitimate interaction into unlimited ones. | Single-use challenges plus the monotonic assertion counter. Neither works unless the server _enforces_ them, which is why both are explicit in the contract.                                                                                  |
| U3  | **Attestation farming.** Attest many installs across many real devices (or emulator farms and rented devices) to get many trusted `keyId`s.                             | Defeats per-key rate limiting by having many keys.         | Accepted as not fully preventable. Mitigations: per-key limits make each key low-value, and Apple's attestation receipt lets the server estimate risk per key over time. Global limits still apply.                                           |
| U4  | **Quota reset by reinstall.** Delete and reinstall to get a fresh key and a fresh allowance.                                                                            | Bypasses any per-install limit.                            | Accepted. A new install genuinely is a new key — that is by design, since there is no account to tie it to. Anything that must survive reinstall cannot be anchored to the install.                                                           |
| U5  | **Someone else's key.** Submit a `keyId` belonging to another install to burn their rate limit.                                                                         | Denial of service against a specific user, at no cost.     | The `keyId` alone proves nothing: the server must only ever act on a `keyId` whose assertion verifies against that key's stored public key. Stated as a requirement in the contract, because getting this wrong is an easy and total failure. |
| U6  | **Local tampering to unlock behaviour.** Patch the app or edit the keychain to turn on something gated.                                                                 | Whatever is gated.                                         | Nothing security-relevant is gated client-side. `verboseLogging` is off in production by construction, and the server re-checks every authority decision.                                                                                     |
| U7  | **No recovery path is abused as a support channel.** With no accounts, there is no "prove who you are" story, so any recovery mechanism becomes an impersonation route. | Access to someone else's data.                             | Deliberately none. Local data is local; losing the device loses the data. This is a product consequence of no accounts and must be said out loud in the UI, not solved with a backdoor.                                                       |

## What is deliberately not defended

Saying this plainly is part of the model:

- **A device the attacker fully controls.** Jailbroken devices can run the app
  under a debugger and use its attested key. The mitigation is server-side:
  verify everything, rate-limit per key, and treat client assertions as
  _evidence_, not _authority_.
- **Reverse engineering the bundle.** JavaScript ships to the device. There is no
  obfuscation, and no secret is hidden in the app for it to protect
  (MASVS-RESILIENCE-3).
- **Anything proportionate to a product that has no accounts, no payments, and
  no personal data.** RESILIENCE-3 and RESILIENCE-4 are explicitly out of scope,
  with the reason recorded in the checklist rather than left blank.

## Review triggers

Re-read this file when any of these happen:

- Accounts, sign-in, or payments are added — the whole AUTH section changes.
- The first real network call lands, or any data starts leaving the device.
- A native module is added (each one is new attack surface and a new privacy
  manifest entry).
- Local tables are created, so A5 stops being empty.
- Certificate pinning or jailbreak detection is implemented.
