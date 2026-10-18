# ADR 0027 — The water launch intro, beside the pool intro

- **Status:** Accepted
- **Date:** 2026-10-12
- **Deciders:** @wwhitakerv

## Context

The launch intro (ADR 0026, "the pool") was redesigned in the browser prototype
`docs/prototypes/launch-intro-pool-v4.html` ("v4"). In v4:

- **Glass water.** Everything is clear water, drawn as glass: the letters, the
  drips, the pool, the eruption that fills the screen, and the drain. Every pixel
  is opaque.
- **The pool.** It pours in from the bottom right, slams into the left wall and
  rebounds. It starts in the launch's red and turns clear as the drips land.
- **The letters.** They melt into streams as they fall.
- **The drain.** The water falls away from the top down to reveal the page.

The water's look comes from SVG filters: blurs and colour tables of the water's
shape, offset spectrum edges, and moving caustic textures. React Native has no SVG
filters.

The reader should see the water drain off the live page, with nothing between the
two. The pool intro may still be wanted back, so it has to stay, one change away.

## Decision

- **Two intros, one switch.** The water intro is a second intro in the same
  slice: `logic/water` and `components/water`. The pool intro is untouched.
  - `src/theme/launch-colors.json` names the intro that plays (`intro`) and keeps
    each intro's own `page` and `ink`.
  - `app.config.ts` reads the playing intro's `page` for the native launch screen.
  - Setting `intro` back to `"pool"` brings the pool intro back with its own
    colours. The native launch screen follows with the next build.
- **Pure maths, ported exactly.** v4's world, pour, wall slosh, drain and textures
  are pure, tested functions that keep v4's random sequences. On 390×844 the beats
  match v4's to the millisecond, and every pool, drain and spray value matches its
  numbers.
- **Glass as GPU shaders.** Each water (the pool, the drips, a letter) is one Skia
  runtime image filter (`MakeRuntimeShaderWithChildren`). Its children are the
  water's shape and blurred copies of it; the SkSL reproduces v4's filter graph
  layer by layer.
  - The caustic, field and colour textures are drawn once into images with SkSL
    and moved every frame.
  - The colours live in `src/theme/launch-water.ts`.
  - The melt is a chain of Skia's own image filters, the same steps as v4's SVG
    melt filter.
- **In the screen's own pixels.** Skia works a custom shader filter out at one
  unit of its layer to one pixel, then scales the result. In points it came out
  a third as sharp; in the wordmark's units a letter was a few pixels tall, a
  blur over the text. So each water's layer opens in device pixels, its sizes
  scaled to match (`unit`, `logic/water/pixels.ts`), and its content is drawn
  back in points. A falling letter's melt is its own layer in the letter's units,
  of Skia's built-in filters, which scale.
- **Each water is worked out only where it is.** A texture or noise input has no
  edges, so uncut it spreads its filter across the whole screen. The first device
  build closed while the pen wrote, most likely killed for GPU memory: every
  letter's filter covered the screen. So:
  - every texture and noise input is cropped to its water's region;
  - the canvas is clipped to that region (`wetTop` for the pool);
  - each water's sample margin is its own, in its own units.

  A frame that throws on the UI thread is caught (`WaterCanvas`), and the intro
  steps aside to the page.

- **The drain reveals the live page.** The page is shown under the water as it
  starts to drain. How far down it's uncovered (`uncoveredTo`) is shared with the
  page on the UI thread (`ArrivalLineContext`). Each `Arrive` piece comes in as
  the water's edge passes it, rather than in the timed cascade. While it drains,
  touches reach the page and the status bar is back.

## Consequences

- **Verification.** The shaders and frame logic were checked off-device: rendered
  through CanvasKit and compared with v4 frame by frame. The melt and the Skia
  filter wiring can only be judged on a device.
- **Cost.** Each frame builds fresh filters for the pool and each visible letter,
  so it costs more GPU than the pool intro. Measure it on the oldest supported
  iPhone before release.
- **The native launch screen.** It's white for the water intro and red for the
  pool intro, so switching back needs a native build for the screen to match.
