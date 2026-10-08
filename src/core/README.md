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
storage/      local persistence, incl. the encrypted database
config/       environment and runtime config
monitoring/   logging, crash and error reporting
providers/    app-wide React providers (AppProviders)
fonts/        font loading
haptics/      haptic vocabulary (selection, tap, outcomes) and the entrance buzz
accessibility/ OS accessibility settings (Reduce Motion) and VoiceOver announcements
links/        opens allowed outside links (Bible passages) in an in-app Safari sheet
notifications/ local-notification permission and SundayBest reminder scheduling
mock-data/    connected mock records for every screen, as `AppData` (see below)
store/        legacy/mock-backed Plans/Study/Fun state while those slices migrate (see below)
plan-builder/ builds plans from sermon links, in the frontend for now (see below)
```

## `haptics/`

The app's haptic vocabulary over `expo-haptics`: `selectionFeedback`,
`tapFeedback`, `successFeedback`, `warningFeedback`, and `errorFeedback`. Each swallows a rejection (a simulator, a device
without a Taptic Engine), so a haptic never breaks what it decorates; iOS's own
System Haptics switch turns them off. Where each is used is in
`.claude/rules/ui.md`.

## `plan-builder/`

Legacy deterministic fixtures from the pre-API plan-generation prototype. They
are no longer mounted in `AppProviders`; production plan creation is exclusively
the server-side generation flow in `core/api` + the API worker. Keep these files
only while older store-level tests still import them, then delete the directory
with those tests in one cleanup change.

## `store/`

The legacy source of truth for the slices that are still mock-backed — React Context +
`useReducer`, no library. Server-owned user/settings/reminder state now lives in
TanStack Query through `core/api`; do not copy API responses back into this store.
`AppStoreProvider` (mounted in `AppProviders`) holds
`AppState`: normalized tables of facts, starting from `mock-data/`. Read it
with `useAppSelector(selector)`; change it only through `useStoreActions()`
(`createAndBuildPlan`, `finishPlanDay`, `submitQuizAnswer`, …). Components never
learn where the data came from, and never change state themselves.

- **Selectors** (`selectors/`) are pure: `(state, …args) => value`. Anything
  derivable — plan progress and percentages, remaining days, quiz scores,
  streaks, weekly counts — is a selector, never stored. Ones that depend on
  the date take it as an argument (`useToday()` supplies it).
- **Actions** (`actions.ts`) carry their own timestamps and new IDs —
  `useStoreActions` stamps them from `clock.ts` — so the reducer never reads
  the clock and stays deterministic. The reducer (`reducers/`) never mutates.
- **Transitions** (`transitions.ts`) list which way each plan, day, and build
  status may move. An impossible action — completing a locked day, taking a
  completed plan back to being built, finishing a quiz with questions
  unanswered — returns the state untouched, and completing anything twice
  changes nothing, so progress can't be counted twice.
- **One domain operation, one dispatch.** An operation that changes several
  things — finishing a day from the study (`finishPlanDay`), saving everything
  typed (`commitReflections`), making and building a plan
  (`createAndBuildPlan`), turning the reminder on at a time
  (`turnOnReminderAt`) — is one named action whose reducer
  (`reducers/operations.ts`) applies the fine-grained ones in order: one
  transition to test, and no way to fire half of it.
- **Re-renders.** Every store change re-renders every mounted reader, related
  or not. Measured on 2026-10-01 in Jest (slower than a phone): about 13 ms for
  Home, 18 ms for Plan Detail, and 13 ms for Progress per change. Changes come
  from taps, never per frame, so the provider is left as it is. If that changes,
  move to `useSyncExternalStore` with selector equality behind the same
  `useAppSelector` API.

## `mock-data/`

Stand-in data until the local database holds real records: one user, their
settings, reminders, and library, and plans in every state (draft,
generating, ready, active, completed, saved) with their days, Scripture,
reflections, prayers, and quizzes. Everything is typed with `@/types/domain`,
points at related records by ID, and is exported once, as `MOCK_DATA`, from
`@/core/mock-data`. "Today" is fixed (Wednesday 23 September 2026) so every date lines up.
Only facts are recorded; progress, streaks, and scores are worked out by the
store's selectors.

## `storage/`

`storage/database/` is the SQLCipher-encrypted local database: a narrow
`Database` port, the `expo-sqlite` adapter that keys it, and a forward-only
migration runner (`migrations.ts`, running the list in `migration-list.ts`). Its key is provisioned by
`security/database-key`, so the adapter is handed a key and never learns where it
came from.

Not "non-secret persistence" any more — the database is encrypted precisely
because it will hold things worth encrypting.

`reflection-answers.ts` keeps the reader's private reflection answers in that
database — never sent to the API — and `reflection-answer-queries.ts` reads and
writes them through TanStack Query (`useReflectionAnswers`,
`useReflectionAnswerCount`), with the cache roots a plan reset clears.

## `config/`

The only place `process.env` is read. `env-schema.ts` holds the Zod schema and
`parseEnv` (pure, so `scripts/check-env.mjs` imports it too); `env.ts` parses the
`EXPO_PUBLIC_*` variables at module scope and exports a frozen `env`;
`flags.ts` derives the feature flags from it behind `FlagSource`. See
[ADR 0004](../../docs/adr/0004-configuration-and-environments.md).

## `monitoring/`

`logger.ts` is a leveled logger (`debug`/`info`/`warn`/`error`) that redacts
every message and context value with `@/utils/redaction/redactSensitive`
before it touches anything, and never calls console in a production build —
`metro.config.js` strips `console.*` from the release bundle as a second,
independent guarantee. `crash-reporter.ts` wraps `@sentry/react-native` behind
a narrow `CrashReporter` port: a no-op whenever `EXPO_PUBLIC_SENTRY_DSN` is
unset, `sendDefaultPii: false`, every event and breadcrumb scrubbed before it
leaves the device, and no user ID or device identifier ever attached.
`error-boundary.tsx` exports `ErrorBoundary`/`SuspenseFallback` in the shape
Expo Router expects from a route file (`{ error, retry }`, not a
`children`-wrapping class — see `src/app/_layout.tsx`), reporting through the
crash reporter and rendering a neutral recovery screen. See
[docs/privacy/data-inventory.md](../../docs/privacy/data-inventory.md) for
what actually gets sent and when.

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
