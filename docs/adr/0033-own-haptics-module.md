# ADR 0033 — Our own haptics module, for a tap at a set intensity

- **Status:** Accepted
- **Date:** 2026-10-19
- **Deciders:** @wwhitakerv

## Context

Home's welcome types its note in a letter at a time, with a haptic tick that
runs the whole time. expo-haptics offers only fixed styles: a selection tick
and Light / Medium / Heavy / Soft / Rigid impacts. Even the lightest of them,
repeated every few letters, read as too hard. iOS's impact generator takes an
intensity from 0 to 1 (`UIImpactFeedbackGenerator.impactOccurred(intensity:)`,
iOS 13+), which expo-haptics doesn't expose.

## Decision

- **A local Expo module, `modules/sundaybest-haptics`** (iOS only, picked up by
  Expo's autolinking from `modules/`), with one function, `tap(intensity)`: a
  Light impact at that intensity, on the main queue, its generator kept
  prepared for the next.
- **It's reached only through `src/core/haptics`** (`typingFeedback`), like
  every side-effect SDK: loaded with `requireOptionalNativeModule`, so a build
  without it — a dev client not yet rebuilt, or Jest — falls back to the
  selection tick instead of failing.
- **The typing tick** is the module's tap at `TYPING_INTENSITY` (0.3), on
  every letter (Home's `use-typewriter.ts`).

## Alternatives

- **Fewer selection ticks.** Lighter overall, but each tick is as firm as
  before; it reads as sparse, not soft.
- **Core Haptics (`CHHapticEngine`) patterns.** Finer control (intensity and
  sharpness per event), but an engine to start, stop and recover for one
  repeated tap. The impact generator's intensity is enough.
- **A third-party haptics package.** None in use offers per-tap intensity on
  iOS; a dependency for one function isn't worth it.

## Consequences

- A native change: it ships with a new build (`npx expo prebuild -p ios`, then
  `npx expo run:ios`), not an OTA update. Until then the fallback runs.
- No permission, entitlement or data leaves the device.
