# Architecture rules

Loaded every session. The dependency graph and layer responsibilities are in
[AGENTS.md](../../AGENTS.md); this file is the judgement calls that come up while
working inside it.

## Where does this code go?

Ask in this order and stop at the first yes:

1. Is it a **route**? `src/app/` — a one-line re-export, nothing else.
2. Does it have a **side effect** (network, keychain, filesystem, OS, crash
   reporter)? `src/core/`, wrapped in a narrow typed API.
3. Is it specific to **one capability**? That feature slice.
4. Is it a **SundayBest idea two or more features use** (a plan's wording or
   routes, a passage, a study step, a sermon)? `src/entities/<concept>/`, side-effect free and
   props-in (ADR 0017).
5. Could it appear **unchanged in a different app**? `src/ui/` for presentation,
   `src/hooks/` for behavior, `src/utils/` if it is pure.
6. Otherwise it is a **design token** (`src/theme/`) or a **type**
   (`src/types/`).

If two answers feel right, the code is doing two things — split it.

## Adding a feature slice

Copy `src/features/_template/`. Keep `index.ts` deliberately small: it is the
slice's public contract, and everything not exported there is private. Prefer
adding to a slice's `index.ts` over reaching into another slice.

## Signs you are fighting the architecture

- A `ui` or `hooks` file wants `core` → the caller should pass the data in.
- A `utils` file wants `react` → it is a hook, not a helper.
- Two slices need the same non-trivial logic → if it's a SundayBest concept,
  promote it to `entities`; if any app could use it, to `utils`, `ui`, or
  `hooks`. Do not import slice to slice for it.
- An entity wants the store → the feature reads it and passes the data in.
- You want to widen a boundary rule → write an ADR, or reconsider the design.

A lint error from `boundaries/dependencies` is a design signal, not an obstacle.
