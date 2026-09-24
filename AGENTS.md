# AGENTS.md — rules for every coding agent on SundayBest

Canonical rulebook. `CLAUDE.md` imports this file. Facts live in
[docs/PROJECT.md](docs/PROJECT.md); this file is the rules.

## Expo has changed

Read the exact versioned docs at <https://docs.expo.dev/versions/v57.0.0/>
before writing any code. Assume anything you remember about Expo is out of date.

## Product constraints

- **iOS only, iPhone only.** No Android, no web, no iPad.
- **Free.** No purchases, no subscriptions.
- **No accounts, no sign-in.**
- **No ads. No tracking** — no analytics SDKs, no IDFA, no third-party telemetry.
- The app ships as **SundayBest**. The name is settled; do not reopen it.

## Commands

| Command                                   | Use                                                          |
| ----------------------------------------- | ------------------------------------------------------------ |
| `npm run validate`                        | The gate: typecheck, lint, format:check, knip, tests, doctor |
| `npm run typecheck`                       | `tsc --noEmit`                                               |
| `npm run lint` / `lint:fix`               | ESLint                                                       |
| `npm run format` / `format:check`         | Prettier                                                     |
| `npm run test` / `test:watch` / `test:ci` | Jest; `test:ci` enforces coverage                            |
| `npm run test:related <files>`            | Tests related to specific files                              |
| `npm run knip:check`                      | Unused files, exports, dependencies                          |
| `npm run check:env`                       | `.env*` files against the app's own schema                   |
| `npm run ios` / `npm run start`           | Dev server (both set `APP_VARIANT=development`)              |
| `npm run dev:mcp`                         | Dev server with Expo MCP local capabilities                  |
| `npm run icons`                           | Regenerates the placeholder variant icons                    |
| `/update-report`                          | Re-audits the setup series into `Before-You-Start.html`      |

Install Expo SDK packages with `npx expo install`. Pin exact versions (no `^`,
no `~`) for everything else. Use npm, and `npx` where another runner would be used.

## Architecture and dependency rules

Feature-sliced; see [ADR 0001](docs/adr/0001-feature-sliced-architecture.md) and
each folder's README.

```
app -> features -> ui, core, hooks, utils, theme, types
core -> utils, theme, types
ui / hooks -> utils, theme, types
utils -> types
```

- `src/app/` holds routes only: one-line re-exports of feature screens. No logic,
  no tests.
- A feature slice is reachable **only** through its `index.ts`.
- `ui`, `hooks`, and `utils` never import `features`, `core`, or `app`.
- `src/utils` is pure: no React, no I/O.
- **Every side-effect SDK import lives in `src/core`** — secure storage, app
  integrity, networking, crash reporting, analytics. Wrap it there in a narrow
  typed API and import that.

ESLint enforces all of this. Do not "fix" the boundaries config without reading
the traps recorded in [docs/PROJECT.md](docs/PROJECT.md).

## Configuration

`app.config.ts` is the app config; there is no `app.json`. `APP_VARIANT`
(`development` | `preview` | `production`) picks the name, bundle ID, and icon,
defaulting to `development`. Read
[ADR 0004](docs/adr/0004-configuration-and-environments.md) and the config traps
in [docs/PROJECT.md](docs/PROJECT.md) before touching it.

- **Runtime config is `@/core/config/env`**, parsed with Zod and frozen. Never
  read `process.env` elsewhere, and never dynamically — only literal
  `process.env.EXPO_PUBLIC_X` survives Expo's Babel transform.
- **A new variable** means: the schema, a test, a row in `.env.example`, and a
  name in `src/types/expo-public-env.d.ts`.
- **Flags go through `@/core/config/flags`**, derived from `Env`, and only when
  something reads them.
- `EXPO_PUBLIC_` values ship inside the app and anyone can read them. They are
  configuration, never secrets.

## TDD rules

Non-negotiable, and in this order:

1. **Write the failing test first, and show it failing.** A test you have not
   watched fail proves nothing — it may assert the wrong thing, or nothing.
2. **Smallest change that makes it pass.** No extra abstraction, no speculative
   options, no adjacent refactors.
3. **Refactor only while green.** Run the tests before and after; if they are
   red, you are debugging, not refactoring.

New behavior needs a test that fails first. Bug fixes start with a test that
reproduces the bug. See [ADR 0002](docs/adr/0002-testing-strategy.md).

## Conventions

- If the UI requires an installed package, and its sensible, then just add the package and do what the design calls for.

