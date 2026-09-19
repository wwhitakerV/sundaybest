# 6. Network security and device integrity

Date: 2026-09-18

## Status

Accepted

## Context

Prompt 7 gave the app an identity — an attested install, a keychain, an
encrypted database — but nothing that talks to a network, and nothing that
forms an opinion about the device it is running on.

This decision covers every remaining edge of the app:

- **Outbound**: a typed HTTP client, and TLS pinning underneath it.
- **The device**: runtime integrity signals, and what to do about them.
- **The screen**: screenshots and the app-switcher snapshot.
- **Inbound**: deep links, which are the one thing any other app on the phone
  can hand us.

## Decision

### React Native's fetch, not Expo's — because pinning cannot see Expo's

This is the load-bearing decision of the prompt, so the evidence is written out
rather than summarised.

Expo SDK 57 replaces the global fetch:

```ts
// node_modules/expo/src/winter/runtime.native.ts:41
const useRnFetch =
  process.env.EXPO_PUBLIC_USE_RN_FETCH === "1" || process.env.EXPO_PUBLIC_USE_RN_FETCH === "true";

if (!useRnFetch) {
  install("fetch", () => require("./fetch").fetch);
}
```

`expo/fetch` is a native module with **its own** URLSession:

```swift
// node_modules/expo/ios/Fetch/ExpoFetchModule.swift:133
return URLSession(configuration: config, delegate: urlSessionDelegate, delegateQueue: nil)
```

and grepping `node_modules/expo/ios/Fetch/*.swift` for `challenge` or
`serverTrust` returns **nothing** — that session implements no
authentication-challenge callback at all. TrustKit works by intercepting exactly
that callback. There is nothing for it to intercept.

`react-native-ssl-public-key-pinning`'s own README agrees, in general terms:
pinning applies to "the standard Networking APIs" and "native libraries with
custom network implementations are not affected". `expo/fetch` is precisely a
native library with a custom network implementation.

So the app sets **`EXPO_PUBLIC_USE_RN_FETCH=1`**, Expo's documented opt-out.
React Native's fetch is the `whatwg-fetch` polyfill over `XMLHttpRequest` →
`RCTNetworking` → a delegated `NSURLSession`, which TrustKit does hook.

**The flag is a required field in the env schema, not a comment in
`.env.example`.** A build that omits it still runs, still passes every test, and
silently has no pinning — a failure with no symptom. Requiring it means the app
refuses to launch instead. Only `"1"` is accepted, although Expo also honours
`"true"`, so two config files cannot disagree while both looking right.

**What this costs:** `expo/fetch` is the implementation with streaming and
server-sent-event support. React Native's does not stream response bodies. The
app has no use for either today; if it ever does, the choice has to be reopened
rather than quietly reverted.

**The alternative, for the record:** `ExpoFetchModule` exposes a
`urlSessionConfigurationProvider` hook, so a config plugin could inject a pinned
`URLSessionConfiguration` and keep `expo/fetch`. That means writing and
maintaining native code in `plugins/` to work around a library boundary.
Rejected as disproportionate for an app with one API host.

### Pinning library: `react-native-ssl-public-key-pinning`

| Candidate                               | Last publish | Verdict                                                                                                                                                                                                                                                     |
| --------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **react-native-ssl-public-key-pinning** | 2025-07      | **Chosen.** TurboModule, so it works on RN 0.86, which is New-Architecture-only. TrustKit on iOS, OkHttp `CertificatePinner` on Android. Transparent: it configures the platform networking stack, so every caller is covered whether or not they remember. |
| react-native-ssl-pinning                | 2025-07      | Rejected. Exposes its own `fetch`, so pinning applies only where a developer remembered to use it — and TanStack Query would need rewiring. Pinning you can forget is not pinning.                                                                          |
| react-native-pinch                      | 2025-10      | Rejected. `0.1.0`, same bespoke-client shape.                                                                                                                                                                                                               |
| react-native-cert-pinner                | 2022-05      | Rejected. Abandoned.                                                                                                                                                                                                                                        |

The chosen library's last publish is over a year old, which is the one real mark
against it. It is accepted because it is a thin binding over two libraries that
_are_ maintained — TrustKit and OkHttp — and because the transparency property
is worth more than recency here.

It ships no Expo config plugin and needs none: it is autolinked and configured at
runtime. Like SQLCipher, it requires a development build and does not work in
Expo Go.

### Two pins per domain, and a placeholder that fails the build

`pins.ts` requires a **primary and a backup** hash per domain. TrustKit enforces
a minimum of two, and the reason is operational rather than cryptographic: a
single pin means that rotating the certificate bricks every installed copy of the
app until users update. The backup pin must be for a key held offline and not yet
in use.

The hashes are placeholders, and `assertPinsUsable` **throws in preview and
production if any hash is still a placeholder**. A build that believes it is
pinned while pinning nothing is worse than a build with no pinning at all,
because it stops anyone looking. Development skips pinning entirely, so local
work against a proxy still functions.

### Integrity: one small policy, and it never crashes the app

freeRASP (`freerasp-react-native`) reports a long list of signals. Mapping each
to its own behaviour would be a policy nobody could reason about, so they
collapse into three responses:

| Signal                                                | Response                       | Why                                                                                                                       |
| ----------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| app integrity, hooks, unofficial store, tampering     | **clear the session**          | The binary or its runtime has been modified. Anything the app is holding may already be observed, so it stops holding it. |
| privileged access (jailbreak), simulator              | **disable sensitive features** | The device is not trustworthy, but the app is intact. Degrade rather than refuse.                                         |
| everything else — debug, passcode, VPN, screenshot, … | **report only**                | Informational. Acting on these breaks legitimate users: a corporate VPN is not an attack.                                 |

