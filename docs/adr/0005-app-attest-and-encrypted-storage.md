# 5. App Attest, secure storage, and the encrypted database

Date: 2026-09-17

## Status

Accepted

## Context

The app has **no accounts and no sign-in**. That is a settled product constraint,
and it creates one problem that everything in this ADR exists to answer:

> With no user to authenticate, the backend must decide whether to trust a
> request on the strength of the client alone.

An unauthenticated API is an open API. The endpoint is compiled into the bundle,
so anyone can read it out and call it from a script at any volume. Meanwhile the
app needs somewhere to keep secrets, and eventually somewhere to keep the user's
content — on a device whose owner may be the attacker.

The backend does not exist yet, which means the client cannot be built against
it. It has to be built against a _contract_.

See [docs/security/threat-model.md](../security/threat-model.md) for the full
analysis and [docs/api/attestation.md](../api/attestation.md) for the contract.

## Decision

### Authenticate the install, with Apple App Attest

`@expo/app-integrity` over Apple's DeviceCheck App Attest. The Secure Enclave
generates a key that never leaves it, Apple attests that the key belongs to a
genuine unmodified build of this bundle ID on real hardware, and the server
verifies that attestation itself.

This authenticates the **install**, never the person. Nothing in the app treats
an assertion as evidence about a user.

**Pinned to an exact version** (`57.0.2`, no `~`). It is a young library and this
is the code path that decides whether the backend trusts a request; it does not
float on a range. Everything else from the SDK stays on Expo's `~` ranges.

### Nothing throws across the security boundary

Every entry point in `src/core/security/attestation` returns a discriminated
union — `attested`, `already-attested`, `disabled`, `unsupported`, `transient`,
`rejected`, `needs-attestation` — rather than throwing.

Attestation failing is a _normal_ state: on a Simulator, on a train, with the
feature flag off. If callers had to `try`/`catch`, some caller eventually would
not, and the failure mode of a missed catch here is an unhandled rejection in a
security path.

The `transient` / `rejected` split comes straight from the contract's error
table, and it is load-bearing in both directions. A client that retries
`ATTESTATION_INVALID` in a loop has turned its own failure into a
denial-of-service attack on its backend; one that gives up on `RATE_LIMITED` is
broken for the rest of the hour.

Two cases are worth calling out because they pull in opposite directions:

- **`KEY_UNKNOWN`** → discard the stored `keyId` and re-attest. The server has no
  record of this key, so keeping it loops forever on something that can never
  work.
- **`KEY_REVOKED`** → keep the key and stop. The server knows this install and
  has decided against it. Re-attesting would mint another key for the same device
  and burn Apple's per-install key budget doing it.

### No separate `"simulator"` reason

The prompt asked for one. It is not honestly producible:
`DCAppAttestService.isSupported` is already `false` on the Simulator, so the flow
stops before reaching any API that could say more, and neither `expo-constants`
nor React Native exposes a simulator flag. Adding `expo-device` to distinguish
them would be a dependency bought to change a log label.

So `unsupported` carries two reasons that can actually occur — `platform` (not
iOS) and `app-attest-unavailable`. In practice the second **is** the Simulator,
since every device meeting the app's minimum iOS supports App Attest. If the
distinction is ever needed, `expo-device` is the way, and this paragraph is the
reason it was not done now.

### One keychain policy, applied by the adapter

`WHEN_UNLOCKED_THIS_DEVICE_ONLY`, from a single exported constant, passed on
every call in `expo-secure-storage.ts`.

expo-secure-store defaults to `WHEN_UNLOCKED`, which **is** included in encrypted
device backups and restorable onto another device. One forgotten option at one
call site would silently be that weaker policy with no visible difference, so
there is no per-call override to forget.

`requireAuthentication` is deliberately unused — it would put a Face ID prompt in
front of the app's own bootstrap — and `faceIDPermission: false` in the config
keeps the app from declaring a capability it has no use for.

### Typed keys with per-key schemas, and delete-on-invalid reads

