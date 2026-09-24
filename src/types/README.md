# src/types — global and ambient types

Types with no natural owner: ambient declarations, module augmentation, and
shared primitives used across layers.

## Belongs here

- `*.d.ts` ambient declarations (env vars, untyped modules, asset imports).
- Branded primitives and other genuinely cross-cutting types.
- `domain/` — the app's data model: every entity (user, plans, days, sermon,
  Scripture, reflections, prayers, quizzes, progress, reminders, library, plan
  generation) and its controlled states, as types only. Entities have string
  IDs and `createdAt`/`updatedAt`, and point at each other by ID. `AppData`
  in `app-data.ts` holds them all. Import from `@/types/domain`.

## Never goes here

- Types owned by one feature — those go in that slice's `types.ts`.
- Runtime code. This folder should contain types only.

## May import

`@/types` only.
