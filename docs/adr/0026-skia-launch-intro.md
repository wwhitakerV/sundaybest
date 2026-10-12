# ADR 0026 — The launch intro, drawn with Skia

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** @wwhitakerv

## Context

The app should open with an animation on every cold launch:

1. The pen writes SUNDAYBEST in red, and its ink drips into a pool that fills the bottom of the screen.
2. The letters fall into the pool and become part of it.
3. The pool erupts and fills the screen red.
4. The red falls away, revealing the page the reader lands on (Welcome or Home), already there underneath.

It was designed and locked in a browser prototype (version B, "the pool"), whose every frame is worked out from the time alone. The motion reference is `docs/prototypes/launch-intro-pool.html`.

The liquid look depends on drawing hundreds of drops each frame through a blur and an alpha threshold, so that shapes close together melt into one another. iOS's launch screen is a static image and can't animate.

## Decision

- **Native launch screen.** It becomes plain white (`app.config.ts`, the `splashScreenPlugin` with no image). This replaces the earlier wordmark-on-white splash.
- **Skia.** The intro is drawn with **@shopify/react-native-skia** (SDK-matched 2.6.2, installed with `npx expo install`), driven by Reanimated's frame callback on the UI thread.
- **Pure maths.** The prototype's maths is ported into pure, tested functions in `src/features/launch-intro/logic`, keeping its random sequence. On the prototype's 390×844 screen it reproduces the locked beat times exactly.
- **Drawing.** `IntroCanvas` records each frame as a Skia picture:
  - The liquid is a layer with a blur and a colour-matrix threshold.
  - The pen is path trimming.
  - The teardrops are paths.
- **Mounting.** The intro is mounted once at the root (`src/app/_layout.tsx`). It starts on the same white as the native launch screen, so the hand-off is invisible.
- **Splash and readiness.** `LaunchSplashCoordinator` now lifts the native splash as soon as the app has drawn, and reports through `useLaunchReady()` when the first page is ready. The intro's full-red hold waits for that before the red falls.
- **Reduce Motion.** With it on, the intro doesn't play: the white fades away to the page once it's ready.
- **Haptics.** Two named haptics are added: `dropFeedback` (the letters reach the pool) and `splashFeedback` (the eruption).

### Rejected

- **react-native-svg with SVG filters.** It's what the prototype used in the browser, but SVG filters on device are rasterised on the CPU. At this many drops and this blur, every frame would be far too slow.
- **Lottie.** It plays an animation authored in After Effects. The liquid here is procedural (drops merging, the pool rising with what lands in it), and it would have to be rebuilt by hand as keyframes, losing the physics.
- **Keeping the static splash.** That doesn't do what was asked.

## Consequences

- **New native build.** Skia is a native module, so it ships with a new build, not an OTA update, and the development client needs rebuilding. The plain-white launch screen is native config, so it needs the same build.
- **App size.** Skia adds several megabytes to the app.
- **Launch length.** Every cold launch plays about 8 seconds before the page is usable, with no skip. That was chosen deliberately. Coming back from the background shows nothing.
- **Testing.** Under Jest, Skia is a stand-in (`tests/setup/jest.setup.ts`), and what's drawn is covered by the pure frame tests rather than by rendering.
- **Privacy:** nothing leaves the device. The intro draws and nothing else.

## Removing it

1. Delete `src/features/launch-intro` and its line in `src/app/_layout.tsx`.
2. Have `LaunchSplashCoordinator` hide the native splash only when `ready`, as it did before.
3. Restore the splash image in `app.config.ts`.
4. Uninstall Skia.
