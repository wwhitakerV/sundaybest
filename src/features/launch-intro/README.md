# launch-intro

The cold-launch intro: **the paint movie** ([ADR 0030](../../../docs/adr/0030-paint-intro-movie.md), [ADR 0031](../../../docs/adr/0031-paint-movie-only.md)). It's the only intro; the old ones are retired in `legacy-intro-and-assets/`.

On the red page, one white stroke of paint sweeps across the wordmark, with the letters behind it. The whole stroke turns liquid and runs down into the pool as one streak, leaving the letters; a few drips dangle and fall, and the pool answers each one. The letters fall in and the pool erupts to full white. The white holds until the page underneath is ready, then is gone at once (its fade is 0 ms) as the page's pieces arrive in a cascade (`Arrive`, `src/ui/arrival`).

It plays on every cold launch, with no skip. With Reduce Motion on, the red page just fades away instead. Coming back from the background shows nothing.

## The movie

It's filmed from `docs/prototypes/launch-intro-pool-paint.html` with `PAINT_MOVIE_SETTINGS` (`logic/movie/paint-movie-settings.ts`), the prototype's Copy settings keys, so a new set pastes straight in. The phone's video hardware plays it: every frame is already drawn.

**Remaking it:** after any change to its settings or its prototype, run `npm run render:intro` (a few minutes). It needs a Mac with Google Chrome, and nothing else installed. It writes `assets/intro/paint-movie.mp4` and `logic/movie/paint-movie.json`: the size and frame rate, the settings it was made with, its beats, and when the first letter lands. A test fails until it's remade with the app's settings. Re-encode frames already captured with `-- --frames <dir>`, and change the bitrate with `-- --mbps 12`.

## Shape

- `components/`:
  - `LaunchStage` hides the page until the intro reveals it, then lets its pieces arrive.
  - `LaunchIntro` waits to know whether Reduce Motion is on, then plays the movie or the fade.
  - `movie/PaintMovieIntroPlayer` plays the movie: the red covers the app until the movie fills the screen, the movie holds on the full white until the page is ready, then hands over (`fadeOpacity`). `draw-movie-frame.ts` draws a frame to fill the screen.
  - `ReducedMotionLaunch` is the fade; `IntroReadyBridge` tells the clock when the page is ready; `IntroFailSafe` shows the page if the intro ever fails.
- `hooks/use-movie-clock.ts` — the clock is the movie's own time: it holds at the full white until `useLaunchReady()`, fires the haptics on their frames (`dropFeedback` as the first letter lands, `splashFeedback` as the pool erupts), shows the page and ends the intro. A movie that never shows a frame steps aside to the page.
- `logic/` — pure and tested: `clock.ts` (the moments a frame crosses), `frame-stats.ts` (development-only frame timings by beat), `movie/movie.ts` (how the movie covers a screen, when it holds, its moments and fade), `movie/paint-movie*.{ts,json}` (the film and its settings).

## Rules

- **Change it in the prototype, then re-film.** The app plays the movie as filmed; motion isn't tuned in code.
- **Recolour the launch in `src/theme/launch-colors.json`.** Its one value, `page`, is the red the movie starts on. It reaches the intro as `theme.colors.launchPage`, and `app.config.ts` reads it for the native launch screen, so the hand-over stays seamless. A change reaches the launch screen only with a new build.
