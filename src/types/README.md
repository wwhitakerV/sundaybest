# src/types — global and ambient types

Types with no natural owner: ambient declarations, module augmentation, and
shared primitives used across layers.

## Belongs here

- `*.d.ts` ambient declarations (env vars, untyped modules, asset imports).
- Branded primitives and other genuinely cross-cutting types.

## Never goes here

- Types owned by one feature — those go in that slice's `types.ts`.
- Runtime code. This folder should contain types only.

## May import

`@/types` only.