- **`src/utils`**: one exported function per file, file named after it matching
  its casing (`redaction/redactSensitive.ts`). No barrel files.
- **Named exports everywhere.** `src/app/**` is the only exception, because Expo
  Router discovers routes by default export.
- **Zod at every boundary.** Anything crossing into the app — network responses,
  deep-link params, stored values, env config — is parsed, not cast. `as` on
  untrusted data is a bug.
- **A `testID` on every interactive element**, and on any element a test needs to
  find. Forward `testID` through wrapper components.
- Components in `PascalCase.tsx`, hooks and plain modules in `kebab-case.ts`.
- **Pure functions by default.** Domain rules, derivations, and formatting live
  in a slice's `logic/` folder (or `src/utils` if truly shared), not in JSX.
  Components render and wire events; side effects live in hooks or `src/core`.
- **Tests never live in `src/`.** Every test, helper, mock, and fixture is under
  `tests/`, mirroring `src/` (`src/ui/Screen.tsx` →
  `tests/ui/Screen.test.tsx`). See
  [ADR 0011](docs/adr/0011-tests-in-a-mirrored-tests-tree.md).

## Security never-dos

- **Never** put a secret in code, a committed file, or an `EXPO_PUBLIC_*`
  variable. Anything `EXPO_PUBLIC_` is compiled into the bundle and readable by
  anyone with the app.
- **Never** read, print, or invent real credentials. `.env.example` placeholders
  only. If a step needs credentials, an account action, or a paid plan: stop,
  ask, and add it to [docs/SETUP_CHECKLIST.md](docs/SETUP_CHECKLIST.md).
- **Never** store sensitive data outside secure storage. No tokens or personal
  data in AsyncStorage, plain files, or Redux persistence.
- **Never** import a side-effect SDK outside `src/core`.
- **Never** log user or device data. Route logging through
  `src/core/monitoring` and redact with `@/utils/redaction/redactSensitive`
  first.
- **Never** disable a lint or security rule without an ADR. No blanket
  `eslint-disable`; a single-line disable needs a reason on the line above, and
  turning a rule off project-wide needs an ADR explaining what replaces it.

## Definition of done

A change is done when all of these hold:

- [ ] `npm run validate` passes.
- [ ] New behavior has a test that was seen to fail first.
- [ ] Coverage thresholds hold: 80% global, 95% in `src/utils/**` and
      `src/core/security/**`.
- [ ] Dependency rules pass without new exceptions.
- [ ] No new `TODO` without an issue link, and no dead code (knip is clean).
- [ ] Anything a human must do is in `docs/SETUP_CHECKLIST.md`.
- [ ] Docs updated when behavior changed: the folder README, `docs/PROJECT.md`,
      or a new ADR for a decision.
- [ ] Work is **left uncommitted**, with a summary of what changed. Committing
      is the user's call — see the working agreement.

## Working agreement

- **Verify against current docs, never memory.** Check every version, API, and
  config key against the Expo MCP server or the Expo skills / versioned docs
  before writing code.
- **Install Expo SDK packages with `npx expo install`;** pin exact versions for
  everything else.
- **Use npm** for installs and scripts, and `npx` wherever another package
  runner would be used.
