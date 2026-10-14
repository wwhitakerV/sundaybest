import { timeoutManager } from "@tanstack/react-query";

import { server } from "../mocks/server";
import type * as SlotModule from "expo-router/build/ui/Slot";
import type * as ReactModule from "react";
import type * as ReactNativeModule from "react-native";

// ---------------------------------------------------------------------------
// TanStack Query's timers
// ---------------------------------------------------------------------------
// Every query a test leaves behind keeps a garbage-collection timer for its
// `gcTime` (ten minutes), and in Node a pending timer keeps the process alive —
// so a single suite run with `npx jest <file>` sat for ten minutes after it
// passed. These timers still run as they would; they just no longer hold the
// process open. The globals are looked up on every call, so a test's fake
// timers still govern them.
type TimerHandle = ReturnType<typeof setTimeout>;
const unref = (handle: TimerHandle): TimerHandle => {
  (handle as { unref?: () => void }).unref?.();
  return handle;
};
timeoutManager.setTimeoutProvider<TimerHandle>({
  setTimeout: (callback, delay) => unref(globalThis.setTimeout(callback, delay)),
  clearTimeout: (handle) => globalThis.clearTimeout(handle),
  setInterval: (callback, delay) => unref(globalThis.setInterval(callback, delay)),
  clearInterval: (handle) => globalThis.clearInterval(handle),
});

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------
// `src/core/config/env.ts` parses process.env at module scope and throws if the
// environment is invalid, exactly as it would on a device. Tests therefore need
// an environment, the same way a build does — without one, importing anything
// that reaches config would fail for reasons unrelated to the test.
//
// These are the development defaults from .env.example. `??=` means a real value
// from the shell or a .env file still wins, and a test that cares about a
// specific value sets it explicitly (see src/core/config/env.test.ts).
process.env.EXPO_PUBLIC_APP_VARIANT ??= "development";
process.env.EXPO_PUBLIC_API_URL ??= "https://api.sundaybest.com";
process.env.EXPO_PUBLIC_ATTESTATION_ENABLED ??= "false";
process.env.EXPO_PUBLIC_SENTRY_DSN ??= "";
process.env.EXPO_PUBLIC_USE_RN_FETCH ??= "1";

// ---------------------------------------------------------------------------
// MSW lifecycle
// ---------------------------------------------------------------------------
// `onUnhandledRequest: "error"` is deliberate: an un-mocked request fails the
// test instead of silently hitting the network or hanging. If a test needs an
// endpoint, it says so with `server.use(...)`.
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

// Per-test handlers added with `server.use(...)` are dropped here, so tests
// cannot leak request mocks into each other.
afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// ---------------------------------------------------------------------------
// Native module mocks
// ---------------------------------------------------------------------------
// Home for mocks of modules with native side effects. Later prompts add the
// security SDKs (secure storage, attestation, integrity) here as they land in
// src/core.
//
// Two rules:
//   1. Mock the module, not our wrapper around it. The wrapper in src/core is
//      what we want under test.
//   2. Keep mocks honest — a mocked keychain that always resolves will hide
//      every failure path we actually care about.

// expo-font never actually loads a font file under Jest (there is no native
// font-loading step in the test environment), so `useFonts()` would report
// `loaded: false` forever without this — and every test that renders through
// `AppProviders` (which is nearly all of them, via test/render.tsx) would see
// nothing but the held splash screen instead of the component under test.
// `useAppFonts`'s own test (src/core/fonts/use-app-fonts.test.ts) mocks
// `expo-font` itself and asserts the not-loaded and error branches directly,
// so this global default does not hide those paths — it only keeps every
// *other* test's render path unblocked.
// jest-expo's stand-in for expo-crypto's native module returns `undefined`
// from `randomUUID`, so nothing that mints an id can work under test — the
// development session's install id among them, and with it every API
// request. Node's own generator is the honest equivalent; the rest of the
// module is left as it is.
jest.mock("expo-crypto", () => ({
  ...jest.requireActual<object>("expo-crypto"),
  randomUUID: () => jest.requireActual<{ randomUUID: () => string }>("node:crypto").randomUUID(),
}));

