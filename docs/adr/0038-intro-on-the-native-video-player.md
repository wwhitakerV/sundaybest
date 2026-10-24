# ADR 0038 — The launch intro on the phone's own video player

- **Status:** Accepted
- **Date:** 2026-10-24
- **Deciders:** @wwhitakerv
- **Amends:** ADR 0028's choice of player, kept by ADRs 0030 and 0031

## Context

The paint intro was played with Skia's video player (`useVideo`), its frames
drawn into a canvas. Skia's player was chosen for the water intro (ADR 0028),
whose drain revealed the live page through a mask drawn over each frame.

The paint movie needs no mask: it plays full screen, holds on white, and hands
over at once (its fade is empty).

After the move to Expo SDK 58 (ADR 0037), Skia 2.14's player frees each frame as
the next arrives:

- Recording frames into a picture crashed the app mid-movie.
- Drawing them with Skia's `Image` showed nothing. The clock ran and the haptics
  fired, but the screen stayed red.

Neither failure logged an error. A launch intro must never do either.

The blank canvas was at least partly Skia issue #4313: after a JS reload,
canvases can draw nothing (patched; see `docs/PROJECT.md`). Even with that
patched, the intro shouldn't depend on Skia's frame handling. The paint movie
needs none of it, and Apple's player is the sturdier path.

## Decision

- **Play it with `expo-video`** (SDK 58's version, in Expo Go): Apple's own
  player, drawing straight to the screen, covering it (`contentFit="cover"`).
- **Muted, and mixing with other audio** (`audioMixingMode: "mixWithOthers"`),
  so the intro never pauses or ducks the reader's music.
- **The same clock, now on the player's time.** The player reports its time
  every 1/60 s (`timeUpdate`). From it:
  - the haptics fire on their moments;
  - the movie pauses on the full white until the page is ready, and plays on
    when it is;
  - the page is revealed, and the intro ends.
- **It never holds the app.** The intro steps aside to the page when:
  - no first frame is on screen within 4 s;
  - the player reports an error;
  - the movie ends before the clock does.
- **Never a black frame.** The video stays unseen over the launch red until its
  first frame is drawn (`onFirstFrameRender`).
- No app config change: the player's plugin is only needed for background
  playback or Picture in Picture, which the intro doesn't use.

## Alternatives

- **Keep Skia's player and copy each frame off the GPU.** That's a full-screen
  copy 120 times a second, and it still depends on Skia's frame handling, which
  changed under us once already.
- **Drop the intro movie for a still.** That loses the intro that was designed.

## Consequences

- One more native module, `expo-video`. It sends nothing off the device: the
  movie is a bundled asset.
- Haptics land within one 60 Hz tick of their frames, not on the frame itself.
- A future intro that needs a mask over the live page would need Skia's player
  (or another way) again.
- `coverFit` is gone; the player covers the screen itself.
