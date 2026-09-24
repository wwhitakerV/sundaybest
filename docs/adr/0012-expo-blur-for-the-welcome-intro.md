# ADR 0012 — `expo-blur` softens the Welcome intro's phones while they move

- **Status:** Reverted (2026-09-23) — tried and removed; see "Outcome" below
- **Date:** 2026-09-23
- **Deciders:** @wwhitakerv

## Context

The Welcome screen's intro (`src/features/welcome`) shows real mock screens
inside drawn phones. When a card takes the stage it grows from its small,
dimmed size to the big phone over ~750ms. iOS resamples the already-drawn
text at every in-between size, so for about half a second the phone looks
chopped and mushy before landing sharp.

React Native cannot blur a view on iOS on its own: the `filter: blur(...)`
style is Android- and web-only. A real blur needs Apple's
`UIVisualEffectView`, i.e. a native module.

## Decision

We add `expo-blur` (the Expo SDK 57 package, `~57.0.3`) and lay an animated
`BlurView` over each fan card's screen content — below the status bar,
inside the screen (`PhoneFrame`'s `contentOverlay`), so the phone itself
stays sharp and only the screen's elements soften. It goes soft the moment
the card starts to move, holds while it glides, and clears once it lands — so the unsharp frames
read as a deliberate refocus rather than a rendering flaw. Intensity is
animated with Reanimated (`useTransitionBlur`); at rest it is 0.

It is a visual component with no side effects, so it is imported where it is
used (`FanCard`), not wrapped in `src/core`.

## Consequences

### Good

- The in-between frames look intentional; nothing about the story's
  choreography had to change.
- An Expo SDK package: version-matched to the SDK, MIT, zero dependencies of
  its own, and already mocked by `jest-expo`.

### Bad

- A native module: **the iOS development build must be rebuilt**
  (`npx expo run:ios`, or a new EAS dev-client build) before it shows.
- Seven live blur views on one screen during a transition — cheap at
  intensity 0, but worth watching for dropped frames on older phones.

### Neutral

- No permission, entitlement, or data flow; no privacy impact.

## Alternatives considered

| Option                                              | Why not                                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| A soft white veil over the phone, no dependency     | Not a blur — reads as a wash, not a refocus. Offered; declined in favour of the real thing.                 |
| Never scale the big phone (crossfade turns instead) | Sharp on every frame, but a larger rework of the choreography. Kept in reserve if the blur doesn't satisfy. |
| Render the mocks natively at each size              | Sharpest possible, but a large refactor of every mock; out of proportion to the problem.                    |

## Removal

If the blur isn't wanted: delete the `AnimatedBlurView` from `FanCard`,
delete `useTransitionBlur`, `npm uninstall expo-blur`, and rebuild. Nothing
else depends on it.

## Verification

`expo-blur` is imported only in `src/features/welcome/components/FanCard.tsx`
(`grep -rn "expo-blur" src`). `npm audit` stays at zero.

## Outcome

Tried on device and rejected: a deliberate blur still isn't crisp, and the
goal is a phone that is crisp on every frame it's read. Replaced by a
**held phone**: a fixed, full-size copy of the big phone sits at its landed
position and fades in over the moving card the moment the card looks landed,
carries the turn, and vanishes as the card moves off. The moving cards are
never read closely while in motion. `expo-blur` was uninstalled; nothing
depends on it.
