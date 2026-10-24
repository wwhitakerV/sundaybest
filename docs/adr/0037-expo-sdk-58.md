# ADR 0037 — Expo SDK 58, and Expo Go again

- **Status:** Accepted
- **Date:** 2026-10-23
- **Deciders:** @wwhitakerv

## Context

The App Store's Expo Go moved to SDK 58, and Expo Go runs only its own SDK,
so it stopped opening this SDK 57 project. An iPhone can't install an older
Expo Go. The development build (ADR 0036) is the other way to run the app,
but it couldn't reach the dev server on the developer's phone, and day-to-day
work was done in Expo Go.

## Decision

- **Move to Expo SDK 58**: React Native 0.88, React 19.3. Packages are
  `npx expo install --fix`'s versions. The rest are pinned exactly:
  `@expo/app-integrity` 58.0.2, Jest 30.5.2 (with `babel-jest` and
  `@types/jest` 30), Testing Library 14.1.0, `typescript-eslint` 8.72.0. The
  last matches `eslint-config-expo`'s own copy, since ESLint refuses two copies
  of one plugin.
- **`npm run start` serves Expo Go** (`--go`). `npm run start:tunnel` does the
  same over Expo's tunnel, for a phone off the Mac's Wi-Fi.
  `npm run start:dev-build` serves the development build, which needs
  rebuilding on SDK 58 before it's used again.
- **What the upgrade changed in the app:**
  - **React Native 0.87's strict TypeScript API is deferred.**
    `customConditions: ["react-native", "react-native-legacy-deep-imports"]` in
    `tsconfig.json`, Expo's documented opt-out, which goes after RN 0.89. Until
    then, refs typed by a component (`useRef<View>`) keep compiling.
  - **Skia 2.14 paths are immutable.** RISE builds its shapes with
    `Skia.PathBuilder` and draws `builder.detach()`.
  - **Expo Router 58's tab bar** gets `emitter` and `navigateToTab` instead of
    the navigator's `navigation`. The tab bar emits `tabPress` and switches tabs
    with them. A second tap's reset (`stackRootReset`) finds the tabs' state in
    the stack above them (`tabsHolding`) and is dispatched through the
    navigation container. Its types come from `expo-router/tabs`, the public
    path.
  - **Gesture Handler 3** keeps the `Gesture.*` builders, now deprecated. The
    app still uses them; moving to its hooks is later work.
  - **Jest** uses Reanimated's own resolver
    (`react-native-reanimated/jest/resolver`). Without it, Reanimated 4.7's
    native start-up throws before a test runs.
  - **Splash screen** functions are imported by name. The import plugin can't
    follow `expo-splash-screen` 58's export map through `import * as`.
  - **The date picker's optional `react-native-windows` peer** trips npm's
    resolver when the picker is upgraded in place. A fresh `node_modules` and
    lockfile resolve cleanly.

## Alternatives

- **Stay on SDK 57 and use only the development build.** The supported route,
  but it wasn't working on the phone, and every native change means a build.
- **Wait for nothing.** Expo Go won't return to SDK 57.

## Consequences

- Expo Go works again for everything it can run. The app's own haptics module
  (ADR 0033) isn't in Expo Go, so the standard haptics stand in, as before.
- The development build on the phone is out of date until rebuilt
  (`npx eas-cli build --profile development-device --platform ios`).
- The strict React Native types are still to adopt before RN 0.89.
- Gesture Handler's builders are deprecated. Moving to its hooks is later work.
