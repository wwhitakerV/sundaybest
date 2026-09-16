# ADR 0001 — Feature-sliced architecture with lint-enforced boundaries

- **Status:** Accepted
- **Date:** 2026-09-15
- **Deciders:** @wwhitakerv

## Context

SundayBest is a security-first iOS app. Two properties matter more than they
would in a typical app:

1. **The side-effect surface must be small and auditable.** Secure storage, app
   attestation, integrity checks, networking, and crash reporting are the parts
   that carry risk. If any screen can import the keychain SDK directly, answering
   "what can this app reach?" means reading the whole codebase.
2. **Features must be independently removable.** The product constraints in
   `docs/PROJECT.md` (no accounts, no ads, no tracking) will be revisited, and
   capabilities will come and go.

A conventional `components/ hooks/ utils/` layout satisfies neither: it spreads a
single capability across four folders and gives side effects no home.

## Decision

We slice by feature and enforce the dependency direction in ESLint.

```
src/app/       Expo Router routes: one-line re-exports of feature screens
src/features/  vertical slices; index.ts is the only public entry point
src/core/      every side effect (api, security, storage, config, monitoring)
src/ui/        design-system primitives
src/hooks/     shared hooks
src/utils/     pure functions
src/theme/     design tokens, light and dark
src/types/     global and ambient types
```

Allowed direction:

```
app -> features -> ui, core, hooks, utils, theme, types
core -> utils, theme, types
ui / hooks -> utils, theme, types
utils -> types
```

Four rules carry the weight:

- **`boundaries/dependencies`** enforces the layer graph above.
- **`no-restricted-imports`** confines a slice's internals to its `index.ts`, so
  `@/features/other/screens/Thing` is an error while `@/features/other` is fine.
- **`no-restricted-imports`** confines side-effect SDKs (secure storage, app
  integrity, networking, crash reporting, analytics) to `src/core`. The list is
  populated ahead of installing those packages so a later change cannot quietly
  wire one into a screen.
- **`no-restricted-imports`** keeps `src/utils` pure: no React, no I/O, no
  reaching back into the app.

## Consequences

### Good

- "What can this app reach?" is answered by reviewing `src/core` alone.
- A feature is one folder to read, and one folder to delete.
- The architecture is executable. It fails CI rather than eroding through review
  fatigue.

### Bad

- More indirection for small changes: a new screen touches the slice and a route
  re-export.
- `_template/` must be kept current by hand, or it decays into a misleading
  example.
- The shared layers (`ui`, `hooks`, `utils`) cannot use `core`, so anything
  needing a side effect has to be injected by the caller. That is the point, but
  it is friction.

### Neutral

- `src/app` is the only place default exports are allowed, because Expo Router
  discovers routes by default export.

## Alternatives considered

| Option                                           | Why not                                                                                                                                                                                      |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layer-first (`components/`, `hooks/`, `utils/`)  | Spreads one capability across many folders; gives side effects no single home.                                                                                                               |
| Feature slices documented but unenforced         | Conventions without a gate decay. We wanted the graph to fail CI.                                                                                                                            |
| Nx / module federation                           | Far too much machinery for a single iPhone app with no accounts.                                                                                                                             |
| `boundaries/entry-point` for the index-only rule | It also governs a slice's own internal imports, so a slice importing `./screens/Thing` would trip it. `no-restricted-imports` on path patterns is precise and leaves relative imports alone. |

## Verification

`npm run validate` runs the lint gate. The rules were proven by committing five
deliberately illegal imports, confirming lint failed with 15 errors, and deleting
them:

| Violation                                            | Rule that caught it       |
| ---------------------------------------------------- | ------------------------- |
| `src/utils` importing `react`, `fs`                  | `no-restricted-imports`   |
| `src/ui` importing `@/core` and `@/features/home`    | `boundaries/dependencies` |
| `src/hooks` importing `@/core`                       | `boundaries/dependencies` |
| a slice importing `@/features/_template/store`       | `no-restricted-imports`   |
| `expo-secure-store` / `@sentry/*` outside `src/core` | `no-restricted-imports`   |

**This proof was not ceremony.** The boundaries rule was initially configured
with file-path patterns (`src/ui/**/*`). Those match the _containing folder_,
which needs an extra path segment, so nothing matched, every file fell through as
an unrecognised element, and the rule reported zero errors while enforcing
nothing. Only the deliberate violations exposed it. The elements are now folder
patterns (`src/ui`), which is why `docs/PROJECT.md` warns against "fixing" them.
