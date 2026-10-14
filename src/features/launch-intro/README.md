# launch-intro

The cold-launch intro. There are four; `src/theme/launch-colors.json` names the one that plays (`intro`).

**The pool movie** (`"pool-movie"`, [ADR 0029](../../../docs/adr/0029-pool-intro-movie.md)), which plays now: the pool intro in water, filmed from `docs/prototypes/launch-intro-pool-v6.html` with `POOL_MOVIE_SETTINGS`. On the red page, a pool of water pours in, and the pen writes the wordmark in water you see the red through, dripping into the pool. The letters fall in and the pool erupts to fill the screen. It holds until the page is ready, then fades away over it (`fadeOpacity`) as the page's pieces arrive in a cascade.

**The water movie** (`"movie"`, [ADR 0028](../../../docs/adr/0028-launch-intro-movie.md)) is the water intro below, rendered once from its prototype and played as a video. Its drain draws the movie only inside the water's shape, so the live page shows wherever the water has gone.

Both play on one clock (`hooks/use-movie-clock.ts`): each film gives it its movie, beats and moments.

**Remaking a movie:** after any change to its settings or its prototype, run `npm run render:intro` (the pool movie, about 35 minutes) or `npm run render:intro -- --film water` (about 20). It needs a Mac with Google Chrome, and nothing else installed. It writes:

- `assets/intro/pool-movie.mp4` and `logic/movie/pool-movie.json`, or `assets/intro/water-intro.mp4` and `logic/movie/water-movie.json`;
- in each timing file: the settings the movie was made with, its beats, and when the first letter lands.

A test fails until a movie is remade with the app's settings. Re-encode frames already captured with `-- --frames <dir>` (with the same `--film`), and change the bitrate with `-- --mbps 12`.

**The water intro**, drawn live with Skia (`"water"`, [ADR 0027](../../../docs/adr/0027-water-launch-intro.md); motion reference `docs/prototypes/launch-intro-pool-v4.html`):

1. A red pool pours in from the bottom right, slams into the left wall and rebounds.
2. The pen writes SUNDAYBEST in clear water, and its drips fall into the pool, raising it and turning it clear.
3. The letters melt into streams as they fall in.
4. The pool erupts to fill the screen with water and holds.
5. The water drains away from the top down, revealing the page underneath. Its pieces arrive as the water's edge passes them (`Arrive`, `src/ui/arrival`). While it drains, touches reach the page and the status bar is back.

**The pool intro** (`"pool"`, [ADR 0026](../../../docs/adr/0026-skia-launch-intro.md); motion reference `docs/prototypes/launch-intro-pool.html`):

1. The pen writes SUNDAYBEST, and its ink drips into a pool.
2. The letters fall in and become part of it.
3. The pool erupts to fill the screen.
4. The screen holds full for a moment, then the intro disappears and the page's pieces arrive in a cascade.

Either plays on every cold launch. With Reduce Motion on, the page colour just fades away instead.

## Switching intros

Set `intro` in `src/theme/launch-colors.json` to `"pool-movie"`, `"movie"`, `"water"` or `"pool"`. Each intro keeps its own `page` and `ink` there (each movie has the colours of the intro it films), so its colours come with it. The JavaScript changes at once. The native launch screen (`app.config.ts` reads the playing intro's `page`) changes with the next build.

## Shape

- `logic/` — pure maths: any moment of an intro can be worked out from the time alone (`frameAt`, `waterFrameAt`).
  - Each function is a worklet, so the same code runs on the UI thread and in tests.
  - `wordmark.ts` is the letters' paths and the pen's lines (a data file).
  - `settings.ts` and `water/settings.ts` are each intro's locked settings. The water's keys are the prototype's Copy settings keys, so a new set pastes straight in.
  - `scene.ts` and `water/scene.ts` build everything once: the beat times and the seeded world.
  - `water/` also holds:
    - the pour and the wall slosh (`pour.ts`);
    - the drain, and how far it has uncovered the page (`drain.ts`);
    - the melt (`melt.ts`);
    - where the living water's textures lie each frame (`textures.ts`).
- `components/`:
  - `LaunchStage` hides the page until the intro reveals it, and shares the drain's edge with the page.
  - `LaunchIntro` chooses the path: unknown, Reduce Motion, the water, or the pool.
  - `IntroPlayer`, `IntroCanvas` and `draw-frame.ts` run and draw the pool intro.
  - `movie/` plays the movies (`PoolMovieIntroPlayer`, `MovieIntroPlayer`, `draw-movie-frame.ts`), on their clock (`hooks/use-movie-clock.ts`), with their timing, settings and fit in `logic/movie/`.
  - `water/` runs and draws the water intro:
    - `WaterIntroPlayer`, `WaterCanvas` and `draw-water-frame.ts`;
    - the glass, as SkSL shaders (`*-sksl.ts`);
    - the per-frame filters that feed them the water's shape (`glass-filters.ts`, `water-filters.ts`, `melt-filter.ts`);
    - the textures, drawn once (`water-textures.ts`).
- `hooks/use-intro-clock.ts` — the frame clock:
  - It waits at the full hold until `useLaunchReady()`.
  - It fires the haptics.
  - It reveals the page, and then ends the intro. The pool intro does both at once; the water intro reveals as it drains and ends once the water has gone.

## Rules

- **Change the motion in `logic/`, under its tests.** On a 390×844 screen the beats must stay the locked ones (`tests/features/launch-intro/logic/scene.test.ts`, and `water/scene.test.ts` for v4's).
- **Keep the random sequences fixed.** `world.ts`, `water/world.ts` and `water/textures.ts` draw their random numbers in a fixed order from one seed, so the intro is the same every launch. Adding or moving a draw changes everything after it.
- **Recolour it in `src/theme/`.** `launch-colors.json` holds each intro's `page` (what it starts on, and the native launch screen) and `ink` (the pool intro's writing and water; the water intro's red pool). They reach the intro as `theme.colors.launchPage` and `launchInk`, separate from the app's own `background` and `accent`. The water's glass colours are `launch-water.ts`.
