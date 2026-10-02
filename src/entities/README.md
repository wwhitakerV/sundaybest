# src/entities — shared SundayBest concepts

Ideas that belong to SundayBest and that more than one feature uses: a plan's
wording and routes, a passage of scripture, a Daily Study step's parts, a
sermon clip. Each entity is a small kit behind its own `index.ts`
([ADR 0017](../../docs/adr/0017-entities-layer.md)).

## Where code goes

1. Used by one feature → it stays in that feature.
2. Used by two or more features, and it's a SundayBest idea → here.
3. Any app could use it unchanged → `@/ui`, `@/hooks`, or `@/utils`.
4. It styles something → `@/theme` tokens and `@/ui` typography.

Promote code when its **second** consumer exists; Welcome's mock screens count.

## Structure

```
<concept>/
  index.ts    the only public entry point
  logic/      pure wording, rules, formatting
  ui/         props-in components; accept testID and forward it
  routes.ts   route builders, where the concept has screens
```

## What's here

| Entity      | Piece                                                                                              | What it's for                                                  |
| ----------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `plan`      | `describePlanHero`                                                                                 | A plan hero's words: status, action, today                     |
|             | `formatDay`, `formatDayOfTotal`, `formatPlanLength`, `getPlanEndsLine`                             | "Day 2", "Day 2 of 6", "3 days", "Ends Sunday…"                |
|             | `getHeroPalette`                                                                                   | A hero's colour, gradient, and ink from its sermon's colours   |
|             | `HeroBackdrop`, `HeroContent`, `HeroContentFade`                                                   | A plan hero's backdrop, words, and the colour behind them      |
|             | `planOverviewHref`, `studyHref`, `quickCheckHref`, `dayCompleteHref`, `HOME_HREF`, `NEW_PLAN_HREF` | Routes, built in one place                                     |
|             | `parsePlanParams`, `parseStudyParams`                                                              | Route params, checked (Zod)                                    |
| `scripture` | `PassageHeading`, `PassageCard`                                                                    | A passage's reference and translation; the passage on its card |
| `study`     | `StepKicker`, `ReflectionCard`, `PrayerHeading`                                                    | Daily Study step parts                                         |
| `sermon`    | `SermonClipCard`                                                                                   | "Hear this part of the sermon", playing or not                 |
| `streak`    | `WeekDays`                                                                                         | The week's seven days, each lit when studied                   |

## Welcome copies that stay separate

Welcome's tour draws a real entity part wherever it's pixel-identical. These
mocks are deliberate variations, so they keep their own drawing:

| Welcome mock                       | Real part                      | Difference                                                                                                           |
| ---------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `lifts/QuizOptions`                | `plans/QuickCheckChoice`       | Corners 24 vs 28, letter disc 32 vs 36, padding, dimmed at 0.35 vs 0.45                                              |
| `QuickCheckMock`'s header          | `plans/QuickCheckHeader`       | The mock's tracker has 3 segments for "1 of 3"; the real one adds a score segment (4)                                |
| `StudyMockHeader`                  | `plans/StudyHeader`            | Step labels spaced edge to edge with a 10pt gap; the real ones sit under their segment with 8pt                      |
| `lifts/DayPicker`                  | `plan-creation/DayCountPicker` | Chips are 57.2pt tall with no fill, and pop when picked; the real ones are 57pt on the page colour                   |
| `lifts/AnswerBox`                  | `ReflectStep`'s answer field   | A drawn box that types itself out, not a text field                                                                  |
| `lifts/PrayerLines`                | `PrayStep`'s prayer            | Line-by-line karaoke fill, not one paragraph                                                                         |
| `lifts/PasteField`, `CreateButton` | `SermonLinkField`, `Button`    | The field is 74pt with a 54pt Paste button (real: 64 and 48); Create is 64pt tall (real `Button`: 61)                |
| `mocks/SermonCard`                 | `plan-creation/SermonPreview`  | Full-width thumbnail on a 26pt card, title in `listItem`; the real one uses `VideoThumbnail` and the `preview` title |

## Never goes here

- Anything that reads the store, the network, or any other side effect. A
  feature reads the data and passes it in.
- Navigation. Routes are described (`routes.ts`), never pushed.
- Code only one feature uses.

## May import

`@/entities` (another entity, through its `index.ts`), `@/ui`, `@/hooks`,
`@/utils`, `@/theme`, `@/types`. Never `@/features`, `@/core`, or `@/app`.
