# ADR 0021 — A finished plan is reused for the same request

- **Status:** Accepted
- **Date:** 2026-10-05
- **Deciders:** @wwhitakerv

## Context

A plan is written from a public sermon and the reader's choices of length and
Quick Check, and nothing else: no reader's data goes into it. Two readers who
pick the same sermon, length and Quick Check setting would get a plan built
from the same input, yet each paid for a fresh set of model calls (up to 15 for
a seven-day plan with Quick Check) and waited minutes for it.

## Decision

Before fetching a transcript or calling the model, the worker looks for a
finished plan for the same sermon (YouTube video) and length, written by the
current `GENERATOR_VERSION` and `PROMPT_VERSION` (`src/worker/reuse-plan.ts`),
preferring one with Quick Checks.

- **Found, with quizzes, or Quick Check is off:** its content is copied into
  the new plan, without its quizzes when Quick Check is off. No Supadata or
  OpenAI calls; the attempt log records one `reused` row with no tokens.
- **Found without quizzes, and Quick Check is on:** its days are copied and
  only the quizzes are written (one call per day), from the stored transcript.
- **Not found:** the plan is generated.

**One plan per sermon per reader.** Asking again for a sermon you already have
a plan for returns that plan instead of starting another, whatever length or
Quick Check setting is asked for. A plan that failed to build does not count.
Plans are not archived or saved: a reader's plans are All, In Progress and
Completed. The reader's row is locked while a plan is created, so
two taps cannot both start one.

- The content is **copied**, not shared: each plan keeps its own days, quizzes
  and choice ids, so progress, quiz attempts and deletion stay per plan.
- **Changing the prompt or generator means bumping its version**, and plans are
  written fresh from then on. Development content is never reused.
- Stored content is parsed with the plan schema on the way out; content that no
  longer passes is ignored and the plan is generated.

## Consequences

### Good

- A repeated request costs no Supadata or OpenAI calls and finishes in about a
  second; adding Quick Checks to a reused plan costs only the quiz calls.
- Every reader of a sermon gets content that already passed every check.

### Bad

- A reader who wants a different take on the same sermon and length gets the
  same plan.
- Two readers whose identical requests start at the same moment both generate;
  only requests after one has finished reuse it. (One reader cannot: see above.)
- The app is not told that an existing plan was returned; it opens it as if
  just built. Saying so needs a client contract change.

## Amendment (2026-10-07): a reader may keep two plans for one sermon

To compare plans written under different prompts, asking again for a sermon
you already have now makes a **new** plan — unless one for it is still being
built, which opens instead (so a double tap still can't start two). A
reader's own plans are never the source of a copy: asking again is asking for
a fresh one. Copying between different readers is unchanged. Existing plans
are never altered by any of this.
