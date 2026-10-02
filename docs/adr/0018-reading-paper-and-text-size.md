# ADR 0018 — Reading paper and text size: scoped theme and scoped text size

- **Status:** Accepted
- **Date:** 2026-10-01
- **Deciders:** @wwhitakerv

## Context

The Daily Study's header had a Text size button that did nothing. Two things
were asked for:

- The study's text should grow or shrink 2pt at a time, within healthy limits.
- The page should be readable on a choice of paper: white and off-whites with
  dark text, or dark papers with light text.

Each change should show at once, and hold on every later visit. Persisting
across launches waits for the database.

`useTheme()` always returned the light theme, and ADR 0015's text-size seam
(`useTextScale`) was a global multiplier pinned at 1. Neither could change one
page without changing the whole app.

## Decision

- **A scoped theme.** `ThemeScope` (`src/theme`) hands a theme down to
  everything inside it, and `useTheme()` reads the nearest one (the light theme
  by default).
  - The papers are tokens (`READING_PAPERS`).
  - `getReadingTheme(paper)` lays a light paper over `lightTheme`, and a dark one
    over `darkTheme`, so every ink, surface and control on the page follows
    without per-component changes.
- **A scoped text size.** `TextSizeScope` (`src/ui/typography`) adds an offset
  in points to every typography component inside it, with the line height
  scaled in proportion.
  - Only the study's body sits inside it; its header and nav keep their size.
- **Settings in the store, in memory.** The settings are
  `settings.readingTextOffset` and `settings.readingPaper`.
  - The reducer accepts an offset only on the 2pt scale and between −4 and +8
    (`READING_TEXT_SIZE`), so a bad value can't break the layout.
  - Nothing is persisted yet.

## Consequences

### Good

- The study's whole page — cards, inks, controls — follows the paper, because
  everything already reads `useTheme()`.
- One seam each for colour and size. App-wide dark mode and the global Text size
  setting can later use the same two scopes.

### Bad

- `useTheme()` is now a context read, not a constant. That costs little, but a
  component outside a provider tree always gets the light theme.
- The dark papers depend on `darkTheme` being complete for every token a study
  screen uses. A token missing from it shows up on Dusk and Night first.

### Neutral

- The global Text size setting (`settings.textSize`) is still not applied.
  `useTextScale` stays the seam for it.

## Verification

- Tests cover `ThemeScope` (nesting, defaults) and `getReadingTheme` (only the
  background changes).
- `TextSizeScope` is tested for size and leading, including negative offsets.
- The reducer is tested to refuse off-scale and out-of-range offsets.
- The study screen is tested end to end: a step larger, then Night, holding
  across visits.
