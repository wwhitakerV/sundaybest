# ADR 0024 — Images through expo-image

- **Status:** Accepted
- **Date:** 2026-10-05
- **Deciders:** @wwhitakerv

## Context

Sermon artwork (YouTube thumbnails) appears on Home, Plans, the plan hero,
New Plan, and search, and was drawn with React Native's `Image`: decoded on
the main thread, cached only loosely, and fetched again on screens the reader
had just seen. Artwork arrived visibly late on screens that were otherwise
ready.

## Decision

Artwork renders through `expo-image` (a native module, added with
`npx expo install` and its config plugin in `app.config.ts`):

- `VideoThumbnail` — every artwork in the app — draws with
  `cachePolicy: "memory-disk"`, so an image seen once draws at once everywhere.
- `prefetchImages` (`src/core/images`) warms the artwork of the plans on Home
  and Plans before they're shown. It's a network side effect, so it lives in
  `src/core` like every other.
- `LoadingScreen` draws the same wordmark image as the native splash, so the
  hand-over from splash to app is invisible.

The alternative — keeping React Native's `Image` and its default cache — was
rejected: it has no disk policy or prefetch we control, and decodes on the
main thread.

The hero's faint artwork wash stays an SVG image under a gradient mask; it is
a low-opacity tint, and the mask needs it inside the SVG.

## Consequences

- A native module: it ships with a new build, not an OTA update.
- No data leaves the device that didn't before: the same thumbnail URLs are
  fetched, earlier.
