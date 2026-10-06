# ADR 0022 — A plan is built only from a video that teaches from the Bible

- **Status:** Accepted
- **Date:** 2026-10-05
- **Deciders:** @wwhitakerv

## Context

SundayBest builds Bible studies from Christian sermons. Any YouTube link can be
pasted, including self-help talks, videos that only call themselves sermons,
and things that are not sermons at all. A plan needs a passage for every day
from a chapter the sermon names; without one, the model invents passages, and
every failed attempt costs OpenAI calls.

## Decision

After the transcript is fetched and before any model call, the worker checks
it against the bundled Bible (`src/generation/scripture-evidence.ts`):

- **Chapters named:** every book-and-chapter reference, spoken or written
  ("first Corinthians thirteen", "Romans 8:28"), that exists in the Bible.
- **Verses read:** every eight-word run matching a verse's wording in the BSB
  or the KJV (`src/bible/quote-index.ts`), checked word for word, ignoring
  stock phrases found in more than three verses.

A video that names no chapter, or whose named chapters plus verses read are
fewer than four, fails with `unsupportedSource` and says the video doesn't
teach from the Bible enough to build a study. It is never retried
automatically, and it costs one Supadata transcript and no OpenAI calls.

Measured on stored transcripts: two sermons scored 21 and 26 (6–8 chapters,
15–18 verses read); a gaming video scored 0.

The check runs on the server: the transcript and the Bible text are both
there, and the app never downloads a transcript.

## Consequences

### Good

- Videos that are not Bible teaching are stopped before they cost model calls,
  with a reason the reader understands.
- The plan step only ever sees sermons that name at least one chapter.

### Bad

- Paraphrased or other-translation readings (NIV, ESV, NKJV) count only where
  eight words in a row match the BSB or KJV; named chapters still count.
- The quote index takes about two seconds and 8 MB to build, once per worker
  process.
- The app shows the reason followed by its usual "try again" line; retrying
  fails the same way, cheaply. Hiding retry for this case needs a client change.
