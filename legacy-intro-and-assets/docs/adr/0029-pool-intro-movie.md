# ADR 0029 — The pool intro in water, played as a movie

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** @wwhitakerv

## Context

The water movie (ADR 0028) starts on a white page and drains away over the app.
The launch is to go back to the original pool intro (ADR 0026) instead: a red
page, with the white ink replaced by water.

- The wordmark is written in water you see the red through.
- The pool pours in as water.
- The drips and the eruption are the water movie's.
- There's no drain. It ends with the pool intro's own hand-off: the full screen
  fades, and the page's pieces arrive in a cascade.

The look was tuned in `docs/prototypes/launch-intro-pool-v6.html`. It's too
heavy to draw live on a phone, as the water intro was (ADR 0028), so it's
filmed the same way.

## Decision

- **A second film, beside the first.** `npm run render:intro` films v6 with
  `POOL_MOVIE_SETTINGS` (`logic/movie/pool-movie-settings.ts`). It writes
  `assets/intro/pool-movie.mp4` and `logic/movie/pool-movie.json`. The timing
  file holds the settings, the beats and the moment the first letter lands,
  which is the haptic's moment.

  `-- --film water` still films v4. A test fails if `pool-movie.json` drifts
  from the settings.

- **The app does the fade.** The prototype's own fade is left out of the film,
  so its last beat is the full screen of water. The app fades the movie over
  the page across that beat (`fadeOpacity`), shows the page as the fade starts,
  and ends the intro when it's done. The page's pieces cascade in, as the pool
  intro's do; no drain line follows them.
- **One clock for both films** (`useMovieClock`). Each film gives it:
  - its movie;
  - its beats;
  - the moments it acts on: the haptics, the reveal, the end;
  - where it holds for the page;
  - optionally, a worklet that follows each frame. The water film uses this to
    trace its drain edge.
- **Switch:** `launch-colors.json`'s `intro` is `"pool-movie"`, with the pool's
  colours.

  `app.config.ts` gives the native launch screen the pool's red for the pool
  intro and for its movie, and white for the water intros. This was approved as
  a gated change, and it ships with the next build.

## Consequences

- **v4's movie comes back** with `"intro": "movie"` and a build, because the
  native launch screen turns white again.
- **Both movies are in the app.** Each is about 14 MB. Delete the one not
  wanted, with its player, to save the size.
- Tuning means re-filming, as for ADR 0028. It takes about 35 minutes, because
  v6 is heavier per frame.
