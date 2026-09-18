# Backend contract — attestation and sessions

**Status: specification. No server implements this yet.**

This is the contract the client is built and tested against. The Zod schemas in
[`src/core/api/contracts/attestation.ts`](../../src/core/api/contracts/attestation.ts)
are the executable form of this document, and the MSW handlers in
`test/mocks/attestation-handlers.ts` are a fake server that honours it. Changing
one means changing all three.

Server-side work is tracked in [SETUP_CHECKLIST.md](../SETUP_CHECKLIST.md).

## Model

The app has no accounts. An **attested install** is the only identity:

- **`keyId`** — an App Attest key identifier, created once per install and held
  in the keychain. It is the long-lived identity. It is _not_ a secret and proves
  nothing by itself.
- **Assertion** — a per-request signature from the Secure Enclave over a
  server-issued challenge. This is what actually proves anything.
- **Access token** — short-lived bearer token, issued after a valid assertion.

Base URL comes from `EXPO_PUBLIC_API_URL` (https everywhere except the
development variant). All bodies are JSON; all responses are JSON, including
errors.

## Non-negotiable server rules

Getting any of these wrong makes the whole scheme decorative.

1. **Never act on a `keyId` alone.** A `keyId` is public. Every request that
   carries one must carry an assertion that verifies against _that key's_ stored
   public key. See abuse case U5 in the [threat model](../security/threat-model.md).
2. **Challenges are single-use and short-lived.** Issue them, store them, delete
   them on first use, expire them after 120 seconds. A reusable challenge means
   replay.
3. **The assertion counter must strictly increase per key.** App Attest includes
   a counter in every assertion. Store the last value per `keyId` and reject any
   assertion whose counter is not greater. This is the second half of replay
   protection, and it is the half that is usually forgotten.
4. **Verify attestations per Apple's guide**, not partially: the certificate
   chain to Apple's App Attest root, the nonce (SHA-256 of the authenticator data
   plus the SHA-256 of the challenge), the App ID hash against the correct team
   and bundle ID, the counter being 0, and the `aaguid`
   (`appattestdevelop` in the sandbox, `appattest` + zero padding in production).
5. **Accept both App Attest environments.** Apple ignores the
   `appattest-environment` entitlement once a build is distributed through
   TestFlight or the App Store, so a `preview` build installed from TestFlight
   produces **production** attestations even though the entitlement says
   `development`. The server must decide per environment rather than assuming the
   variant implies it.
6. **Bundle IDs.** Three are valid: `com.walterwhitaker.sundaybest`,
   `.preview`, and `.dev`. Production data must only accept the production bundle
   ID.

## `POST /attest/challenge`

Issues a one-time challenge. Called before both attestation and every assertion.

**Request**

```json
{ "keyId": "aGVsbG8..." }
```

`keyId` is **optional**: absent on first launch, when no key exists yet.

**Response `200`**

```json
{
  "challenge": "0f8f...b1",
  "expiresAt": "2026-09-17T12:00:00.000Z"
}
```

| Field       | Type                 | Notes                                                           |
| ----------- | -------------------- | --------------------------------------------------------------- |
| `challenge` | string, 32–512 chars | Opaque to the client. At least 16 bytes of entropy server-side. |
| `expiresAt` | ISO 8601 UTC         | Advisory for the client; the server enforces it regardless.     |

Rate limit: **10 per minute per `keyId`**, and a separate global limit for
requests with no `keyId` (they are unauthenticated by definition).

## `POST /attest/verify`

Registers a newly attested key. Called once per install.

**Request**

```json
{
  "keyId": "aGVsbG8...",
  "attestation": "o2NmbXRvYXBwbGUtYXBwYXR0ZXN0Z2F0dFN0bXQ...",
  "challenge": "0f8f...b1"
}
```

