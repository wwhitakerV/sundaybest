import { timeoutManager } from "@tanstack/react-query";

import { server } from "../mocks/server";
import type * as SlotModule from "expo-router/build/ui/Slot";

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
