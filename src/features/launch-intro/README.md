# launch-intro

The cold-launch intro, in order:

1. The pen writes SUNDAYBEST in red, and its ink drips into a pool.
2. The letters fall in and become part of it.
3. The pool erupts to fill the screen.
4. The screen holds full for a moment, then the intro disappears and the page underneath arrives: its pieces fade in and drift into place (`Arrive`, `src/ui/arrival`).

It plays on every cold launch. With Reduce Motion on, the white just fades away instead. See [ADR 0026](../../../docs/adr/0026-skia-launch-intro.md), and the motion reference `docs/prototypes/launch-intro-pool.html`.

## Shape

- `logic/` — pure maths: any moment of the intro can be worked out from the time alone (`frameAt`).
  - Each function is a worklet, so the same code runs on the UI thread and in tests.
  - `wordmark.ts` is the letters' paths and the pen's lines (a data file).
  - `settings.ts` is the locked settings.
  - `scene.ts` builds everything once: the beat times and the seeded world.
- `components/`:
  - `LaunchIntro` chooses the path (unknown, Reduce Motion, or full).
  - `IntroPlayer` runs the full intro.
  - `IntroCanvas` and `draw-frame.ts` draw one frame with Skia.
- `hooks/use-intro-clock.ts` — the frame clock:
  - It waits at the full-red hold until `useLaunchReady()`.
  - It fires the haptics.
  - It ends the intro.

## Rules

- **Change the motion in `logic/`, under its tests.** On a 390×844 screen the beats must stay the locked ones (`tests/features/launch-intro/logic/scene.test.ts`).
- **Keep the random sequence fixed.** `world.ts` draws its random numbers in a fixed order from one seed, so the splash is the same every launch. Adding or moving a draw changes everything after it.
- **Recolour it in `src/theme/launch-colors.json`.** `page` is what the intro writes on (and the native launch screen, read by `app.config.ts`); `ink` is the writing, drips, pool and eruption. They reach the intro as `theme.colors.launchPage` and `launchInk`, separate from the app's own `background` and `accent`.