**Response `201`**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "rt_...",
  "expiresIn": 900
}
```

| Field          | Type                     | Notes                                             |
| -------------- | ------------------------ | ------------------------------------------------- |
| `accessToken`  | string                   | Bearer token. Client keeps it **in memory only**. |
| `refreshToken` | string                   | Persisted to the keychain by the client.          |
| `expiresIn`    | integer seconds, 60–3600 | Access-token lifetime.                            |

On success the server stores the key's public key, its counter (0), the bundle
ID, and the App Attest environment, keyed by `keyId`.

Rate limit: **5 per hour per `keyId`**. Attestation should happen once; a burst
means something is wrong.

## `POST /session/refresh`

Exchanges a refresh token plus a **fresh assertion** for a new access token.
The assertion is what makes a stolen refresh token insufficient on its own.

**Request**

```json
{
  "keyId": "aGVsbG8...",
  "refreshToken": "rt_...",
  "assertion": "omlzaWduYXR1cmVYRjBEAiB...",
  "challenge": "0f8f...b1"
}
```

**Response `200`** — same shape as `/attest/verify`, and the server **rotates
the refresh token**: the response always contains a new one and the old one is
invalidated. A refresh token presented twice means it leaked; revoke the key's
session family and force re-attestation.

Rate limit: **30 per hour per `keyId`**.

## Token lifetimes

| Token         | Lifetime               | Stored where                             | Rotated          |
| ------------- | ---------------------- | ---------------------------------------- | ---------------- |
| Challenge     | 120 s, single use      | Server only                              | n/a              |
| Access token  | 900 s (15 min) default | Client memory only                       | On every refresh |
| Refresh token | 30 days, or until used | Client keychain (`session.refreshToken`) | On every refresh |
| `keyId`       | Life of the install    | Client keychain (`attestation.keyId`)    | Never            |

The client refreshes **before** expiry using a 60-second skew margin, so a token
that is about to expire is never sent.

## Errors

Every non-2xx response uses one envelope:

```json
{
  "error": {
    "code": "CHALLENGE_EXPIRED",
    "message": "Challenge has expired."
  }
}
```

`message` is for logs and must never contain anything sensitive. The client
branches on `code` only — never on `message`, and never on the status alone.

| Code                    | HTTP | Meaning                            | Client response                                    |
| ----------------------- | ---- | ---------------------------------- | -------------------------------------------------- |
| `CHALLENGE_EXPIRED`     | 400  | Challenge past its TTL             | Retry once with a new challenge                    |
| `CHALLENGE_UNKNOWN`     | 400  | Not issued, or already used        | Retry once with a new challenge                    |
| `ATTESTATION_INVALID`   | 401  | Failed Apple verification          | Do **not** retry. Surface as unavailable and stop. |
| `ASSERTION_INVALID`     | 401  | Signature or counter check failed  | Re-attest once; if it fails again, stop            |
| `KEY_UNKNOWN`           | 404  | `keyId` not registered             | Discard the stored `keyId` and re-attest           |
| `KEY_REVOKED`           | 403  | Server revoked this install        | Do **not** retry. `session.clear()`.               |
| `REFRESH_TOKEN_INVALID` | 401  | Unknown, expired, or already used  | Re-attest                                          |
| `RATE_LIMITED`          | 429  | Over a limit; `Retry-After` header | Back off, honour `Retry-After`                     |
| `UNSUPPORTED_BUNDLE`    | 403  | Bundle ID not accepted here        | Do **not** retry                                   |
| `INTERNAL`              | 5xx  | Server fault                       | Back off and retry                                 |

**Retryable** (`transient` on the client): `CHALLENGE_EXPIRED`,
`CHALLENGE_UNKNOWN`, `RATE_LIMITED`, `INTERNAL`, and transport failures.
Everything else is `rejected` and must not be retried in a loop — a client that
retries `ATTESTATION_INVALID` forever is a client that has turned a failure into
a denial-of-service attack on its own backend.

## Sequences

**First launch**

```
app                                     server
 │── POST /attest/challenge  {}          ─→│
 │←─ 200 {challenge, expiresAt}          ──│
 │  generateKeyAsync()        (Enclave)     │
 │  attestKeyAsync(keyId, challenge)        │
 │── POST /attest/verify {keyId, attestation, challenge} ─→│
 │←─ 201 {accessToken, refreshToken, expiresIn}          ──│
 │  store keyId + refreshToken in keychain  │
```

**Later, access token expired**

```
 │── POST /attest/challenge  {keyId}      ─→│
 │←─ 200 {challenge, expiresAt}           ──│
 │  generateAssertionAsync(keyId, challenge)│
 │── POST /session/refresh {keyId, refreshToken, assertion, challenge} ─→│
 │←─ 200 {accessToken, refreshToken, expiresIn}                       ──│
```

Only **one refresh runs at a time** on the client; concurrent callers await the
in-flight one rather than starting a second.

## Open questions for whoever builds the server

- Where does the assertion counter live, and is its write transactional with the
  token issue? A non-atomic update is a replay window.
- What revokes a key — manual only, or automated on a risk signal from the
  attestation receipt?
- Does `keyId` become a data-retention subject once tables exist? It is an
  install identifier, which has privacy implications worth settling before it is
  logged anywhere.
