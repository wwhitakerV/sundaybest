# Interactive mode and the generation prompts

Agreed 2026-10-28. Builds on the handoff in
`SundayBest_Interactive_Mode_Integration_Handoff/` (Oct 25), which predates the
six fixed faculties: where the two differ, this file wins.

## Decisions

1. **An interactive day is the six fixed faculties**, every day, in this order:
   SEE, HEAR, UNDERSTAND, DO, SPEAK, EXAMINE (board: eye, ear, brain, hand,
   speech, heart). Each faculty is written in the plan's voice from one of the
   day's points:
   - an optional transition;
   - the question;
   - the answer: 2–3 sentences from what the sermon teaches there, never
     quoting it (ADR 0042);
   - an optional reflection;
   - a commitment.

   Each day's faculties are written in their own call, alongside the days.
   Points no faculty answers are listed at the day's end by their statements.
2. **No sculptural PNG assets and no per-plan board.** The app draws the
   objects (Formation, Skia) on the one vIdeal board.
3. **Prompts:** the custom prompt is the voice, whole (restored 2026-10-29),
   with short direct rules per step. Only made-up personal stories are
   forbidden. See ADR 0040.
4. **Reader or Interactive is chosen per plan.** New plans carry both; old plans
   are Reader-only (`journey` null).
5. **An interactive day is done** when all six faculties are opened and one
   commitment is chosen. It's recorded in the same single day-completion record
   as the Reader's. Reader steps are never marked done by interactive activity.
6. **Faithful exposition** (ADR 0040). Every Scripture the sermon names and
   every point it makes lands on a day, in both views. Nothing is added: no
   Scripture, no ideas.
7. **Commitments keep a full history** on the server, for future recap movies
   and a profile:
   - every commitment chosen;
   - every check-in (`did` / `tried` / `notYet`), added to, never edited;
   - each with a copy of its words.

   The app asks only yesterday's, as a quiet line on the next day's board.

## The prompts

The exact wording lives in the code, the source of truth:
`api/src/generation/prompts/voice.ts` (the voice and every step's rules) and
`api/src/generation/prompts/formation.ts` (the six faculties). The plan, day and
Quick Check prompts are `outline.ts`, `day.ts` and `quiz.ts` beside them.

| Step | Sections |
| --- | --- |
| Plan (outline) | THIS STEP · VOICE · RULES · OUTPUT FIELDS |
| Day | THIS STEP · VOICE · RULES · OUTPUT FIELDS |
| Faculties | THIS STEP · VOICE · RULES · FORMATION · OUTPUT FIELDS |
| Quick Check | THIS STEP · VOICE · RULES · FINISH THE VERSE · OUTPUT FIELDS |

### Checked by code, not only asked for

- **Points:** every point keeps where the sermon makes it (its block and
  second, never caption words), and every point is on exactly one day.
- **Scripture:**
  - every chapter the sermon names is on some day;
  - every passage is named in the transcript and reads in the BSB and KJV;
  - none is added.
- **The Read:** each day's Read covers every point it carries.
- **Attribution:**
  - nothing quotes the sermon: no words put in the pastor's mouth, none of
    its words in quotation marks, no long runs copied (ADR 0042);
  - the speaker's name appears in the transcript or video.
- **Faculties:**
  - six, in order (put in order if they come back out of it);
  - each answers one of the day's points, and every point of the day appears,
    in a faculty or at the day's end;
  - they name only Scripture the sermon names;
  - they never quote the sermon.

## Titles (their own step)

Done 2026-10-31: see ADR 0043. Agreed 2026-10-25. One small model call per sermon, separate from the prompts
above, finds the true sermon title in the raw YouTube title, without the
speaker, church, date, Scripture reference, or dash and bracket additions.

- **Code guarantees the result:** the original's words, in order, never new
  ones. If it fails twice, the raw title is shown.
- **Series and part** are their own fields, shown small and grey.
- **Title Case is applied in code:** God's, Self-Control, Part II,
  1 Corinthians 13.
- **The plan's title copies the clean title,** and the outline no longer
  writes it.
- **A one-off backfill**, proven on 30–50 real titles first.

## Order of work

1. **Prompts, coverage and faculties (API), plus a review page.** Done
   2026-10-29: see ADR 0040, and review plans at `/dev/admin`.
2. **Titles.** Done 2026-10-31: see ADR 0043.
3. **Interactive mode in the app:**
   - commitments, check-ins and their history;
   - the Reader / Interactive switch;
   - the board driven by each day's faculties.
