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

## `config/`

The only place `process.env` is read. `env-schema.ts` holds the Zod schema and
`parseEnv` (pure, so `scripts/check-env.mjs` imports it too); `env.ts` parses the
`EXPO_PUBLIC_*` variables at module scope and exports a frozen `env`;
`flags.ts` derives the feature flags from it behind `FlagSource`. See
[ADR 0004](../../docs/adr/0004-configuration-and-environments.md).

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
