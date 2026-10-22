# entities/rise

RISE — its questions, its daily schedule, its rules, and its board drawn.
Used by the game (`features/rise`) and Home's preview (`features/home`).

## The questions and the schedule

- **The bank** is `scripts/rise/questions.json`: each question's id,
  category (any — a new one needs no code), difficulty, two options, the
  right one, a one-line `fact`, and `conflicts` — questions that would give
  it away, never asked the same day.
- **`npm run build:rise`** checks the bank (`questionProblems`: two short,
  different answers; a short question), extends the schedule by whole cycles
  until it runs over a year, checks every day (`scheduleProblems`), and
  writes `data/rise-bank.json` and `data/rise-schedule.json`. It fails,
  writing nothing, rather than bend a rule. It runs with `api/`'s `tsx`.
- **A day** is six: easy, medium, easy, medium, medium, hard; at least four
  categories, none more than twice, never two in a row; nothing that gives
  another away (`dayProblems`). Its right answers sit three on the left and
  three on the right, never three running, never strictly alternating
  (`chooseSides`).
- **A cycle** asks every question it can once before any is asked again,
  the least-asked first, so new questions come in at once (`buildCycle`).
  Seeded, so a cycle is the same wherever it's built.
- **Only ever appended to.** A day in the schedule never changes, so every
  app version agrees on every day it knows. Fix a question's words in the
  bank; never delete one that's been scheduled.

## The game

Worklets on the UI thread, in screen points (`logic/`): `rise-setup` (the
stage, a new game), `rise-balloons` (rising, strings), `rise-drift` (the
saved and the survivor, adrift as in space: depth, cruise, bounces;
`rise-contact` solves a touch — masses, spin, friction), `rise-paint`
(crossing out), `rise-damage` (bursts, paint, latex), `rise-step` (the
timeline, `advanceRise`, `replayRise`). The board is drawn in one Skia
picture a frame (`ui/draw-scene`), each balloon lit by a runtime shader
(`ui/balloon-shader`). A finished board becomes a poster to share — post or
story, the answers blurred — in `ui/draw-poster` (`useRisePoster`).