// expo-localization reads the iPhone's settings natively. The stand-in is an
// iPhone on a 12-hour clock; a test of the 24-hour clock spies on
// `getCalendars` to say so. A plain function, not `jest.fn`, so resetting mocks
// between tests leaves it working.
jest.mock("expo-localization", () => ({
  // So `import * as` shares this object, and a spy on it reaches the app's import.
  __esModule: true,
  getCalendars: () => [
    { calendar: "gregory", timeZone: "America/Chicago", uses24hourClock: false, firstWeekday: 1 },
  ],
}));

jest.mock("expo-font", () => ({
  useFonts: () => [true, null],
}));

// FlashList measures its window and rows natively, and Jest has no layout: a
// 400×900 window and 100pt rows stand in, so a list draws the rows that would
// fit, as on the phone. (FlashList's own `jestSetup` does this too, but in 2.0.2
// it also swaps `FlashList` for an export that's gone, leaving it undefined.)
jest.mock("@shopify/flash-list/dist/recyclerview/utils/measureLayout", () => ({
  ...jest.requireActual<object>("@shopify/flash-list/dist/recyclerview/utils/measureLayout"),
  measureParentSize: () => ({ x: 0, y: 0, width: 400, height: 900 }),
  measureFirstChildLayout: () => ({ x: 0, y: 0, width: 400, height: 900 }),
  measureItemLayout: () => ({ x: 0, y: 0, width: 100, height: 100 }),
}));
// AppProviders calls expo-splash-screen at both module scope
// (preventAutoHideAsync) and inside the component (hideAsync once fonts are
// ready), and it is imported by nearly every test via test/render.tsx.
// AppProviders' own test (src/core/providers/AppProviders.test.tsx) mocks
// this module itself to assert the hide/no-hide behaviour directly.
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(true),
  hideAsync: jest.fn().mockResolvedValue(undefined),
  setOptions: jest.fn(),
}));

// React Native's `Vibration` module has no native side under Jest and throws
// the moment anything calls `Vibration.vibrate` — kept mocked so a test can
// prove nothing does (the study's entrance stays silent). Mocked at this exact internal path
// (not the top-level `react-native` package, which would also swallow
// every other RN export the test environment needs) so only the one
// module with no test-environment implementation is replaced.
jest.mock("react-native/Libraries/Vibration/Vibration", () => ({
  default: { vibrate: jest.fn(), cancel: jest.fn() },
}));

// Expo Router's `Link.AppleZoom` (iOS's zoom transition source) wraps its
// child in a native view that has no implementation under Jest, which renders
// it empty — dropping the whole card it's meant to host. The transition
// itself is native-only and can't be exercised here, so this stands in with
// the real Link.AppleZoom's own fallback — Expo Router's `Slot`, which it
// renders wherever zoom is off. Using the real `Slot` keeps its rules in play
// (it refuses a child whose `style` is an array, as it does on device).
jest.mock("expo-router/build/link/zoom/link-apple-zoom", () => ({
  LinkAppleZoom: jest.requireActual<typeof SlotModule>("expo-router/build/ui/Slot").Slot,
}));

// expo-web-browser opens SFSafariViewController, which has no implementation
// under Jest. Stands in with what iOS reports when the reader closes the sheet
// (`cancel`); tests of src/core/links override it to exercise `locked` and a
// rejected open.
jest.mock("expo-web-browser", () => ({
  openBrowserAsync: jest.fn().mockResolvedValue({ type: "cancel" }),
  WebBrowserPresentationStyle: { PAGE_SHEET: "pageSheet" },
  WebBrowserResultType: { CANCEL: "cancel", DISMISS: "dismiss", LOCKED: "locked" },
}));

