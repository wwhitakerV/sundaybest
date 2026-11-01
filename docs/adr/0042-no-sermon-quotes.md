# ADR 0042 — Readers never see the sermon quoted

- **Status:** Accepted
- **Date:** 2026-10-31
- **Deciders:** @wwhitakerv
- **Amends:** ADR 0040 (faithful exposition): its quoted stories, point
  evidence and checks on attributed quotes

## Context

The sermon's words come from YouTube captions, which have no punctuation and
mishear words. When matched to what the model meant, they often land on the
wrong stretch. Wherever they reached readers they read badly: day pull quotes,
`From the sermon:` lines, and the pastor's stories quoted in the Read.

The real sermon is the video. Readers can already watch it in the app.

## Decision

- **No text quotes of the sermon anywhere a reader sees.** Every step's rules
  say: never quote the sermon, say what it teaches in your own words, and keep
  the pastor's words out of quotation marks. Quoting Scripture is fine.
- **The pastor's stories** may be retold briefly as his, by name, never as
  the writer's own. Made-up stories stay forbidden.
- **Checked in code** (`src/generation/sermon-quotes.ts`):
  - **What counts as a quote:**
    - words put in the pastor's or the sermon's mouth (`Mike Smith: "…"`,
      `Pastor Mike said, "…"`, `From the sermon: "…"`);
    - three or more of the sermon's words in quotation marks;
    - twelve of its words in a row, with or without marks.
  - **Scripture is never counted as a quote,** even when the sermon reads it.
  - **The day and faculties steps** write a line with a quote again, and on
    the last attempt keep it as plain words, noted.
  - **The plan step and Quick Checks** never retry for this: the quotes are
    taken out in code and the words kept.
- **Days no longer have a sermon quote.** Each day's clip is worked out in
  code: from where its first point is made to where the next day's begins, the
  last running to the end of the sermon.
- **Points carry where they're made, not the caption's words:** their block
  and the second it starts. The prompts get each point's statement and block,
  and the dev review links each time to the video.
- **Old plans:** `sermonQuote` is gone from both contracts and the database
  (`0014_drop_sermon_quote.sql`), so no plan, old or new, can show one.

## Consequences

- The real sermon reaches readers only through the video. Point times are
  ready to become labelled jump points in a future in-app player.
- The caption-matching code is gone (`excerpt.ts`, `attribution.ts`,
  `settleQuotes`).
- The generator and prompt versions are bumped, so older plans and saved
  points are no longer reused.
