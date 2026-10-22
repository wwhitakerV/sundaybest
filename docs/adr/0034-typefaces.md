# ADR 0034 — Three typefaces: Canela, Söhne, Tiempos Text

- **Status:** Accepted (on trial files — see Consequences)
- **Date:** 2026-10-20
- **Deciders:** @wwhitakerv

## Context

SundayBest was set in Libre Baskerville (headings and reading), SF Pro (the
interface) and IBM Plex Mono (dates, labels, metadata). The brand is moving
to a quieter, contemporary editorial voice, like a luxury publication's, in
three families, each with one job.

## Decision

| Family           | Job                                                                                                           | Cuts loaded                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Canela**       | Expressive headlines at 30pt and over (`display`, `editorialHero`, `editorialDisplay`, `folioTitle`)          | Medium                                                   |
| **Canela Deck**  | Plan titles (heroes, plan cards), study headings, questions, pull lines; the status bar's time                | Medium                                                   |
| **Söhne**        | Everything else: navigation, buttons, tabs, settings, labels, dates, metadata — what SF Pro and Plex Mono did | Buch 400, Kräftig 500, Halbfett 600, Dreiviertelfett 700 |
| **Tiempos Text** | Reading: teaching (`reading`), Scripture, standfirsts, reflections, prayers                                   | Regular, Italic                                          |

- **Every type role names its cut** (`src/theme/fonts.ts`, `tokens.ts`) and a
  `fontWeight` equal to that cut's own, so iOS never swaps in another face.
- **Italic is its own cut.** `Span italic` takes the italic of the line it sits
  in (`italicFace`, read through `ThemedText`'s line context); a cut with no
  italic loaded stays upright.
- **Söhne's tracking**, where a role doesn't set its own: −1% of its size from
  20pt, +1% at 13pt and under, none between. SF Pro tracked itself by size;
  Söhne doesn't.
- **Sizes don't change.** Every role keeps its size and leading; the faces are
  judged on the phone before any are retuned.
- **Dynamic Type** works as before: custom faces scale with iOS's text size
  and the app's own Text size; the status bar stays fixed, as iOS's does.
- **SF Pro stays where iOS draws** — the keyboard, alerts, the share sheet.
- The wordmark is artwork (`assets/sb-wordmark.svg`), so it isn't touched.

## Amended

- **2026-10-20:** the battery shows a level line, not figures (iOS gives apps its level
  only in 5% steps), so Canela Deck Bold is no longer loaded.
- **2026-10-20:** reading moved from Domaine Text to Klim's Tiempos Text (Regular and
  Italic), the same day, on the design's call.

## Consequences

- **Trial files only.** Klim's test fonts may be used for evaluation inside the
  team only — never in a build that leaves it, TestFlight included. They hold
  little beyond letters, figures and `. , -` and no OpenType features, so
  apostrophes, quotes, `? ! : ; ( ) &` and dashes fall back to iOS's face and
  there's no kerning or tabular figures. Licences and the real files are on
  `docs/SETUP_CHECKLIST.md` before any release.
- The typography components keep their old names (`SFProBody`, `MonoLabel`, …)
  for now, though they no longer draw SF Pro or a mono; renaming them by role
  is a separate, mechanical change.
- `app.config.ts` still embeds Libre Baskerville and IBM Plex Mono natively;
  it moves to the licensed files with them.

## Alternatives

- **Keep SF Pro for the interface.** Native and free, but the spec wants one
  voice across SundayBest's own chrome.
- **Keep Plex Mono for metadata** as a fourth family — declined: three
  families, each with one job.