// Skia draws on the GPU, natively, so under Jest there's nothing to draw on.
// Its own Jest setup needs a WebAssembly test environment, so this stands in
// instead: the canvas is a plain View (so it can be found and its props
// asserted), pictures render nothing, and every drawing call is a no-op that
// returns another no-op. What's drawn is covered by the launch intro's pure
// frame tests, not here.
jest.mock("@shopify/react-native-skia", () => {
  const { createElement } = jest.requireActual<typeof ReactModule>("react");
  const { View } = jest.requireActual<typeof ReactNativeModule>("react-native");
  // In arithmetic it counts as 0 (a path's bounds, a colour's channels), so maths on what
  // Skia hands back still runs.
  const noop: unknown = new Proxy(() => undefined, {
    get: (_target, key) =>
      key === "then" ? undefined : key === Symbol.toPrimitive ? () => 0 : noop,
    apply: () => noop,
  });
  return {
    Canvas: (props: object) => createElement(View, props),
    Picture: () => null,
    createPicture: () => noop,
    Skia: noop,
    TileMode: noop,
    BlendMode: noop,
    ClipOp: noop,
    PaintStyle: noop,
    StrokeCap: noop,
    StrokeJoin: noop,
    ColorChannel: noop,
    FilterMode: noop,
    MipmapMode: noop,
    // A video that never loads: no frame, still at its start, as a phone sees it
    // before the movie has opened.
    useVideo: () => ({
      currentFrame: { value: null, get: () => null },
      currentTime: { value: 0, get: () => 0 },
      duration: 0,
      framerate: 0,
      rotation: 0,
      size: { width: 0, height: 0 },
    }),
  };
});

// Reanimated's own Jest mock (which expo-router's testing library installs)
// has no `useFrameCallback`. It's added to that mock module itself, which
// every test's Reanimated resolves to. The stand-in never calls back: under
// Jest no frames are drawn, so a frame-driven animation stays on its first
// frame.
jest.requireActual<Record<string, unknown>>("react-native-reanimated/mock").useFrameCallback =
  () => ({ setActive: () => undefined, isActive: false, callbackId: -1 });

// Nor `LayoutAnimationConfig` ("ADD ME IF NEEDED", it says). Under Jest no
// layout animation plays, so skipping one changes nothing: it only passes its
// children through.
jest.requireActual<Record<string, unknown>>("react-native-reanimated/mock").LayoutAnimationConfig =
  ({ children }: { children: ReactModule.ReactNode }) => children;

// Its `useAnimatedScrollHandler` hands back a handler that does nothing, so a
// page that follows its scroll on the UI thread (Plans' title) could never be
// tested. This one runs the handler with the scroll event, as the UI thread
// would — given a function, or `{ onScroll }`.
type ScrollWorklet = (event: { contentOffset: { x: number; y: number } }) => void;
jest.requireActual<Record<string, unknown>>(
  "react-native-reanimated/mock",
).useAnimatedScrollHandler =
  (handler: ScrollWorklet | { onScroll?: ScrollWorklet }) =>
  (event: { nativeEvent: Parameters<ScrollWorklet>[0] }) =>
    (typeof handler === "function" ? handler : handler.onScroll)?.(event.nativeEvent);

// ---------------------------------------------------------------------------
// Timer policy
// ---------------------------------------------------------------------------
// Real timers by default. Fake timers interact badly with React Native Testing
// Library's async helpers (`waitFor` polls on a timer, so faking time without
// `advanceTimers` deadlocks the helper it is waiting on).
//
// A test that needs to control time opts in explicitly:
//
//     jest.useFakeTimers({ advanceTimers: true });
//
// `advanceTimers: true` keeps RNTL's polling alive.
//
// One exception worth knowing about: Expo Router's `renderRouter` calls
// `jest.useFakeTimers()` itself (it pins the system clock to work around
// expo#46864), so route-level tests are already on fake timers whether they
// asked or not. The afterEach below returns every test to real timers, so
// neither that nor an explicit opt-in can leak into the next file.
afterEach(() => {
  jest.useRealTimers();
});
