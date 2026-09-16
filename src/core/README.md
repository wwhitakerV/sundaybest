# src/core — every side effect

The only layer allowed to touch the outside world: the network, the keychain, the
filesystem, the OS, the crash reporter. Isolating it keeps the rest of the app
pure enough to test without mocks sprawling everywhere.

## Structure

```
api/          HTTP client, interceptors, error mapping
security/
  attestation/    app attestation / DeviceCheck
  secure-storage/ keychain-backed storage
  integrity/      jailbreak and tamper checks
  session/        session lifecycle
storage/      non-secret persistence
config/       environment and runtime config
monitoring/   logging, crash and error reporting
providers/    app-wide React providers (AppProviders)
```

## Belongs here

- Any import of an SDK with side effects — secure storage, app integrity,
  networking, crash reporting, analytics. Lint blocks those imports everywhere
  else, so `src/core` is the single audited surface for them.
- Wrappers that expose a narrow, typed, testable API over those SDKs.

## Never goes here

- Feature logic or screens. Core must not know what SundayBest _does_.
- Imports from `@/features`, `@/app`, or `@/ui`. Core is a leaf that features
  depend on, never the reverse.

## May import

`@/core`, `@/utils`, `@/theme`, `@/types`.
