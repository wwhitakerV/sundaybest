# 7. Logging and crash reporting

Date: 2026-09-19

## Status

Accepted

## Context

The app had no leveled logger and no crash reporter. `EXPO_PUBLIC_SENTRY_DSN`
and the `crashReporting` flag already existed in `src/core/config/`, added in
anticipation of this prompt, and `@sentry/*` was already confined to
`src/core` by `SIDE_EFFECT_SDKS_CORE_ONLY` in `eslint.config.js`. This
decision covers three things: a logger that never leaks to a shipped device's
console, crash reporting wrapped so the SDK can be swapped, and error
boundaries wired into the root layout.

Adding `@sentry/react-native` is a new SDK with a side effect — network
egress — which the security rules require an ADR for.

## Decision

### The logger redacts first and asks questions never

`createLogger(env, reporter)` runs every message and every context value
through `@/utils/redaction/redactSensitive` before it reaches a console call
or the crash reporter — there is no code path where an unredacted string can
reach either. Console output is gated on `env.variant !== "production"`; a
production build never calls a console method, full stop. `metro.config.js`
adds a second, independent guarantee at the bundler level
(`transformer.minifierConfig.compress.drop_console`), so the property holds
even if the runtime check were ever bypassed.

`error`-level calls also forward to the crash reporter's `captureMessage`, so
an error surfaces in Sentry even with the console silenced in production.

### Crash reporting is a no-op until a DSN exists, not until a variant says so

`createSentryReporter(env)` never calls `Sentry.init` while
`env.sentryDsn === undefined` — gated on DSN presence, not on
`variant === "production"`, so a preview or production build with no DSN
configured is just as inert as development. This mirrors
`flags.ts`'s own `crashReporting: config.sentryDsn !== undefined` exactly, so
the flag and the reporter can never disagree about whether reporting is live.

When a DSN is present:

- `sendDefaultPii: false`, explicit rather than trusted as the SDK default.
- `release`/`dist` come from `Constants.expoConfig?.version` and the running
  EAS Update's id (`Constants.manifest2`, read through a runtime type guard
  rather than trusted — see the trap below), falling back to `"local"`. This
  app has no `expo-updates` dependency yet, so `dist` is always `"local"`
  today; the read is written to become correct the moment that changes,
  rather than needing a second change later.
- `beforeSend`/`beforeBreadcrumb` scrub every string field an event or
  breadcrumb can carry, and **delete `user`/`request` outright** rather than
  redacting them field-by-field. Deleting is the safer default here: a
  redaction rule can miss a shape Sentry's own instrumentation attaches, an
  absent field cannot leak anything by definition.
- Nothing in the codebase calls `Sentry.setUser` or reads a device-ID API
  (`expo-application`, `expo-device`, or equivalent). This is enforced by
  omission — there is no code to flag — and called out in a comment in
  `crash-reporter.ts` so it is not "helpfully" added back later.
- `captureException`/`captureMessage`/`addBreadcrumb` each redact their own
  `context` argument before forwarding, as a second layer alongside the
  `beforeSend`/`beforeBreadcrumb` scrub — belt and suspenders, not either one
  alone.
- Every SDK call is wrapped in `try`/`catch` that swallows. A crash reporter
  that can crash the app it is reporting from has stopped being a safety net.

### Error boundaries match Expo Router's actual export contract, not React's

Expo Router does not want a `children`-wrapping class component from
`ErrorBoundary`. It catches the render error itself
(`expo-router/build/views/Try.d.ts`) and renders whatever a route file
exports as `ErrorBoundary`, calling it as a **function component** with
`{ error, retry }`. `SuspenseFallback` is the same shape: a function
component, no `children`. `src/core/monitoring/error-boundary.tsx` matches
that contract exactly — `ErrorBoundary({ error, retry, reporter })` reports
once per distinct error via a `useEffect` keyed on `error` (not during
render, which can re-run before `retry` is called), renders a neutral
`testID="error-screen"`, and wires its "Try again" action to `retry()`.
`src/app/_layout.tsx` re-exports both, staying a one-line route file per
AGENTS.md.