`keys.ts` holds one object mapping each key to its Zod schema; the key union and
the value types are both derived from it, so a key cannot exist without a schema.
Free-form string keys are what lets a typo write a secret to a slot nothing reads.

The judgement call: **a stored value that fails its schema is deleted and
reported as absent.** On a device its owner controls, keychain entries are
editable, so a value that no longer matches is corruption or tampering.

- Returning it would let attacker-chosen data into the app.
- Throwing would leave the app permanently broken with no route back short of a
  reinstall.
- Deleting it puts the caller in the "nothing stored" state, which every caller
  already handles because it is what first launch looks like.

### The database key is generated, not derived

32 bytes from `expo-crypto`'s CSPRNG on first launch, hex-encoded, kept in the
keychain. **Not derived** from a device identifier, the bundle ID, or any
constant: a derived key is only as unguessable as its inputs, and every such
input is readable by someone holding the phone.

The provider is single-flight. Two concurrent provisioning runs would each
generate a key and both would write; whichever lost would hand its caller a key
that no longer opens the database, leaving an encrypted file nothing on the device
can read. That is data loss, not a leak, and it is the kind of race that only
shows up in production.

It refuses a short read or an all-zero buffer from the random source. Both are
ways a random source fails _without erroring_, and either would produce a
database that looks encrypted and is not.

Key management is why this lives in `src/core/security/database-key/` rather than
beside the database adapter: it is MASVS-CRYPTO-2, and it is held to the stricter
coverage bar that applies to `src/core/security`.

### SQLCipher with a passphrase, not a raw key

`PRAGMA key = '<64 hex chars>'` immediately after opening, which is the form
Expo's SDK 57 documentation gives. SQLCipher also accepts a raw key as
`x'...'`, which skips PBKDF2 — attractive for material that is already 256 bits
of entropy — but it is not in the documented path and cannot be verified without
a device build. The documented form costs one key derivation at open and is
certain to work. Revisit only with a device to test on.

Because SQLCipher has no parameterised form for `PRAGMA key`, the key is
concatenated into SQL. **The key's format is therefore a security boundary**, and
`sqlcipher-database.ts` re-validates it against `/^[0-9a-f]{64}$/` before
interpolating — even though `database-key.ts` already generates exactly that. A
value containing a quote would close the string literal and make the remainder
executable.

The adapter also **proves the key worked** with a `SELECT count(*) FROM
sqlite_master` probe. SQLCipher accepts a wrong `PRAGMA key` silently and fails
on the first real read, so without the probe a wrong key surfaces much later as
an unexplained "file is not a database" in the middle of a feature.

### `query` returns `unknown[]`

Not `query<T>()`. A row read from a file on disk is untrusted input — the file
may have been written by an older build, or edited — so callers parse it with
Zod, exactly as they do a network response or a deep link. A generic here would
be a cast wearing a generic's clothing.

### Migrations: forward-only, one transaction each, `user_version`

`user_version` rather than a table of our own: it is an integer in the database
header, so there is no bootstrap problem of needing a migration to create the
migrations table.

Each migration and its version bump commit **together**. Apart, a crash between
them leaves a changed schema with an unchanged version, so the next launch
reapplies a migration against a schema that already has it — bricked in a way
only a reinstall fixes.

The runner validates the list before touching the database: consecutive from 1,
no duplicates, no gaps, in order. A gap means a shipped migration was deleted,
after which some installs have run it and some have not and nothing left in the
repo can say which. It also refuses a database **newer** than the build, because
migrations only go forward and writing to a schema the code does not understand
corrupts it.

There are no `down` migrations. A rollback on a user's device is a data-loss
event with no operator present to supervise it; if a migration is wrong, the fix
is another migration.

### Sessions: memory-first, one refresh at a time

The access token lives in a closure and dies with the process. Only the refresh
token is persisted, and refreshing also requires a **fresh assertion** from the
Secure Enclave — so a refresh token lifted from a backup is inert on its own.

**One refresh in flight.** Refresh tokens rotate, so two concurrent refreshes
would each invalidate the other's token: a screen firing five requests on mount
would leave four failed and the stored token whichever raced last. Concurrent
callers await the in-flight refresh.

