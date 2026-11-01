# ADR 0040 — Plans are faithful exposition of the sermon

- **Status:** Accepted
- **Date:** 2026-10-29
- **Deciders:** @wwhitakerv
- **Amends:** ADR 0020 (staged plan generation): a faculties step, and the prompts' shape
- **Amended by:** ADR 0042 (readers never see the sermon quoted): the quoted stories, point quotes and attributed-quote checks below are replaced

## Context

SundayBest relies on trust: a plan must be the sermon the reader chose,
organised, never the model's own teaching. Three things broke that:

- **Custom prompts replaced the standard rules.** While on, each step sent only
  its description, the custom voice, and its output fields. Source fidelity,
  Scripture limits and the Read's structure were never sent.
- **The custom voice writes as the pastor** ("as if you already are the
  pastor"). That's what the author wants, but it invites invented testimony,
  which must never appear.
- **Nothing guaranteed completeness.** A day studied one passage, and other
  passages the sermon named appeared only in About this plan. Points could be
  dropped, and supporting Scripture added passages the sermon never named.

Interactive mode adds six faculties a day, which must meet the same standard.

## Decision

- **One voice, short rules.** Every step's prompt is: what the step is, the
  voice, its rules, then its output (`src/generation/prompts/voice.ts`).
  - **The voice:** the custom prompt, whole. Name everyone in Scripture by
    name, talk to the reader, be a discipler, a pastor, direct, in the
    transcript's own tone and voice, as if the pastor were answering the
    reader. (Dropped on 2026-10-28 and restored at the author's direction on
    2026-10-29.)
  - **The rules:** a few direct lines per step. The more the model reads, the
    more it can get wrong, so the guarantees are checked in code.
  - The custom-prompt switch and the long standard rules are removed.
- **No made-up stories.** The pastor's own stories appear only as real quotes
  from the transcript, attributed (`speakerName: "…"`, or `From the sermon:
  "…"`). The speaker's name is kept only if the transcript or video names
  them. Attributed quotes must be in the transcript.
- **Every Scripture, every point, on some day.**
  - **Points:** the plan step inventories every point the sermon teaches,
    warns, promises or calls people to do, each in its own words from the
    transcript, and gives each to exactly one day.
  - **Scripture:** every chapter the sermon names lands on a day, as its
    passage or in `alsoReferenced`.
  - **The Read:** each day's Read covers every point it carries.
  - **No added Scripture:** none is added anywhere.
- **The faculties are written one call per day**, alongside the days. Each
  day has its own points, so days don't repeat each other, and a day that
  needs another try costs only itself.
  - **Each faculty is written, not quoted:** a question and a 2–3 sentence
    answer from what the sermon teaches at one of the day's points, in the
    plan's voice. Caption quotes read badly, so they're never shown there.
  - **Checked:** an answer names only Scripture the sermon names, and any
    words it puts in the pastor's mouth must be his (else the attribution is
    dropped). Points no faculty answers are listed at the day's end by their
    statements.
  - **Points keep their evidence:** the plan step points at the transcript's
    numbered blocks (`[b45 00:05:31]`, about 10 seconds each) where each point
    is made, and code takes the words from there, for placing points on days.
- **A plan always arrives.** Only a missing transcript or a video that doesn't
  teach from Scripture fails a plan. Everything else is repaired in code
  (quotes put back in the sermon's words, a point or passage placed on the
  day whose part of the sermon makes it, a missing point added to the day's
  end), or redone for just that step, then kept with a note on its last try.
  Notes are stored on the generation and shown in the dev admin review.
- **Calls are capped:** about 8,000 tokens and 90 seconds for a day, its
  faculties or a quiz, 16,000 and 150 seconds for the plan, so a runaway or
  stuck call is retried in about a minute instead of three.

## Consequences

- One more model call per plan (the faculties). The generator and prompt
  versions are bumped together, so plans written before these rules are never
  reused.
- Plans store `plans.speaker_name`, `plans.formation` (the points) and
  `plan_days.journey` (a day's points, other passages, Read coverage,
  faculties). Older plans have none, and the app keeps working with nulls.
- The app's "Dive deeper" supporting Scripture stays empty for new plans. The
  sermon's own other passages (`alsoReferenced`) aren't shown in the app yet.
- A sermon whose transcript names a chapter the model won't place on a day
  fails until it does. Watch for it in the dev admin review.
