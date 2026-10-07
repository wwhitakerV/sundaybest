import { AccessibilityInfo } from "react-native";
import { http, HttpResponse } from "msw";
import { act, render, screen, fireEvent, waitFor } from "@tests/helpers/render";
import { useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL, aUser } from "@tests/factories/api";
import { aPlan } from "@tests/factories/api-plans";
import { servePlans } from "@tests/mocks/plans-api";
import { server } from "@tests/mocks/server";
import { planOverviewHref } from "@/entities/plan";
import { tapFeedback } from "@/core/haptics/haptics";
import { STORY_BEATS } from "@/features/welcome/logic/story";
import { WelcomeScreen } from "@/features/welcome/screens/WelcomeScreen";

jest.mock("@/core/haptics/haptics", () => ({ tapFeedback: jest.fn() }));

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useFocusEffect: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

type Listener = (event: { data?: { closing?: boolean } }) => void;
const listeners = new Map<string, Listener[]>();

/** Fires the navigation event the way the native stack would. */
function fire(name: string, event: Parameters<Listener>[0] = {}) {
  act(() => {
    for (const listener of listeners.get(name) ?? []) listener(event);
  });
}

beforeEach(() => {
  listeners.clear();
  // Welcome listens for its own navigation events to restart the intro on each visit.
  jest.mocked(useNavigation).mockReturnValue({
    addListener: (name: string, listener: Listener) => {
      listeners.set(name, [...(listeners.get(name) ?? []), listener]);
      return () => undefined;
    },
  });
  mockPush.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

/** A sample plan the reader can look at before making their own. */
const SAMPLE = aPlan({ seed: 9, status: "ready", isSample: true, title: "A sample plan" });

/** The server, for these plans: it records each time onboarding is completed. */
function serveWelcome(plans: Parameters<typeof servePlans>[0]) {
  servePlans(plans);
  let onboarded = 0;
  server.use(
    http.post(`${API_URL}/v1/me/onboarding/complete`, () => {
      onboarded += 1;
      return HttpResponse.json({ user: aUser({ onboardedAt: "2026-10-05T12:00:00.000Z" }) });
    }),
  );
  return { onboardings: () => onboarded };
}

describe("WelcomeScreen", () => {
  it("is addressable as welcome-screen", () => {
    render(<WelcomeScreen />);

    expect(screen.getByTestId("welcome-screen")).toBeVisible();
  });

  it("shows the app name", () => {
    render(<WelcomeScreen />);

    expect(screen.getByText("SUNDAYBEST")).toBeVisible();
  });

  it("renders the app name in the masthead font", () => {
    render(<WelcomeScreen />);

    expect(screen.getByText("SUNDAYBEST")).toHaveStyle({
      fontFamily: "LibreBaskerville-Medium",
    });
  });

  it("shows the tagline", () => {
    render(<WelcomeScreen />);

    expect(screen.getByText("We keep you in God's word. All week.")).toBeVisible();
  });

  it("shows the headline", () => {
    render(<WelcomeScreen />);

    expect(screen.getByText("A new way to study the sermons you love.")).toBeVisible();
  });

  /**
   * The dimmed half is an inline span for colour only. If it ever set its own
   * size or weight it would stop inheriting, and the sentence would break at
   * the boundary instead of rewrapping as one paragraph.
   */
  it("tints the second half of the headline without restyling it", () => {
    render(<WelcomeScreen />);

    const dimmed = screen.getByText("study the sermons you love.");

    expect(dimmed).toHaveStyle({ color: "#8A8A92" });
    expect(dimmed.props.style).not.toHaveProperty("fontSize");
    expect(dimmed.props.style).not.toHaveProperty("fontWeight");
  });

  it("shows the fanned preview of the app's screens", () => {
    render(<WelcomeScreen />);

    expect(screen.getByTestId("welcome-screen-fan")).toBeVisible();
  });

  it("tells the three steps through the fan while the intro plays", () => {
    render(<WelcomeScreen />);

    expect(screen.getByTestId("welcome-screen-fan")).toHaveProp(
      "accessibilityLabel",
      "How SundayBest works: Paste any sermon link. Get a plan for 1 to 7 days. Read, reflect, pray, and quiz.",
    );
    expect(screen.queryByText("Paste any sermon link")).toBeNull();
  });

  it("lists the three steps instead when Reduce Motion is on", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    render(<WelcomeScreen />);

    expect(await screen.findByText("Paste any sermon link")).toBeVisible();
    expect(screen.getByText("Get a plan for 1 to 7 days")).toBeVisible();
    expect(screen.getByText("Read, reflect, pray, and quiz")).toBeVisible();
  });

  it("shows the weekday strip", () => {
    render(<WelcomeScreen />);

    expect(screen.getByTestId("welcome-day-strip")).toBeVisible();
  });

  it("shows the get-a-plan-now primary action", () => {
    render(<WelcomeScreen />);

    expect(screen.getByTestId("welcome-get-a-plan-now-button")).toBeVisible();
    expect(screen.getByText("Get a plan now")).toBeVisible();
  });

  it("shows the sample-plan secondary action", () => {
    render(<WelcomeScreen />);

    expect(screen.getByTestId("welcome-sample-plan-button")).toBeVisible();
    expect(screen.getByText("See a sample plan")).toBeVisible();
  });

  it("shows the free, no-account footnote", () => {
    render(<WelcomeScreen />);

    expect(screen.getByText("Free. No account needed.")).toBeVisible();
  });

  it("taps, and goes to the Home tab, when Get a plan now is pressed by someone with plans", async () => {
    serveWelcome([aPlan(), SAMPLE]);
    render(<WelcomeScreen />);
    // Its plans have arrived, so it knows there are some.
    await waitFor(() => expect(screen.getByTestId("welcome-sample-plan-button")).toBeVisible());

    fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));

    expect(tapFeedback).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockPush.mock.calls).toEqual([["/(tabs)/home"]]));
  });

  it("goes Home and straight on to paste a sermon for someone with no plans", async () => {
    serveWelcome([SAMPLE]);
    render(<WelcomeScreen />);
    await waitFor(() => expect(screen.getByTestId("welcome-sample-plan-button")).toBeVisible());

    fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));

    await waitFor(() =>
      expect(mockPush.mock.calls).toEqual([["/(tabs)/home"], ["/(plan-creation)/paste-sermon"]]),
    );
  });

  it("records the reader as onboarded before it goes anywhere, once however often it's pressed", async () => {
    const welcome = serveWelcome([aPlan(), SAMPLE]);
    render(<WelcomeScreen />);

    fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));
    fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));

    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    expect(welcome.onboardings()).toBe(1);
    expect(tapFeedback).toHaveBeenCalledTimes(1);
  });

  it("navigates to Plan Overview with the sample plan when See a sample plan is pressed", async () => {
    serveWelcome([SAMPLE]);
    render(<WelcomeScreen />);
    await waitFor(() => expect(screen.getByTestId("welcome-sample-plan-button")).toBeVisible());

    fireEvent.press(screen.getByTestId("welcome-sample-plan-button"));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(planOverviewHref(SAMPLE.id)));
  });

  it("keeps the intro on screen while it's being left", () => {
    render(<WelcomeScreen />);

    fire("blur");
    fire("transitionEnd", { data: { closing: true } });

    expect(screen.getByTestId("welcome-screen-fan")).toBeVisible();
  });

  it("holds the intro still once it's being left", () => {
    jest.useFakeTimers();
    const arriveMs = STORY_BEATS[0]?.holdMs ?? 0;
    const pasteMs = STORY_BEATS[1]?.holdMs ?? 0;
    render(<WelcomeScreen />);
    act(() => {
      jest.advanceTimersByTime(arriveMs + 1);
    });
    expect(screen.getByTestId("welcome-screen-fan-caption")).toHaveTextContent(
      "Paste any sermon link",
    );

    fire("blur");
    act(() => {
      jest.advanceTimersByTime(pasteMs + 1000);
    });

    expect(screen.getByTestId("welcome-screen-fan-caption")).toHaveTextContent(
      "Paste any sermon link",
    );
  });
});
