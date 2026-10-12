import * as SplashScreen from "expo-splash-screen";
import { http, HttpResponse } from "msw";
import { usePathname } from "expo-router";
import type * as ExpoRouter from "expo-router";
import { act, render, screen, waitFor } from "@tests/helpers/render";

import { useLaunchReady } from "@/core/providers/launch-ready";
import { SFProBody } from "@/ui/typography/SFProBody";
import { LAUNCH_REVEAL_MAX_MS } from "@/core/providers/LaunchSplashCoordinator";
import { API_URL, aUser } from "../../factories/api";
import { server } from "../../mocks/server";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  usePathname: jest.fn(() => "/"),
}));

/** A reader who has been here before, wherever the launch lands them. */
function aReturningReaderAt(pathname: string) {
  jest.mocked(usePathname).mockReturnValue(pathname);
  server.use(
    http.get(`${API_URL}/v1/me`, () =>
      HttpResponse.json({ user: aUser({ onboardedAt: "2026-09-01T12:00:00.000Z" }) }),
    ),
  );
}

/** Shows whether the page underneath the launch intro is ready to be revealed. */
function Probe() {
  return <SFProBody>{useLaunchReady() ? "ready" : "waiting"}</SFProBody>;
}

/** The reader never arrives: the request hangs. */
function holdTheReader() {
  server.use(http.get(`${API_URL}/v1/me`, () => new Promise<never>(() => {})));
}

beforeEach(() => {
  jest.mocked(SplashScreen.hideAsync).mockClear();
  jest.mocked(usePathname).mockReturnValue("/");
});

describe("LaunchSplashCoordinator", () => {
  it("lifts the native splash as soon as the app has drawn, without waiting for the reader", async () => {
    holdTheReader();

    render(<Probe />);

    await waitFor(() => expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1));
  });

  it("says the page isn't ready while it doesn't know who the reader is", async () => {
    holdTheReader();

    render(<Probe />);

    await waitFor(() => expect(SplashScreen.hideAsync).toHaveBeenCalled());
    expect(screen.getByText("waiting")).toBeOnTheScreen();
  });

  it("says the page is ready once the reader and their data are in", async () => {
    render(<Probe />);

    expect(await screen.findByText("ready")).toBeOnTheScreen();
  });

  it("treats whichever page a launch lands on as the one to reveal: a plan opened straight from a link", async () => {
    aReturningReaderAt("/plans/plan-1");

    render(<Probe />);

    expect(await screen.findByText("ready")).toBeOnTheScreen();
  });

  it("waits while a returning reader is still on their way past the first route", async () => {
    aReturningReaderAt("/");

    render(<Probe />);

    await waitFor(() => expect(SplashScreen.hideAsync).toHaveBeenCalled());
    expect(screen.getByText("waiting")).toBeOnTheScreen();
  });

  it("never holds the reveal for good: a few seconds on, it's ready even if the reader never arrives", async () => {
    jest.useFakeTimers({ advanceTimers: true });
    holdTheReader();
    render(<Probe />);
    expect(screen.getByText("waiting")).toBeOnTheScreen();

    act(() => jest.advanceTimersByTime(LAUNCH_REVEAL_MAX_MS));

    expect(await screen.findByText("ready")).toBeOnTheScreen();
    jest.useRealTimers();
  });
});
