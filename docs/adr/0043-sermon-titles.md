# ADR 0043 — Sermon titles: the video title's own words

- **Status:** Accepted
- **Date:** 2026-10-31
- **Deciders:** @wwhitakerv
- **Amends:** ADR 0040 (the plan step no longer writes a title), ADR 0041 (kept
  points no longer carry one)

## Context

A plan's title was whatever the plan step's model wrote. The sermon's own
title was stored as YouTube gives it, with the speaker, church, dates,
Scripture references and "| Pastor X" or "(Part 2)" added on. A
reader should see the sermon's real title, as the pastor named it, and the
series it belongs to.

## Decision

- **One small model call per sermon** (`src/generation/title/`) finds the
  sermon's title, its series and its part in the video's title. It runs
  alongside the sermon's first build and is stored on the sermon
  (`display_title`, `series`, `series_part`, `titled_version`).
- **Code guarantees the words:**
  - each field must be one unbroken stretch of the video title, word for
    word, nothing new, nothing left out inside;
  - it's rebuilt from the title's own words and the signs between them (&,
    commas), without surrounding quotation marks, brackets or bars.
  - An answer that isn't such a stretch is asked for once more. After two
    failures, the video's own title is shown and the sermon's next plan tries
    again. A title never fails a plan.
- **Title Case is applied in code** (`title-case.ts`):
  - small words stay lower inside (a, an, the, and, of, to, in…);
  - each part of a hyphenated word is capitalised (Self-Control), and
    apostrophes are left alone (God's);
  - Roman numerals are upper (Part II), and numbers are kept
    (1 Corinthians 13).
  - Words in capitals are re-cased ("BREAK FREE", "YOU"), except the acronyms
    on a short list (NIV, KJV, TBN…). Capitals alone can't tell an acronym
    from shouting.
- **Plans carry the sermon's title.** The worker sets `plans.title` from it
  when a plan is published, generated or reused alike. The plan step no
  longer writes a title, and the generated plan has none.
- **Series and part** are sent with the sermon (`series`, `part`) and shown
  small and grey under the title (`seriesLine`): on the Plans lead and rows,
  Home's feature, and the Plan Overview hero.
- **Re-titling:** a sermon is titled again when YouTube's title changes
  (`upsertResolved` clears the four columns) or when `TITLE_VERSION` is bumped.
- **Backfill:** `npm run titles:backfill` (in `api/`). It's a dry run by
  default and prints what it would set; `--write` stores it. It was proven on
  50 real titles from the dev database before writing.

## Consequences

- One small call per sermon, not per plan.
- Search results and the "make a plan" screen show a sermon's own title once
  it has been titled, and its video's title before that.
- The generator and prompt versions are bumped, since the plan step's output
  changed.
