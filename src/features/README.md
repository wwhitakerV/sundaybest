# src/features — vertical slices

One folder per user-facing capability. A slice owns its screens, components,
hooks, data access, validation, state, and types, so a feature can be understood
and deleted in one place.

## Structure

Copy `_template/` to start a slice:

```
<feature>/
  screens/     route-level components
  components/  presentational pieces used only by this slice
  hooks/       slice-specific hooks
  api/         data access for this slice
  schemas/     runtime validation (parsing at the boundary)
  store.ts     local UI state
  types.ts     types owned by the slice
  index.ts     the only public entry point
```

## Belongs here

- Everything specific to one capability.
- A deliberately small `index.ts` describing the slice's public contract.

## Never goes here

- Cross-feature helpers — promote to `@/utils`, `@/ui`, or `@/hooks` instead.
- Side effects such as secure storage, attestation, networking, or crash
  reporting. Those live in `@/core` and are reached through it.
- Deep imports into another slice. `@/features/other/screens/Thing` is blocked by
  lint; import `@/features/other` and let its `index.ts` decide what is public.

## May import

`@/ui`, `@/core`, `@/hooks`, `@/utils`, `@/theme`, `@/types`, and other features
**only** through their `index.ts`.