Three properties are deliberate:

- **It never crashes the app.** `killOnBypass` is off and an unrecognised
  signal degrades to `report-only`. A security control that bricks the app on an
  unfamiliar device has become the outage.
- **The policy is pure and the SDK is a thin shell.** `policy.ts` maps names to
  responses with no native dependency, so every branch is unit-tested;
  `freerasp-integrity.ts` only wires the hook to it.
- **Off in development.** Simulators trip several of these by design.

`disable-sensitive` is not advice — the API client refuses `sensitive` requests
with an `integrity` failure when it is set. Client-side enforcement is still
bypassable on a device the attacker owns, which is why the server verifies
assertions independently; this is defence in depth, not the defence.

### API client: typed failures, and one retry only where it is safe

`createApiClient` wraps `fetch` with the base URL from the env config, a timeout
via `AbortSignal.timeout` (Expo installs that polyfill before the fetch swap, so
it survives the opt-out), a Zod parse of every response, and the session token.

`ApiError` gains a `kind` alongside its existing contract `code`, because "what
shape of failure" and "which documented error code" are different questions:
`network`, `timeout`, `client`, `server`, `schema`, `integrity`.

**A schema mismatch is a failure, not a warning.** A response that does not match
its contract is treated as a server fault and the data is discarded. The
alternative is passing a partially-understood payload into the app, which is the
`as`-on-untrusted-data pattern the security rules forbid.

**One retry, for idempotent requests only.** `GET` and `HEAD` are idempotent by
default; anything else must opt in explicitly. Retrying a `POST` after a timeout
is how one request becomes two of whatever it created — and a timeout does not
tell the client whether the server processed it.

Endpoints marked `sensitive` get a **fresh assertion per request**, sent as
`X-Attestation-KeyId`, `X-Attestation-Assertion` and `X-Attestation-Challenge`.
These are added to `docs/api/attestation.md` rather than invented at the call
site, because a header the contract does not document is a header the server will
not check.

### TanStack Query, with nothing persisted

`createQueryClient` sets defaults that matter for a security posture rather than
for convenience: **no retry on 4xx** (a rejected request repeated is a rejected
request), one retry on 5xx and transport errors, and `refetchOnWindowFocus` off.

"Never persist sensitive queries" is guaranteed by there being **no persister at
all**, and a test asserts that. Adding one later therefore breaks a test, which
is the point — persistence is a decision, not a default. `sensitiveQueryOptions`
(`gcTime: 0`) exists for data that must not outlive its use even in memory.

### Deep links: an allowlist, and the URL is never logged

`validateDeepLink` is pure and lives outside `src/app`. It checks an inbound path
against a Zod allowlist of routes and their params; **anything not on the list
resolves to `/`**, because the safe response to an unrecognised link is the home
screen, not a guess.

**It never logs the raw URL.** A deep link is attacker-controlled text handed to
us by any app on the phone, and logging it is how that text reaches a crash
report, a log aggregator, or a screenshot. The validator returns a _reason_ code
for the caller to log instead.

`src/app/+native-intent.tsx` is delegation only, keeping `src/app` to routing.
`redirectSystemPath({ path, initial })` is the hook expo-router calls, confirmed
in `expo-router/build/getLinkingConfig.js`.

### Screen protection

`usePrivacyScreen()` combines `usePreventScreenCapture` with
`enableAppSwitcherProtectionAsync`, which **does** exist in SDK 57's
`expo-screen-capture` (verified against the installed `.d.ts`), so app-switcher
snapshots can be blurred rather than left as a gap.

It lives in `src/core/security/screen/` rather than `src/hooks/`, because
`AGENTS.md` confines every side-effect SDK import to `src/core`. The three new
packages are added to `SIDE_EFFECT_SDKS_CORE_ONLY` in `eslint.config.js`, so the
rule is enforced rather than merely stated.

## Consequences

**Good**

- Every edge of the app now has a validated boundary: responses, links, and the
  device itself.
- Pinning applies to every request without any call site opting in.
- A misconfigured build fails at launch rather than shipping unprotected.
- The integrity policy is a pure function, so its branches are tested rather
  than trusted.

**Costs and things to watch**

- **Three native modules, none of them verifiable here.** Pinning, freeRASP, and
  app-switcher protection all need a development build. Their unit tests cover
  our adapters against mocks, and say nothing about the native behaviour.
- **`freerasp-react-native` has no `codegenConfig`**, so it is a legacy module
  running through the New Architecture interop layer on RN 0.86. It works today;
  it is the most likely of the three to break on an SDK upgrade.
- **No streaming responses**, as a direct consequence of the fetch opt-out.
- **TLS session caching makes pinning hard to test.** A connection that
  succeeded before the pins changed will keep succeeding until the app restarts,
  per the library's own documentation. The manual bad-certificate test has to
  start from a cold launch.
- **Placeholder pins block a preview build**, on purpose. That is a checklist
  item, not a bug, and it will be the first thing to trip when someone tries to
  build for TestFlight.

## Alternatives considered

- **Certificate pinning instead of public-key pinning.** Rejected: certificates
  rotate far more often than keys, so certificate pins expire and brick apps.
- **No pinning at all**, which is what prompt 7's threat model had deferred.
  Reversed here because the prompt asked for it; the honest assessment from the
  threat model still stands — pinning is bypassable by the device owner, so its
  value is against network-position attackers, not against the user.
- **Acting on more freeRASP signals.** Rejected: a VPN or a debugger attached to
  a developer's own phone is not an attack, and a policy that treats it as one
  produces support tickets instead of security.
- **Blocking the app on a jailbroken device.** Rejected: it punishes users who
  modified their own hardware, and it is trivially patched out by anyone who
  actually intends harm. Degrading sensitive features is the proportionate
  response.
