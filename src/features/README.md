# src/features — vertical slices

One folder per user-facing capability. A slice owns its screens, components,
hooks, data access, validation, state, and types, so a feature can be understood
and deleted in one place.

## Structure

Copy `_template/` to start a slice:

```
<feature>/
  screens/     route-level components — composition only: read the view
               model, render components, pass handlers
  hooks/       one view-model hook per screen (store reads, route params,
               intents), plus lifecycle and animation
  components/  presentational pieces used only by this slice
  logic/       pure functions: rules, derivations, reducers, route builders
  data/        data access: request functions, Zod schemas, DTO → domain mapping
  types.ts     types owned by the slice
  index.ts     the only public entry point
```

There is no slice store: state lives at its narrowest owner (AGENTS.md "State
ownership") — local state in the component, workflow state in a `logic/`
reducer driven by the view-model hook, facts in `@/core/store`.

Create a folder only when the slice has something to put in it. `_template/`
shows the full shape; a real slice keeps just what it uses.

`logic/` is pure: no React, no Expo Router, no Reanimated, no device APIs — same
input, same output. That keeps domain rules testable without rendering anything.

## Belongs here

- Everything specific to one capability.
- A deliberately small `index.ts` describing the slice's public contract.

## Never goes here

- Cross-feature helpers — promote SundayBest concepts to `@/entities`, and
  generic code to `@/utils`, `@/ui`, or `@/hooks`.
- Side effects such as secure storage, attestation, networking, or crash
  reporting. Those live in `@/core` and are reached through it.
- Deep imports into another slice. `@/features/other/screens/Thing` is blocked by
  lint; import `@/features/other` and let its `index.ts` decide what is public.

## May import

`@/entities`, `@/ui`, `@/core`, `@/hooks`, `@/utils`, `@/theme`, `@/types`, and
other features — entities and features **only** through their `index.ts`.
