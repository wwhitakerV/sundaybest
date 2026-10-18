# ADR 0030 — The paint intro, played as a movie

- **Status:** Accepted
- **Date:** 2026-10-17
- **Deciders:** @wwhitakerv

## Context

The launch went back to the original pool intro (ADR 0026), then was reworked
around a stroke of paint. It was designed in
`docs/prototypes/launch-intro-pool-paint.html`:

- The red page is blank, then one quick white stroke of paint (`assets/paint.svg`)
  sweeps across where the wordmark sits. The letters are behind it.
- The whole stroke turns liquid at once and runs down to the pool as one streak:
  a wavy, wobbling front of runs of different lengths, its top letting go
  unevenly, each stretch falling at its own speed, so it splits into streaks.
  The letters are left behind it, wet for a moment.
- A few drips are left dangling under the letters. They swell, pinch off and
  fall, and the pool answers each one: rings that travel out, a slosh, and a
  small drop thrown back up.
- The paint that ran down is the pool. Then it plays as the pool intro does:
  the letters fall in, the pool erupts to full white, and it holds.

Like the pool intro in water (ADR 0029), it's drawn with liquid filters and
masks that would be too heavy to draw live on a phone, so it's filmed.

## Decision

- **A third film, played the same way.** `npm run render:intro` now films the
  paint prototype with `PAINT_MOVIE_SETTINGS` (`logic/movie/paint-movie-settings.ts`)
  and writes `assets/intro/paint-movie.mp4` and `logic/movie/paint-movie.json`.
  It's the script's default film; `--film pool` and `--film water` make the
  others. A test fails if `paint-movie.json` drifts from the settings.
- **One player for both fading movies.** `FadingMovieIntroPlayer` covers the app
  in the page's colour until the movie fills the screen, holds there until the
  page is ready, then fades the movie away over it. The pool movie and the paint
  movie are each a film passed to it (`PoolMovieIntroPlayer`,
  `PaintMovieIntroPlayer`).
- **No fade.** The paint film's fade is 0 ms (`fadeMs`), so the full white is
  gone at once at the end of the hold and the page's pieces arrive in a cascade,
  as the original pool intro hands over.
- **The pool's colours.** `launch-colors.json` names `"paint-movie"`; it starts
  on the pool's red page with its white ink.
- **The other intros stay**, each one switch away. (Since retired: ADR 0031.)

## Consequences

- The intro is a 4.4 MB video, about 5.9 s long at 120 fps, played by the phone's
  video hardware, on the clock the other movies use (`useMovieClock`).
- Any change to the paint prototype or its settings needs a re-film (a couple of
  minutes) before the app shows it.
- `app.config.ts` chose the native launch screen's colour from the playing
  intro; since ADR 0031 it reads the one launch colour directly.
