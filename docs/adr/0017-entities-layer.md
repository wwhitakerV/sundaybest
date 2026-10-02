# ADR 0017 — An `entities` layer for shared SundayBest concepts

- **Status:** Accepted. Amends [ADR 0001](./0001-feature-sliced-architecture.md).
- **Date:** 2026-09-30
- **Deciders:** @wwhitakerv

## Context

ADR 0001 gave code two homes:

- `features/` for one capability.
- `ui/`, `hooks/` and `utils/` for code any app could use unchanged.

Nothing in between held **SundayBest ideas that several features share**, so that
code ended up duplicated or in the wrong layer:

- **Hero wording.** Home's `describeActivePlan` repeated, string for string, the
  "active" branch of Plan Detail's `describePlanHero`.
- **Plan routes.** `planOverviewHref` and `studyHref` lived in the plans slice,
  and Home, Progress, Welcome and Plan Creation reached them through its
  `index.ts`.
- **Plan wording in the generic layer.** `getPlanEndsLine` sat in `src/utils`.
- **A plan hero in `src/ui`.** The hero's words, its colour fade and its layout
  constants know about churches, days and progress, so they aren't generic.
- **Copies in Welcome.** Welcome's tour redrew real study parts by hand: the
  passage card, the reflection card, the prayer heading, and the "Hear this part
  of the sermon" card.

## Decision

We add `src/entities/`. Each entity is one SundayBest concept, a small kit behind
its own `index.ts`:

```
src/entities/<concept>/
  index.ts    the public contract — the only file other layers import
  logic/      pure wording, rules and formatting
  ui/         props-in components that forward testID
  routes.ts   route builders, where the concept has screens
```

The first four entities are `plan`, `scripture`, `study` (the Daily Study's step
parts) and `sermon`. `src/entities/README.md` lists what each holds.

**Dependency direction:**

```
app -> features -> entities -> ui, hooks, utils, theme, types
core -> utils, theme, types
ui / hooks -> utils, theme, types
utils -> types
```

- Entities are free of side effects. They never import `core`, `features` or `app`, and take
  their data as props. A feature reads the store and passes data in.
- An entity imports another entity only through its `index.ts`, never in a
  cycle (`study` uses `plan`'s `formatDay`).
- `ui`, `hooks` and `utils` never import `entities`.

**Placement ladder**, applied whenever code is written or moved:

1. Used by one feature → it stays in that feature.
2. Used by two or more features, and it's a SundayBest idea → `entities/<concept>`.
3. Any app could use it unchanged → `ui/`, `hooks/` or `utils/`.
4. It styles something → `theme/` tokens and `ui/` typography, never a literal.

Code is promoted when its **second** consumer exists. A concept's route builders
move together, so every route to a plan's screens is built in one place, even
ones only the plans slice uses today. Welcome's mock screens
count as consumers. A shared piece with one caller is bloat.

**Welcome's mocks use a real part only where it's pixel-identical.** Where a
mock is a deliberate variation (an animated state, a different segment count, a
0.2pt difference), it keeps its own drawing, and the difference is recorded in
`src/entities/README.md`.

**Questions.** Plans' `QuickCheckChoice` and Welcome's `QuizOptions` differ in
corner, letter disc, padding and dimming, so no `AnswerChoice` entity exists yet.
When one is made, its API should take a choice's look (`idle`, `selected`,
`correct`, `incorrect`, `faded`) and a letter, so that Exams' `AnswerRow` and
future Fun games can adopt it.

## Consequences

### Good

- Each concept has one definition. The wording, routes and hero can't drift
  between Home and Plan Detail, or between Welcome and the real study.
- Welcome's tour draws the real passage card, reflection card, prayer heading
  and sermon clip, so changing one changes both.
- `src/ui` is generic again: nothing in it knows about plans.

### Bad

- One more layer to learn, and one more question ("feature, entity, or ui?")
  for every new piece. The ladder answers it.
- An entity can't read the store, so a feature has to pass everything in. That
  is the point, but it means more props.

### Neutral

- `SAMPLE_PLAN_ID` no longer passes through the plans slice. Welcome and Plan
  Creation read the sample plan from the store (`getSamplePlan`).

## Alternatives considered

| Option                                     | Why not                                                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Keep shared concepts in the owning feature | Other slices reach in through its `index.ts` for things it doesn't own (Home importing plans' routes). |
| Put them in `ui` / `utils`                 | They aren't generic. `src/ui` would stop being a brand kit any app could use.                          |
| One `shared/` folder                       | Grows into a junk drawer. Splitting by concept keeps each kit small, with its own contract.            |
| Let entities read the store                | Couples every concept to `core`, and makes the parts untestable without a store.                       |

## Verification

- `eslint.config.js` adds an `entities` element (`src/entities/*`) to
  `boundaries/dependencies` and an index-only `no-restricted-imports` pattern
  (`@/entities/*/*`).
- Both were proven with deliberately illegal imports, all caught:
  - an entity importing `@/core/store`
  - an entity importing `@/features/home`
  - `src/ui` importing `@/entities/plan`
  - `src/utils` importing `@/entities/plan`
  - a feature deep-importing `@/entities/plan/routes`
- Each entity's tests live in `tests/entities/`, mirrored.
