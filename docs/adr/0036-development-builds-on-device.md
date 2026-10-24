# ADR 0036 — Development builds on a real iPhone

- **Status:** Accepted
- **Date:** 2026-10-22
- **Deciders:** @wwhitakerv

## Context

The app has been run in Expo Go on an iPhone 12 Pro Max, because this Mac's
Xcode is too old to build it. Expo Go can't run what's native to SundayBest:
its own haptics module (`SundayBestHaptics`, ADR 0033), its developer-menu
items, its icon — and it isn't the app as it ships. The existing
`development` build profile builds for the iOS Simulator only.

## Decision

- **Add `expo-dev-client`** (installed with `npx expo install`, matched to
  SDK 57): the launcher a development build opens with, to load the app from
  the Mac's dev server — code changes still reload at once, as in Expo Go.
  Its launcher and menu are in Debug builds only; preview and store builds
  carry no developer UI. It sends nothing off the device: it talks only to the
  dev server the developer points it at.
- **Add a `development-device` profile** to `eas.json`: the `development`
  profile, built for a real iPhone (`simulator: false`, Debug), internally
  distributed to devices registered with `npx eas-cli device:create`.
- **Development builds don't upload source maps to Sentry**
  (`SENTRY_DISABLE_AUTO_UPLOAD` in the `development` profile, which
  `development-device` inherits): they report no crashes, and the upload
  needs a Sentry organization, project and token that development doesn't.
  Preview and store builds still upload.
- **Builds run on EAS's servers**, so no local Xcode is needed. A new build
  is needed only when native code changes; everything else reloads.

## Alternatives

- **Keep using Expo Go.** No custom native modules, no developer menu items,
  and never the real app.
- **Build locally with Xcode.** This Mac's Xcode is too old for SDK 57.
- **Test only through `preview` builds or TestFlight.** The real app, but
  every change means a new build — too slow to work in.

## Consequences

- A paid Apple Developer Program membership is needed to install on a device.
- Each iPhone that runs a development build is registered with Apple first.
- `npx eas-cli build --profile development-device --platform ios` makes one;
  `npm run start:dev-build` serves it (`npm run start` serves Expo Go — ADR 0037).