`clear()` also **invalidates a refresh already in flight**, via a generation
counter. Without that, a tamper response could be immediately undone by a request
that was already on the wire — the whole point of `clear()` is that it sticks.

Expiry is checked against an injected clock with a 60-second skew margin, so a
token with seconds left is refreshed rather than sent.

### App Attest entitlement per variant, with a caveat

`com.apple.developer.devicecheck.appattest-environment` is set from the variant
table in `app.config.ts`: `development` for development and preview,
`production` for production. `@expo/app-integrity` ships no config plugin, so
this is ours to declare.

**Apple ignores this entitlement once a build is distributed through TestFlight,
the App Store, or the Enterprise programme** — such a build always uses
production. So a preview build installed from TestFlight produces _production_
attestations despite saying `development`. The server therefore has to decide per
environment rather than assume the variant implies it, which is written into the
API contract as a requirement rather than left as a surprise.

### The backend as a contract in three forms

`docs/api/attestation.md` is the specification, `src/core/api/contracts/` is its
executable form, and `tests/mocks/attestation-handlers.ts` is a fake server.
`tests/integration/attestation-contract.test.ts` makes the fake server's responses
pass the app's own parsers, so the three cannot drift apart silently — otherwise
every other test would keep passing against a fiction.

## Consequences

**Good**

- The backend gets a meaningful trust signal without accounts, and the client
  cannot accidentally turn it off — `EXPO_PUBLIC_ATTESTATION_ENABLED` gates it,
  but the server decides.
- Secrets are in the keychain under one policy that no call site can weaken, and
  a tampered entry cannot become app state.
- Local data is encrypted with a key that exists only on that device.
- Every failure is a value with a name, so the calling code reads as a decision
  rather than a `catch`.
- `src/core/security` is at **100%** line, branch, function, and statement
  coverage, against a 95% threshold.

**Costs and things to watch**

- **None of this is worth anything until the server verifies it.** Attestation
  the server does not check is theatre. The server obligations are in
  [SETUP_CHECKLIST.md](../SETUP_CHECKLIST.md) and the contract, and RESILIENCE-1
  and RESILIENCE-2 stay `planned` until they are met.
- **SQLCipher needs a real build.** It is a native flag and does not work in Expo
  Go, so the database cannot be exercised with `npx expo start` against Expo Go.
- **`expo-sqlite` cannot be imported at the top of a Jest test.** Its entry point
  requires `expo-asset`, which is installed only nested under `expo/` — Metro
  resolves it, Jest does not. `jest.mock("expo-sqlite", factory)` is required.
  Recorded in [PROJECT.md](../PROJECT.md).
- **Nothing calls any of this yet.** Wiring it into app startup is deliberately
  not in this prompt; the modules are reachable from their tests only. That keeps
  the change reviewable, and means a bug here cannot break the running app before
  something chooses to use it.
- Losing the device loses the local data. That is a direct consequence of having
  no accounts, and it must be said in the UI rather than solved with a recovery
  backdoor that would double as an impersonation route.

## Alternatives considered

- **An API key in the app.** Rejected: `EXPO_PUBLIC_*` is compiled into the
  bundle, so this is a shared secret published to every user.
- **Anonymous accounts** (a generated user ID, no sign-in). Rejected: it
  authenticates a value the client made up, so it stops nothing, and it creates
  an identifier with privacy consequences in exchange.
- **DeviceCheck instead of App Attest.** Rejected: DeviceCheck gives two bits of
  per-device state, not proof of app integrity.
- **A jailbreak check as the gate.** Rejected as a primary control: it runs on
  the device it is judging. It is worth having as an advisory signal — part 2 —
  but the authority has to sit server-side.
- **Encrypting individual values instead of the whole database.** Rejected: it
  moves key handling into every call site and leaves indexes, table names, and
  free lists in plaintext.
- **Deriving the database key from a device identifier**, to survive a keychain
  loss. Rejected: everything available to derive from is also available to an
  attacker holding the phone.