`reporter` defaults to the real crash-reporter singleton so `_layout.tsx`
needs no wiring, and is overridable so every test constructs its own mock and
never touches the real SDK.

`error-boundary.tsx` builds its screen from `View`/`SafeAreaView` directly
rather than `@/ui/Screen` — `core -> ui` is not an allowed dependency
direction (`core -> utils, theme, types` only), so a `core` file cannot
import a `ui` primitive even though it would otherwise be the obvious choice.

## Consequences

### Good

- Redaction is structurally guaranteed on every path a message or context
  value can take to leave the device — logger, crash reporter, and the
  scrubbing hooks all apply it independently.
- Crash reporting is genuinely inert with no DSN, in every variant, which
  matches how `.env.example` ships it (empty) and how the checklist item that
  provisions the real DSN is still outstanding.
- The error screen and its tests exercise the actual contract Expo Router
  calls, not an assumption about how error boundaries "usually" work.

### Bad

- `@sentry/react-native/metro`'s `withSentryConfig` (Debug IDs, tighter
  source-map correlation) is not wired into `metro.config.js`. It broke
  `npx expo export -p ios` with `TypeError: Cannot read properties of
undefined (reading 'match')`, thrown from inside Sentry's Metro serializer
  once it processes the real module graph — not from `withSentryConfig`
  itself, which returns cleanly. Source maps still upload and still work via
  the release/dist tag; Debug IDs are a nicer correlation on top, not a
  requirement. Tracked in `docs/SETUP_CHECKLIST.md` to revisit against a
  future `@sentry/react-native` release.
- `Constants.manifest2`'s type resolves to `any` here (its declared type
  comes from `expo-manifests`, which is not an installed package — this app
  has no `expo-updates` dependency), so `currentUpdateId()` in
  `crash-reporter.ts` reads it back out through an explicit runtime type
  guard instead of a typed field access. Revisit if `expo-updates` is ever
  adopted; the type may resolve properly once that package is present.

### Neutral

- The DSN, the Sentry auth token, and confirming source-map upload are all
  checklist items — none of them can be provisioned from this repo. See
  `docs/SETUP_CHECKLIST.md`, "Crash reporting (Sentry)".

## Alternatives considered

| Option                                                                    | Why not                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gate crash reporting on `variant === "production"` instead of the DSN     | A preview build with a DSN set would never report, and a production build someone forgot to configure would silently also never report — DSN presence is the only signal that is actually true about whether reporting can work.                                  |
| Redact `user`/`request` field-by-field like other context                 | These are exactly the fields most likely to carry an identifier Sentry's own instrumentation attaches without being asked; deleting them outright cannot miss a shape a redaction rule was not written for.                                                       |
| Wire `withSentryConfig` into Metro anyway, accepting the export break     | An export that cannot run in production is a worse trade than losing Debug ID correlation; release/dist still ties an event to a build.                                                                                                                           |
| A `children`-wrapping class `ErrorBoundary`, matching React's own pattern | Expo Router does not call it that way — it renders the exported component with `{ error, retry }` itself, having already caught the error via its own internal `Try` component. A children-wrapping class would simply never receive props from Router correctly. |

## Verification

- `npm run validate` passes; coverage for `src/core/monitoring/**` is 100%
  statements/functions/lines, well above the 80% global branch floor.
- `npx expo export -p ios --no-bytecode` (production, minified, not
  Hermes-compiled so it stays greppable) contains zero executable
  `console.*` calls originating from `src/` — the one textual match is a
  string literal inside `@sentry-internal/replay`'s bundled web worker
  source, not a call site.
- `npx expo config --type prebuild` confirms the Sentry plugin applies
  without disturbing `usesNonExemptEncryption` or the App Attest entitlement.
- Tests assert `Sentry.init` is never called with no DSN, `Sentry.setUser` is
  never called at all, and a planted credential-shaped string never survives
  `beforeSend`/`beforeBreadcrumb`/the context redaction path.
