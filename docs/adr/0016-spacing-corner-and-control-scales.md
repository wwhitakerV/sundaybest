# ADR 0016 — Spacing, corner, and control-height scales

- **Status:** Accepted
- **Date:** 2026-09-30
- **Deciders:** @wwhitakerv

## Context

`theme.spacing` (`xs 4 · sm 8 · md 16 · lg 24 · xl 32`) and `theme.radii` didn't
describe the app. Components read them about 37 times and wrote about 240 raw
gap/padding/margin numbers and 40 raw corner radii instead — mostly 12, 14, 18,
20, 22 and 28, which the scales didn't have. The same card shell (a hairline
edge, 28 corners, a soft fill) was written out some 20 times, four screens each
worked out the tab bar's clearance, and `Button` hardcoded its height and
corners.

The scales were reachable only through `useTheme()`, so a value from them
couldn't sit in a module-level `StyleSheet.create`. That's why components wrote
raw numbers.

## Decision

- **Three scales in `src/theme/tokens.ts`, imported directly from `@/theme`:**
  - `space`: 2, 4, 6, 8, 10, 12, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36 and 40.
  - `radius`: 10, 12, 14, 16, 20, 23, 24, 28, 32, 36 and `pill`.
  - `controlHeight`: `hitTarget` 44, `headerButton` 49, `header` 54 and `button` 61.

  `space` and `radius` name each step by its own value (`space[22]`,
  `radius[28]`), so a mock's number reads straight across and no value was
  rounded to fit. They hold every value that repeats across components.
  Spacing, corners and heights don't change with the theme, so a direct import
  is safe and works inside `StyleSheet.create`. Colour stays on `useTheme()`.

- **One-off geometry stays local**, as a named constant with a one-line reason
  (`const DAYS_GAP = 30`). A circle's corner is its `SIZE / 2`.
- **`Card` (`src/ui/atoms/Card.tsx`)** is the shell. It sets the hairline edge, the
  divider colour and the `surface` fill (`fill="page"` for the page's own background), with
  `radius` 24, 28 (the default), 32 or 36. Padding and gap come in through
  `style`.
- **`FLOATING_NAV_BAR_CLEARANCE`** in `src/ui/organisms/floatingNavBar.ts` is the one
  definition of the room a tab screen leaves for the tab bar.
- **Guardrails** (eslint.config.js, 5c-bis), on the same files as ADR 0015's:
  - A non-zero number literal can't be used for a gap, padding or margin, or
    for a corner radius.
  - `theme.spacing` and `theme.radii` can't be read.

## Consequences

### Good

- Spacing and corners come from one place, and lint keeps them there.
- A new number has to be named: either it joins a scale or it carries its reason.

### Bad

- The scales are long (17 spacing steps), because they record the app as it
  is rather than an idealised 4- or 8-point grid. Tightening that grid is a
  design decision, made in `tokens.ts` when it comes.

### Neutral

- `theme.spacing` and `theme.radii` stay, built from the new scales, for Fun
  and Exams, which sit outside this migration (as in ADR 0015). Delete them
  once nothing reads them.
- `Card` is a plain `View`, so a pressable or animated shell (a plan row, a
  Quick Check choice), one with corners off its list (the Welcome tour's
  answer box, sermon card, and paste field), or one with a different edge
  (Up next's 1.5) stays hand-written, on the scales.