- **Never read, print, or create real secrets** (see above).
- **Finish every task by running its verification steps**, then stop and report.
- **Never commit, stage, or push on your own initiative.** Leave the work in the
  working tree and say what changed. Commit only when asked in that same turn,
  and a standing instruction in a prompt template does not count as asking — the
  user reviews the diff first. When asked, use a
  [Conventional Commit](https://www.conventionalcommits.org/) scoped to one
  logical change.
- **Report honestly.** If a step was skipped or a check failed, say so with the
  output. Do not claim a verification you did not run.

## UI and design system

`src/theme/` is the source of truth for reusable visual decisions.

For every UI creation or update:

1. Inspect the existing theme, tokens, typography, colors, spacing, radii, and shared UI components first.
2. Reuse the existing system whenever possible.
3. If the work introduces a reusable visual value, pattern, component behavior, or interaction that does not exist yet, add it to the appropriate design-system layer first.
4. Then apply it to the feature component or screen.
5. Keep truly one-off composition geometry local.

Do not hardcode reusable colors, typography, spacing, radii, or motion into feature components.

Prefer semantic theme values such as `theme.colors.*` over raw palette values when the value represents UI meaning.

Any new theme-dependent semantic value must support both light and dark themes.

Do not globally scale UI or typography from a reference screen width. Use flexible React Native layout and responsive behavior only where the available space requires it.

When UI work establishes a lasting convention, persist that convention in the appropriate source of truth so future agents do not need conversation history to understand it.

The expected flow is:

theme/design system → shared primitive or variant → feature component → screen

`marketing/SundayBest-screens/` is the source of truth for how screens should look

- Only use lucide-react-native icons
- Only use our theme, or add to it
- Only use our text-based logo mark
- Do not animate anything unless directed
- Always use atomic design principles
- Always use the following practices when possible:
- Pure components
- Single use functions
- Abstracted business logic (utils, feature files w/business logic, etc)
- Files that are too large should probably be broken up

## API, data flow, fetching, state, and middleware

Data flow must be predictable, typed, testable, and one-directional.

The default flow is:

```text
external source
→ src/core transport
→ boundary validation
→ feature data layer
→ domain logic
→ query/cache or feature state
→ hook
→ component
→ user event
→ mutation/action
→ state/cache update
→ render
```

Do not skip layers by fetching, parsing, transforming, or implementing business
rules directly inside screen components.

### Data ownership

`src/core` owns mechanisms. Features own domain meaning.

For network-backed features:

```text
src/core/network
  transport
  timeouts
  cancellation
  generic errors
  middleware

src/features/<feature>/data
  endpoint calls
  Zod response schemas
  DTO → domain mapping

src/features/<feature>/logic
  pure domain rules
  state transitions
  derivations

src/features/<feature>/hooks
  React/query orchestration

src/features/<feature>/components
  rendering
  user events

src/features/<feature>/screens
  composition
```

`src/core/network` must not become a repository of feature endpoints.

A feature may depend on `core`.

`core` must never depend on a feature.

---

### Server state, application state, and UI state are different

Do not treat all state as the same kind of state.

**Server/external state** is data whose source of truth exists outside the current
React render tree.

Examples:

- API responses
- remote content
- request status
- cached network data

**Application/domain state** is state controlled by the application.

Examples:

- current workflow state
- selected options
- drafts that must survive navigation
- locally managed domain state

**Ephemeral UI state** belongs as close to the component as possible.

Examples:

- whether a modal is open
- focused input
- temporary disclosure state
- animation state

Rules:

- Do not copy server state into a global client store merely to make it global.
- Do not put ephemeral component state into global state.
- Do not duplicate the same authoritative value in multiple stores.
- If a value can be derived from existing state, derive it instead of storing it.
- Keep state at the narrowest scope that satisfies its consumers.
- Introduce global state only when ownership genuinely crosses feature or
  navigation boundaries.
- Do not add a state-management library unless the existing architecture
  requires it or an ADR approves it.

---

### Networking boundary

All actual network I/O goes through the networking layer in `src/core`.

Feature components and hooks must never call `fetch`, Axios, or another HTTP
client directly.

The intended structure is:

```text
src/core/network
→ transport concerns

src/features/<feature>/data
→ feature-specific requests
→ boundary schemas
→ mapping

src/features/<feature>/logic
→ pure domain rules and derivations

src/features/<feature>/hooks
→ orchestration for React

src/features/<feature>/components
→ rendering and user events

src/features/<feature>/screens
→ composition
```

`src/core/network` may own:

- base URL handling
- request construction
- standard headers
- timeouts
- cancellation
- response decoding
- transport-level retries
- normalized transport errors
- safe monitoring hooks

It must not know feature-specific business rules.

Feature-specific endpoints, response schemas, mapping, and domain meaning belong
to the owning feature.

Do not create one giant application-wide `api.ts`.

---

### API contracts

Treat every network response as untrusted input.

Never write:

```ts
const data = (await response.json()) as SomeType;
```

Never rely on TypeScript types to validate runtime network data.

Instead:

1. Receive unknown data.
2. Parse it with Zod.
3. Reject invalid data.
4. Map the validated transport shape into the application's domain shape when
   those shapes differ.
5. Expose only validated typed data to the rest of the feature.

Keep transport types and domain types separate when they represent different
concepts.

An API response changing must not silently corrupt application state.

Avoid leaking raw API response objects throughout the UI.

---

### Request functions

Request functions must be small and single-purpose.

Prefer functions conceptually shaped like:

```ts
getThing(input, options);
createThing(input, options);
updateThing(input, options);
```

over generic APIs with many modes or boolean flags.

Inputs and outputs must be typed.

Do not accept entire React component objects or UI state when a request only
needs a few explicit values.

Request functions must not:

- navigate
- display alerts
- mutate React state
- know about components
- contain presentation logic

They return data or a typed error/result and let the calling layer decide what
the UI should do.

---

### Fetch lifecycle

Every asynchronous request must account for:

- idle
- loading/pending
- success
- empty result where meaningful
- recoverable error
- terminal error where meaningful
- cancellation when the consumer no longer needs the result

Do not assume success.

Do not use `finally` or an unconditional state update in a way that lets an old
request overwrite a newer request.

Where a request can become stale because its inputs changed, cancel it or ignore
its stale result.

Pass `AbortSignal` through the request stack when cancellation is supported.

Do not leave requests running solely because the component that started them
unmounted.

---

### Request identity

The identity of fetched data must be based on every input that changes the
result.

For example, if data depends on:

- resource ID
- page
- filter
- sort
- locale

then those values must participate in its request/cache identity.

Never reuse cached data under a key that does not uniquely represent the
request.

Request/cache keys must be deterministic and serializable.

Centralize key construction when a query/cache library is used.

---

### Caching

Do not implement ad hoc caches inside components.

If the project has an approved server-state/query library, use its cache rather
than creating a second cache.

Cache according to the semantics of the data, not arbitrary numbers copied from
another feature.

Define deliberately:

- when data becomes stale
- when data should be refetched
- when cached data can be reused
- what mutations invalidate or update it

Do not invalidate the entire application cache when only one resource changed.

Prefer the narrowest correct invalidation.

Do not permanently cache failures as successful data.

---

### Request deduplication

Identical concurrent reads should share work when the approved networking/query
layer supports it.

Do not create multiple independent requests for the same resource because
several components need it.

Move ownership upward or use the approved query/cache mechanism.

---

### Retries

Retries must be deliberate.

Never retry every failure automatically.

Do not automatically retry:

- validation failures
- malformed responses
- most 4xx client errors
- operations that could duplicate a non-idempotent side effect unless the API
  explicitly makes retrying safe

Transient network failures and appropriate server failures may be retried when
the operation is safe.

Retries must be bounded.

Where repeated retries are appropriate, prefer backoff with jitter rather than
tight retry loops.

The UI must eventually receive a real failure state.

Never create infinite retry behavior.

---

### Timeouts

Network operations must not be allowed to wait forever.

Use the centralized networking layer's timeout/cancellation mechanism.

Timeouts are transport failures and must be represented through the normalized
error model rather than string matching inside components.

---

### Error model

Normalize transport failures before they reach UI code.

Do not make components interpret arbitrary exception strings.

Errors should preserve enough typed information to distinguish cases such as:

```ts
type NetworkErrorKind =
  | "offline"
  | "timeout"
  | "cancelled"
  | "invalid-response"
  | "client-error"
  | "server-error"
  | "rate-limited"
  | "unknown";
```

Do not expose raw backend error payloads directly to users.

User-facing error copy belongs to the feature/UI layer.

Preserve the original cause internally when useful for debugging, but never log
sensitive request or response data.

---

### Middleware and interceptors

Networking middleware must live in `src/core`.

Middleware is for cross-cutting transport concerns only.

Appropriate middleware concerns include:

- standard headers
- request IDs that contain no user/device identity
- timeout/cancellation
- safe retry behavior
- response decoding
- normalized errors
- redacted monitoring

Middleware must not:

- contain feature business logic
- navigate
- show UI
- mutate feature state
- silently change domain data
- swallow errors
- inspect React components
- create hidden global dependencies

Middleware order must be deterministic and documented when order affects
behavior.

Prefer a small explicit request pipeline over a large interceptor system with
hidden behavior.

---

### State ownership

Every piece of state has one authoritative owner.

Do not create multiple independently mutable copies of the same state.

When deciding where state belongs, use this order:

```text
Can it be derived?
→ derive it

Is it local to one component?
→ local component state

Is it shared by a small component subtree?
→ lift it to the nearest common owner

Is it feature-wide?
→ feature state

Is it external/server state?
→ query/cache layer

Does it genuinely cross unrelated features?
→ approved application-level state
```

Do not jump directly to global state.

---

### State updates

State updates must be immutable and deterministic.

When the next value depends on the previous value, use a functional update,
reducer, or equivalent mechanism that receives the current state.

Do not read a captured value and assume it is still current across an async
boundary.

Avoid:

```ts
setCount(count + 1);
```

when correctness depends on the latest value.

Prefer:

```ts
setCount((current) => current + 1);
```

For related domain transitions, prefer one explicit action/reducer transition
over several unrelated state setters.

A domain operation should not temporarily create impossible state merely because
several setters run separately.

---

### State machines and workflows

Multi-step workflows must have explicit states and legal transitions.

Prefer:

```ts
type Status = "idle" | "loading" | "ready" | "submitting" | "success" | "error";
```

over combinations such as:

```ts
isLoading;
isReady;
isSubmitting;
hasError;
isDone;
```

when those booleans can contradict one another.

If a workflow has meaningful transition rules, put them in feature logic or a
reducer and test them independently from the UI.

Components dispatch intent.

Components must not manually coordinate chains of domain-state mutations.

---

### Derived state

Do not store values that can be calculated reliably from authoritative state.

Prefer:

```ts
const completedCount = items.filter((item) => item.completed).length;
```

over maintaining both:

```ts
items;
completedCount;
```

as separately mutable state.

Common derived values include:

- counts
- percentages
- filtered collections
- sorted collections
- completion state
- display labels
- whether an action is available
- current workflow step
- remaining item counts

Put non-trivial derivations in pure feature logic and test them.

Memoization is a performance optimization, not a correctness mechanism.

Do not add memoization without a reason.

---

### Mutations

A mutation has one owner and one defined lifecycle.

The preferred flow is:

```text
user intent
→ feature action/mutation
→ validated request
→ successful response
→ update/invalidate authoritative state
→ derived UI rerenders
```

Do not update several unrelated stores manually after the same mutation if one
authoritative update can drive the rest through derivation.

After a successful mutation, either:

- replace/update the exact authoritative cached value
- invalidate the narrowest affected data and refetch

Choose one intentionally.

Do not mutate cached objects in place.

---

### Optimistic updates

Use optimistic updates only when they materially improve the interaction and
rollback behavior is well-defined.

Every optimistic update must define:

1. previous state snapshot
2. optimistic state
3. success reconciliation
4. failure rollback

Do not use optimistic updates for operations where showing unconfirmed success
could materially mislead the user.

Do not leave optimistic state in place after the operation is rejected.

---

### Race conditions

Assume async work can finish out of order.

Code must remain correct when:

- the user taps twice
- navigation changes during a request
- request B finishes before request A
- a component unmounts
- connectivity changes
- the same mutation is attempted repeatedly

Disable or deduplicate duplicate submissions when duplicate execution is not
valid.

Do not use arbitrary delays to solve race conditions.

Do not allow an older request to overwrite newer authoritative state.

---

### Effects

`useEffect` is for synchronization with something outside React.

It is not a general-purpose business-logic engine.

Do not use effects to:

- derive state from other state
- respond to ordinary button presses
- chain application business logic that belongs in an event handler/action
- copy props into state without a concrete synchronization requirement

Prefer:

```text
user event
→ explicit handler/action
→ state transition
```

over:

```text
user event
→ set flag
→ effect notices flag
→ performs operation
→ another effect notices result
```

Effects must have correct dependencies.

Do not suppress hooks dependency rules to force an effect to run the way you
want.

---

### Hooks

Hooks orchestrate React-facing behavior.

A feature hook may:

- invoke feature data functions
- invoke approved query/mutation primitives
- expose loading/error/data state
- dispatch domain actions
- compose pure feature logic

A hook should not become a miscellaneous service layer.

If logic can be pure, move it out of the hook.

If logic performs transport I/O, move the transport portion to the data/core
layer.

If a hook becomes difficult to test because it does too many unrelated things,
split responsibilities.

---

### Forms and drafts

Keep temporary form input local unless it must survive navigation or be shared.

Do not write every keystroke into global application state without a concrete
reason.

Validate at the appropriate boundaries:

```text
UI validation
→ immediate user feedback

domain validation
→ business rules

Zod boundary validation
→ external/untrusted data
```

Do not confuse UI validation with trust-boundary validation.

---

### Persistence

Persistence is not application state management.

Persist only data that actually needs to survive process termination.

Do not persist an entire global store by default.

Persist the smallest necessary representation and reconstruct derived values on
load.

All persisted values are untrusted when read back and must be parsed with Zod.

Version persisted structures when future migrations may be necessary.

Never store sensitive data outside the approved secure-storage abstraction.

---

### Offline behavior

Do not invent offline synchronization semantics accidentally.

If a feature must work offline, explicitly define:

- what is readable offline
- what is writable offline
- whether writes are queued
- conflict behavior
- retry behavior
- how stale data is communicated
- what happens when connectivity returns

Until that behavior is intentionally designed, a failed network operation must
remain a failed operation rather than being silently treated as synchronized.

---

### Pagination

For paginated data:

- pagination state belongs with the query/data owner
- do not append duplicate records
- preserve stable item identity
- distinguish initial loading from loading more
- prevent concurrent duplicate page requests
- stop requesting when the source reports no next page

Cursor pagination must treat the server cursor as opaque.

Do not manufacture cursor values client-side.

---

### Data transformation

Transform data once at the appropriate boundary.

Prefer:

```text
API response
→ validated DTO
→ domain model
→ view derivation
```

Do not repeatedly reshape the same API object independently in multiple
components.

Formatting that exists only for presentation may remain in UI-facing pure
logic.

Business meaning belongs in feature/domain logic.

---

### Collections and identity

Entities must have stable identity.

Use stable IDs from the authoritative source when available.

Never use array indexes as domain identity.

State updates to collections should target entity identity, not visual position.

Avoid maintaining multiple independently mutable copies of the same entity.

---

### Secrets and request data

No secret may be shipped in the client.

An API key placed in:

- source code
- app config
- an `EXPO_PUBLIC_*` variable
- a bundled asset

is public.

Do not solve a server-side trust requirement by hiding a credential in the
mobile app.

Never log:

- request bodies containing user data
- sensitive response bodies
- secrets
- authorization values
- secure-storage values

All permitted network diagnostics must go through the existing monitoring and
redaction rules.

---

### Testing data flow

Test behavior at the narrowest useful layer.

```text
Pure domain logic
→ unit test

Zod boundary
→ valid and invalid payload tests

Feature data function
→ transport success
→ normalized failure
→ malformed response
→ cancellation where relevant

Reducer/state machine
→ legal transitions
→ illegal transitions
→ repeated actions

Hook
→ orchestration behavior when that behavior cannot be tested more simply below
  the hook

Screen
→ user-visible behavior and wiring
→ not implementation details
```

For every mutation, test the resulting authoritative state rather than merely
asserting that a setter or internal function was called.

For asynchronous behavior, test:

- success
- failure
- malformed data
- repeated execution where relevant
- stale/out-of-order completion where relevant

Do not make tests depend on real production APIs.

---

### Performance

Correctness first.

Measure before optimizing.

Avoid:

- fetching the same data independently in many components
- unnecessary global subscriptions
- selectors that create new large objects on every render without need
- cascading state updates
- storing large duplicated response objects
- unnecessary serialization/deserialization
- premature memoization everywhere

Subscribe components to the smallest state they actually need when the chosen
state library supports selectors.

For large lists, preserve stable keys and data identity so React Native can
reuse rows correctly.

Do not optimize based on assumptions when performance can be measured.

---

### Adding a data/state dependency

Do not install a networking, server-state, state-management, persistence, or
middleware library merely because it is familiar.

Before adding one:

1. Inspect what the project already uses.
2. Verify compatibility with the exact Expo version.
3. Identify the concrete problem it solves.
4. Determine whether the existing platform or architecture already solves it.
5. Write the failing behavior test where applicable.
6. Add the smallest dependency that solves the demonstrated problem.
7. Document an architecture-level choice in an ADR when it establishes a new
   project-wide convention.

Do not maintain two libraries that solve the same state/data problem without an
explicit architectural reason.

---

### Data-flow never-dos

Never:

- call network APIs directly from components
- call network APIs directly from screens
- trust `response.json()` without runtime validation
- cast untrusted data with `as`
- duplicate authoritative server state into unrelated stores
- store easily derived values as separate authoritative state
- mutate state or cached data in place
- use `useEffect` as a substitute for event handling
- hide feature business logic inside networking middleware
- retry unsafe mutations blindly
- create infinite retries
- swallow request errors
- allow an older request to overwrite newer data
- use arbitrary `setTimeout` calls to fix async ordering
- persist the entire application state by default
- introduce global state for local UI concerns
- use array indexes as domain identity
- put API secrets in the mobile bundle
- log sensitive request or response data
- create feature-specific endpoint logic in `src/core/network`
- add a data/state library without checking the existing architecture first
- create a second cache for data already owned by an approved query/cache layer
- manually synchronize duplicated state when the value can be derived
- suppress hook dependency rules to work around incorrect effect design

```

```
