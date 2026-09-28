# ADR 0013 — Theology exams: bundled content, validated at load, graded on the device

- **Status:** Accepted
- **Date:** 2026-09-28
- **Deciders:** @wwhitakerv

## Context

The first theology exam, THEO-01-01 _The Scriptures Received_, arrives as an
authored JSON file (schema v2) holding each question, its answer key, its
explanation, its teaching, and its sources. The spec is
[docs/specs/theology_exams.md](../specs/theology_exams.md).

The brief asks for Exam Mode submissions to be graded "in a trusted service"
and for keys to stay out of pre-submission client data in production. There is
no backend yet, and the app is still being built. The owner chose, on
2026-09-28, to bundle the keys and grade on the device in every build so the
exam works now.

The app store is in memory; attempts are lost when the app closes until the
local database lands.

## Decision

- **The JSON is bundled unchanged** at
  `src/features/exams/data/content/THEO-01-01.json` — kept out of Prettier so
  it stays byte-identical to the authored file — and is the content authority.
- **Parsed with Zod at load, failing closed.** `parseExamContent` checks the
  schema and every cross-field rule in the spec's criterion 4 (IDs, counts,
  allocation, keys, rationales, feedback, scoring rules, links, bands). Any
  failure yields a content error naming field paths — never values — and the
  exam cannot be started.
- **Keys never reach the question screen.** Parsing splits each question into
  an `ExamQuestion` (what the screen may show) and a `QuestionReveal` (key,
  rationales, `whyCorrect`, feedback, teaching). Screens receive only
  `ExamQuestion`s; reveals come from one module.
- **One grading seam.** `src/features/exams/data/exam-grading.ts` is the only
  code that reads reveals. It grades on the device today; a trusted service can
  replace it without the screens changing.
- **Attempts live in the app store** as snapshots: exam ID and version, each
  item's ID, version, and allowed option IDs (never its key), the mode, the
  Practice flag, every response with its time, and the graded result recorded
  when the attempt finishes. The reducer enforces the rules — one open attempt
  per exam, no change after completion, no target paired twice, a checked Study
  answer locked — without ever seeing a key.
- **Practice and concept evidence** follow the spec: after any attempt that
  revealed answers, later Exam attempts are Practice; only Exam Mode first
  attempts count as independent observations for concept labels.

## Consequences

### Good

- The exam works end to end with no backend.
- Broken or edited content can't silently corrupt a score: it fails closed.
- Moving grading to a server later touches the seam, not the screens or store.
- A recorded result never changes when the content does.

### Bad

- **The answer keys are public.** Anyone who unpacks the app can read them.
  Accepted while there is no backend; nothing server-side trusts a score, and
  there are no accounts or credentials tied to one.
- A jailbroken device can alter in-memory scores. Same reasoning.
- Attempts do not survive an app restart until the database lands.

### Neutral

- When attempts are persisted they go to the encrypted SQLCipher database,
  never plain storage — responses to theology questions are treated as
  personal.
- A second exam (THEO-04-03) is a new JSON file and a line in
  `bundled-exams.ts`; it will also bring a catalog screen.

## Alternatives considered

| Option                                   | Why not                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| Grade on a server now                    | No backend exists; the owner needs the exam working while building.      |
| Hide keys from production builds only    | Declined by the owner; the exam should behave the same in every build.   |
| Trust the JSON without runtime checks    | A malformed key or link would silently mis-score or open the wrong page. |
| Keep responses in a separate store table | They belong to exactly one attempt; nesting keeps the snapshot whole.    |

## Verification

- `tests/features/exams/data/parse-exam.test.ts` covers every fail-closed case
  and asserts the question-screen data carries no key, rationale,
  `whyCorrect`, or teaching.
- `tests/core/store/exams.test.ts` covers the reducer's refusals and the
  snapshot.
- `grep -rn "reveals\|QuestionReveal" src/features/exams` shows reveals read
  only in `data/`, the grading seam, and post-reveal screens.
