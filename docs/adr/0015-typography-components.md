# ADR 0015 — Typography components

- **Status:** Accepted
- **Date:** 2026-09-30
- **Deciders:** @wwhitakerv

## Context

Text was drawn with react-native's `Text`, each call site pairing a
`theme.typography` role with a `theme.colors` value by hand — some 170 times
across 80 files — and a few overriding the size in a local style. Nothing
stopped a screen drifting off the brand's type, and the Text size setting had
nowhere to plug in.

## Decision

All text is drawn by a family of components in `src/ui/typography/`, one per
file, built on one private base (`ThemedText`):

| Component      | Face                      | `variant` → theme role                                                                                                                                          |
| -------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Wordmark`     | Libre Baskerville         | `masthead`, "SUNDAYBEST" inside it                                                                                                                              |
| `SerifTitle`   | Libre Baskerville Medium  | `heading` editorialHeading · `title` editorialTitle · `question` editorialQuestion                                                                              |
| `SerifBody`    | Libre Baskerville Regular | `scripture` · `standfirst`                                                                                                                                      |
| `DisplayTitle` | SF Pro                    | `display`                                                                                                                                                       |
| `SFProTitle`   | SF Pro                    | `screen` screenTitle · `headline` · `headlineRegular` · `section` sectionTitle · `card` cardTitle · `step` stepTitle · `nav` navTitle · `preview` listItemLarge |
| `SFProBody`    | SF Pro                    | `body` · `bodyLoose` · `listItem` · `label` · `reading` · `detail` cardDetail                                                                                   |
| `SFProLabel`   | SF Pro                    | `button` · `compactButton` · `segment` · `segmentActive` · `filter` · `filterCount` · `tag` · `stepLabel` · `tileNumber` · `statusTime`                         |
| `MonoLabel`    | IBM Plex Mono             | `label` metaLabel · `labelTracked` metaLabelTracked · `date` tileDate · `dayStrip` · `headerDate` · `emphasis` metaEmphasis                                     |
| `MonoBody`     | IBM Plex Mono             | `body` metaBody · `supporting` · `counter` stepCounter                                                                                                          |

Plus `Span` (part of a line: keeps the line's type, may take its own tone or
italic) and `TextField` (a text input in body type).

- **`tone`**, not colour: a semantic key of `theme.colors` (`text`,
  `textMuted`, `accent`, `inkOnLight`, …), defaulting to `text`. There is no
  raw colour prop.
- **`style` is layout only.** Its type forbids `fontFamily`, `fontSize`,
  `fontWeight`, `fontStyle`, `lineHeight`, `letterSpacing` and `color`, so a
  size can't be overridden at a call site. Where a screen needed a size the
  roles didn't have, it became a named role in `tokens.ts` with the exact same
  value (`editorialQuestion` 24/30, `listItemLarge` 20, `metaLabelTracked`,
  `headlineRegular`, `bodyLoose`, `statusTime`, and the crash screen's
  `fallbackTitle`/`fallbackBody`/`fallbackAction`).
- **One text-size seam.** `useTextScale()` returns 1; every component scales
  by it. `settings.textSize` plugs in there, and nowhere else.
- **Guardrails** (eslint.config.js, 5c-bis): react-native `Text` and
  `TextInput` can't be imported, `.typography` can't be read or
  destructured, and the private `ThemedText` base can't be imported —
  everywhere except `src/ui/typography/**`, `src/theme/**`, and the exempt
  areas below (`RAW_TYPOGRAPHY_ALLOWED`).

`cardDetail` and `stepDetail` were the same role (15/400/20); `detail` uses
`cardDetail`, and `stepDetail` is gone. `editorialBody`, which nothing read,
is gone too. `SFProTitle` `section`, and `SFProLabel` `segmentActive` and
`tag`, have no in-scope caller yet — only exempt code uses those roles — and
are kept so that code can move onto the components without new variants.

## Consequences

### Good

- The brand's type lives in one place and lint keeps it there.
- A screen reads as what it says: `<MonoLabel variant="date" tone="textMuted">`.
- Text size can be wired in one hook.

### Bad

- A new size means a new role, not a quick local override — on purpose, but
  slower.

### Neutral

- **Exempt for now:** `src/core` (it can't import `src/ui`; the crash screen
  reads theme roles directly), Fun and Exams, and the `src/ui` pieces only
  they use (AnswerRow, Chip, FactRow, LinkButton, LinkRow, PillButton,
  SectionHeader, SheetLayout, Tag). They keep reading `theme.typography`.
- **Deprecated tokens:** a role no in-scope code uses is marked
  `/** @deprecated */` rather than deleted while anything exempt might still
  read it. Delete it once nothing does.
