# ADR 0028 — The water launch intro, played as a movie

- **Status:** Accepted
- **Date:** 2026-10-12
- **Deciders:** @wwhitakerv

## Context

The water intro (ADR 0027) draws v4 live with Skia shaders. On a phone it played
slow and heavy, with some jerks and skips: each frame cost more than the screen
allows.

- **Slow:** the clock never moves more than a frame at a time, so a frame that runs
  late stretches the whole intro.
- **Jerky:** each frame also rebuilds dozens of filters, and the clean-up hitches.

The intro is the same every launch. Every random number is seeded, and nothing
reacts to the reader. So working it out live recomputes a film the phone could
simply play.

## Decision

- **Render it once, from the prototype itself.** `npm run render:intro`:
  1. Steps v4 through time at 1/120 s in headless Chrome, driven over its own
     debugging protocol, so no browser library is needed.
  2. Captures the stage at 1320×2856, the largest iPhone at 3×.
  3. Encodes the frames with macOS's own HEVC encoder, AVFoundation, from a Swift
     script. Nothing to install.

  It renders with the app's `WATER_SETTINGS`, fed into the prototype before
  capture, not with the prototype's own defaults. It writes the movie
  (`assets/intro/water-intro.mp4`) and its timing
  (`src/features/launch-intro/logic/movie/water-movie.json`): the settings it was
  made with, and its beats. A test fails if either drifts from the app's.

- **Play it with Skia's own video player** (`useVideo`). React Native Skia is
  already in the app, so there's no new native module. Frames are decoded by the
  phone's video hardware and drawn into the intro's canvas, scaled to cover the
  screen.
- **The movie's own time drives everything:**
  - the haptics fire on their frames;
  - the movie pauses on the full screen of water until the page is ready;
  - the page is revealed as the drain starts;
  - the intro ends once the water has gone.
- **The drain reveals the live page through a mask, not transparent video.**
  - Skia's iOS player marks every frame opaque, and `expo-video` doesn't document
    transparency.
  - From the drain on, each frame is drawn only inside the water's shape at that
    moment. That shape comes from the drain maths, which matches v4 number for
    number, through v4's liquid filter.
  - The page shows wherever the water has gone. Its pieces arrive as the edge
    passes them (`ArrivalLineContext`, as in ADR 0027).
- **Three intros, one switch.** `launch-colors.json`'s `intro` is `"movie"`,
  `"water"` (live Skia, ADR 0027) or `"pool"` (ADR 0026). The movie has the
  water's colours, so `app.config.ts` is unchanged.

## Consequences

- **Smooth and light.** The phone decodes video, it doesn't compute the water.
  Every frame lands on time, at 120 fps on ProMotion iPhones.
- **Tuning means re-rendering.** A change to `WATER_SETTINGS`, or to the
  prototype's look, needs `npm run render:intro` (about 20 minutes), then a new
  update. The timing test catches a movie left behind.
- **Size.** The movie adds several MB to the app; the render prints its size.
- **The hold freezes.** While the movie waits for a slow page, the water stands
  still instead of moving.
- **Other screen shapes.** A screen shaped differently from the movie's stage sees
  it cropped slightly at its edges. The mask is cropped the same way.
- **Older iPhones.** 1320×2856 at 120 fps is within modern iPhones' HEVC decoders.
  Verify it once on the oldest supported model.
