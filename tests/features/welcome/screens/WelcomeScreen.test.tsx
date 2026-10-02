import { AccessibilityInfo } from "react-native";
import { act, render, screen, fireEvent } from "@tests/helpers/render";
import { useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { SAMPLE_PLAN_ID } from "@/core/mock-data";
import { AppStoreProvider, INITIAL_STATE, type AppState } from "@/core/store";
import { tapFeedback } from "@/core/haptics/haptics";
import { WelcomeScreen } from "@/features/welcome/screens/WelcomeScreen";

jest.mock("@/core/haptics/haptics", () => ({ tapFeedback: jest.fn() }));

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useFocusEffect: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

beforeEach(() => {
  // Welcome listens for its own transitions to restart the intro on each visit.
  jest.mocked(useNavigation).mockReturnValue({ addListener: () => () => undefined });
  mockPush.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

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
      fontFamily: "BodoniModa9pt-Medium",
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

  it("taps, and goes to the Home tab, when Get a plan now is pressed by someone with plans", () => {
    render(<WelcomeScreen />);

    jest.useFakeTimers({ advanceTimers: true });
    fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));
    act(() => {
      jest.advanceTimersByTime(32);
    });

    expect(tapFeedback).toHaveBeenCalledTimes(1);
    expect(mockPush.mock.calls).toEqual([["/(tabs)/home"]]);
  });

  it("goes Home and straight on to paste a sermon for someone with no plans", () => {
    const noPlans: AppState = {
      ...INITIAL_STATE,
      plans: Object.fromEntries(
        Object.entries(INITIAL_STATE.plans).filter(([, plan]) => plan.isSample),
      ),
    };
    render(
      <AppStoreProvider initialState={noPlans}>
        <WelcomeScreen />
      </AppStoreProvider>,
    );

    jest.useFakeTimers({ advanceTimers: true });
    fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));
    act(() => {
      jest.advanceTimersByTime(32);
    });

    expect(mockPush.mock.calls).toEqual([["/(tabs)/home"], ["/(plan-creation)/paste-sermon"]]);
  });

  it("shows a spinner on Get a plan now once it is pressed", () => {
    render(<WelcomeScreen />);

    fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));

    expect(screen.getByTestId("welcome-get-a-plan-now-button-spinner")).toBeVisible();
  });

  it("navigates to Plan Overview with the sample plan when See a sample plan is pressed", () => {
    render(<WelcomeScreen />);

    fireEvent.press(screen.getByTestId("welcome-sample-plan-button"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(tabs)/plans/[planId]",
      params: { planId: SAMPLE_PLAN_ID },
    });
  });
});
