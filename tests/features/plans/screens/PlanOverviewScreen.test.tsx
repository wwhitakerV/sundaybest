import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { tapFeedback } from "@/core/haptics/haptics";
import { AppStoreProvider, INITIAL_STATE, appReducer, type AppState } from "@/core/store";
import { PlanOverviewScreen } from "@/features/plans/screens/PlanOverviewScreen";

jest.mock("@/core/haptics/haptics", () => ({ tapFeedback: jest.fn(), sparkBuzz: jest.fn() }));

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn<{ planId: string }, []>(),
  // The screen's shown — so the tab bar and status bar may follow it.
  useIsFocused: () => true,
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockBack = jest.fn<void, []>();
// Under way: six days, day 1 done, day 2 today, days 3–6 locked.
const ACTIVE = "plan-choose-whom-you-will-serve";
// Ready and not started: three days, day 1 open.
const READY = "plan-faith-through-the-storm";

function renderOverview(planId: string, state?: AppState) {
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId });
  return render(
    state ? (
      <AppStoreProvider initialState={state}>
        <PlanOverviewScreen />
      </AppStoreProvider>
    ) : (
      <PlanOverviewScreen />
    ),
  );
}

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({
    push: mockPush,
    back: mockBack,
  } as unknown as ReturnType<typeof useRouter>);
});

describe("PlanOverviewScreen", () => {
  it("is addressable as plan-overview-screen", () => {
    renderOverview(ACTIVE);

    expect(screen.getByTestId("plan-overview-screen")).toBeVisible();
  });

  it("shows nothing for a plan that doesn't exist", () => {
    renderOverview("no-such-plan");

    expect(screen.queryByTestId("plan-overview-screen")).toBeNull();
  });

  it("puts the plan in context: where it stands, its title, and its church", () => {
    renderOverview(ACTIVE);

    expect(screen.getByTestId("plan-overview-status")).toHaveTextContent(
      "IN PROGRESS · DAY 2 OF 6",
    );
    expect(screen.getByTestId("plan-overview-title")).toHaveTextContent(
      "Today I Choose to Be a Blessing",
    );
    expect(screen.getByText("VOUS Church")).toBeVisible();
  });

  it("sets its hero in the sermon's colours", () => {
    renderOverview(ACTIVE);

    expect(screen.getByTestId("plan-overview-hero")).toHaveStyle({ backgroundColor: "#3D403F" });
  });

  it("washes the sermon's still faintly across the hero, behind its artwork", () => {
    // A sermon with its still on the web (a bundled one has no address under Jest).
    renderOverview(READY);

    expect(screen.getByTestId("plan-overview-hero-backdrop-underlay")).toHaveProp("opacity", 0.2);
  });

  it("lays its colour back over the artwork's lower part once the hero's measured", () => {
    renderOverview(ACTIVE);

    fireEvent(screen.getByTestId("plan-overview-hero"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 393, height: 700 } },
    });

    expect(screen.getByTestId("plan-overview-hero-cover-fill").props.mask).toBeTruthy();
  });

  it("covers the still with that colour too, rather than carrying it down the words", () => {
    renderOverview(READY);

    fireEvent(screen.getByTestId("plan-overview-hero"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 393, height: 700 } },
    });

    expect(screen.getByTestId("plan-overview-hero-cover")).toBeOnTheScreen();
    expect(screen.queryByTestId("plan-overview-hero-cover-underlay")).toBeNull();
  });

  it("lets the hero's colour reach past its top, so a pull down zooms it up to the screen's", () => {
    renderOverview(ACTIVE);

    expect(screen.getByTestId("plan-overview-hero")).not.toHaveStyle({ overflow: "hidden" });
    expect(screen.getByTestId("plan-overview-hero-colour")).toHaveStyle({
      transformOrigin: "bottom",
    });
    expect(screen.getByTestId("plan-overview-hero-content-colour")).toHaveStyle({
      transformOrigin: "bottom",
    });
  });

  it("still keeps the artwork within the hero", () => {
    renderOverview(ACTIVE);

    expect(screen.getByTestId("plan-overview-hero-artwork-clip")).toHaveStyle({
      overflow: "hidden",
    });
  });

  it("floats Back and More over the hero, dark over its dark colour", () => {
    renderOverview(ACTIVE);

    expect(screen.getByTestId("plan-overview-back-button")).toHaveStyle({
      backgroundColor: "rgba(8, 9, 10, 0.5)",
    });
    expect(screen.getByTestId("plan-overview-more-button")).toHaveStyle({
      backgroundColor: "rgba(8, 9, 10, 0.5)",
    });
  });

  it("has one Continue at rest — the hero's", () => {
    renderOverview(ACTIVE);

    expect(screen.getAllByText("Continue Day 2")).toHaveLength(1);
    expect(screen.getByTestId("plan-overview-continue-button")).toHaveAccessibleName(
      "Continue Day 2",
    );
  });

  it("fades its content in as it appears, rather than cutting to it", () => {
    renderOverview(ACTIVE);

    expect(
      within(screen.getByTestId("plan-overview-content")).getByTestId("plan-overview-title"),
    ).toBeVisible();
  });

  it("leaves how far through it is to the days below, not the hero", () => {
    renderOverview(ACTIVE);

    expect(screen.queryByLabelText(/days done/)).toBeNull();
    expect(screen.queryByTestId("plan-overview-progress")).toBeNull();
  });

  it("shows every day as a tile: done, today, and locked", () => {
    renderOverview(ACTIVE);

    expect(screen.getByTestId("plan-overview-day-1")).toHaveAccessibleName(/^Day 1, done/);
    expect(screen.getByTestId("plan-overview-day-2")).toHaveAccessibleName(/^Day 2, today/);
    expect(screen.getByTestId("plan-overview-day-6")).toHaveAccessibleName(/^Day 6, locked/);
  });

  it("heads its days as the journey they are, in capitals, as the hero puts things", () => {
    renderOverview(ACTIVE);

    expect(screen.getByText("6-day journey")).toHaveStyle({ textTransform: "uppercase" });
  });

  it("dates each day from the plan's schedule", () => {
    renderOverview(ACTIVE);

    expect(screen.getByTestId("plan-overview-day-3")).toHaveTextContent(/Sep 24/);
  });

  it("never spells out that a day's locked", () => {
    renderOverview(ACTIVE);

    expect(screen.queryByText(/Locked/)).toBeNull();
  });

  it("starts on the day it's on, with its steps", () => {
    renderOverview(ACTIVE);

    expect(screen.getByTestId("plan-overview-day-2")).toHaveProp("accessibilityState", {
      selected: true,
    });
    expect(screen.getByTestId("plan-overview-selected-day")).toHaveTextContent(
      /Day 2 of 6.*Grace is received/,
    );
    expect(screen.getByTestId("plan-overview-step-scripture")).toHaveTextContent(/Ephesians 2:8/);
  });

  it("ticks the steps of the day that are done", () => {
    renderOverview(ACTIVE);

    expect(screen.getByTestId("plan-overview-step-read")).toHaveAccessibleName(/^Read, done/);
    expect(screen.getByTestId("plan-overview-step-scripture")).toHaveAccessibleName(
      /^Scripture, done/,
    );
    expect(screen.getByTestId("plan-overview-step-reflect")).toHaveAccessibleName(/^Reflect, next/);
    expect(screen.getByTestId("plan-overview-step-pray")).toHaveAccessibleName(/^Pray, not done/);
  });

  it("leads the day the plan's on with today, how long, and how far through", () => {
    renderOverview(ACTIVE);

    // Day 2: Read and Scripture done, of four steps and its Quick Check.
    expect(screen.getByTestId("plan-overview-selected-day")).toHaveTextContent(
      /Today · Day 2 of 6.*5 min · 2 of 5 done/,
    );
  });

  it("says a finished day's completed, and when", () => {
    renderOverview(ACTIVE);

    fireEvent.press(screen.getByTestId("plan-overview-day-1"));

    expect(screen.getByTestId("plan-overview-selected-day")).toHaveTextContent(
      /Completed · Day 1 of 6.*Finished Sep 2\d/,
    );
  });

  it("marks a locked day locked", () => {
    renderOverview(ACTIVE);

    fireEvent.press(screen.getByTestId("plan-overview-day-4"));

    expect(screen.getByTestId("plan-overview-selected-day")).toHaveTextContent(
      /Locked · Day 4 of 6/,
    );
  });

  it("adds a day's Quick Check as its fifth step, with how it went", () => {
    renderOverview(ACTIVE);

    fireEvent.press(screen.getByTestId("plan-overview-day-1"));

    expect(screen.getByTestId("plan-overview-step-quickCheck")).toHaveAccessibleName(
      /^Quick Check, done, 1 of 2 correct/,
    );
  });

  it("holds today's Quick Check until the day's steps are done", () => {
    renderOverview(ACTIVE);

    expect(screen.getByTestId("plan-overview-step-quickCheck")).toHaveAccessibleName(
      /^Quick Check, not open yet, After Pray/,
    );
    expect(screen.getByTestId("plan-overview-step-quickCheck")).toBeDisabled();
  });

  it("opens a day's Quick Check from its row", () => {
    renderOverview(ACTIVE);

    fireEvent.press(screen.getByTestId("plan-overview-day-1"));
    fireEvent.press(screen.getByTestId("plan-overview-step-quickCheck"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/study/[planId]/quick-check",
      params: { planId: ACTIVE, day: "1" },
    });
  });

  it("leaves the Quick Check out of a plan that doesn't have them", () => {
    renderOverview(READY);

    expect(screen.queryByTestId("plan-overview-step-quickCheck")).toBeNull();
  });

  it("tags the step you're on next", () => {
    renderOverview(ACTIVE);

    // Day 2's Read and Scripture are done: Reflect is next.
    expect(screen.getByTestId("plan-overview-step-reflect-next")).toBeOnTheScreen();
  });

  it("gives a light tap as a day's tile is picked", () => {
    renderOverview(ACTIVE);

    fireEvent.press(screen.getByTestId("plan-overview-day-1"));

    expect(tapFeedback).toHaveBeenCalledTimes(1);
  });

  it("floats Back and More in the page's own look too, hidden until the hero's scrolled from under them", () => {
    renderOverview(ACTIVE);

    // Hidden from VoiceOver too, until they're the ones showing.
    expect(screen.queryByTestId("plan-overview-back-button-page")).toBeNull();
    const hidden = { includeHiddenElements: true };
    expect(screen.getByTestId("plan-overview-nav-page", hidden)).toHaveProp(
      "pointerEvents",
      "none",
    );
    expect(screen.getByTestId("plan-overview-back-button-page", hidden)).toBeOnTheScreen();
    expect(screen.getByTestId("plan-overview-more-button-page", hidden)).toBeOnTheScreen();
    expect(screen.getByTestId("plan-overview-nav-hero")).toHaveProp("pointerEvents", "box-none");
  });

  it("keeps the day's surface in place as another's picked — only what's on it changes", () => {
    renderOverview(ACTIVE);
    const surface = screen.getByTestId("plan-overview-selected-day");

    fireEvent.press(screen.getByTestId("plan-overview-day-1"));

    expect(screen.getByTestId("plan-overview-selected-day")).toBe(surface);
  });

  it("shows another day when its tile's tapped", () => {
    renderOverview(ACTIVE);

    fireEvent.press(screen.getByTestId("plan-overview-day-1"));

    expect(screen.getByTestId("plan-overview-selected-day")).toHaveTextContent(
      /Day 1 of 6.*Choose today/,
    );
    expect(screen.getByTestId("plan-overview-step-pray")).toHaveAccessibleName(/^Pray, done/);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("opens the day picked from any of its steps — to review one done", () => {
    renderOverview(ACTIVE);

    fireEvent.press(screen.getByTestId("plan-overview-day-1"));
    fireEvent.press(screen.getByTestId("plan-overview-step-scripture"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/study/[planId]",
      params: { planId: ACTIVE, day: "1" },
    });
  });

  it("continues with the day it's on", () => {
    renderOverview(ACTIVE);

    fireEvent.press(screen.getByTestId("plan-overview-continue-button"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/study/[planId]",
      params: { planId: ACTIVE, day: "2" },
    });
  });

  it("won't open a locked day", () => {
    renderOverview(ACTIVE);

    fireEvent.press(screen.getByTestId("plan-overview-day-4"));
    fireEvent.press(screen.getByTestId("plan-overview-step-read"));

    expect(screen.getByTestId("plan-overview-step-read")).toBeDisabled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("keeps a finished day done, and opens the next once the current day is done", () => {
    renderOverview(
      ACTIVE,
      appReducer(INITIAL_STATE, {
        type: "planDay/complete",
        dayId: `${ACTIVE}-day-2`,
        today: "2026-09-23",
        at: "2026-09-23T07:00:00.000Z",
      }),
    );

    expect(screen.getByTestId("plan-overview-day-1")).toHaveAccessibleName(/^Day 1, done/);
    expect(screen.getByTestId("plan-overview-day-2")).toHaveAccessibleName(/^Day 2, done/);
    expect(screen.getByTestId("plan-overview-day-3")).toHaveAccessibleName(/^Day 3, today/);
    fireEvent.press(screen.getByTestId("plan-overview-continue-button"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/study/[planId]",
      params: { planId: ACTIVE, day: "3" },
    });
  });

  it("starts a plan that hasn't been started on its first day", () => {
    renderOverview(READY);

    expect(screen.getByTestId("plan-overview-day-1")).toHaveAccessibleName(/^Day 1, today/);
    expect(screen.getByTestId("plan-overview-status")).toHaveTextContent("NOT STARTED · 3 DAYS");
    expect(screen.getByTestId("plan-overview-continue-button")).toHaveAccessibleName("Start Day 1");
    fireEvent.press(screen.getByTestId("plan-overview-continue-button"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/study/[planId]",
      params: { planId: READY, day: "1" },
    });
  });

  it("tells you about the plan, below its days", () => {
    renderOverview(ACTIVE);

    expect(
      within(screen.getByTestId("plan-overview-about")).getByRole("header", {
        name: "About this plan",
      }),
    ).toBeVisible();
  });

  it("goes back when the back action is pressed", () => {
    renderOverview(ACTIVE);

    fireEvent.press(screen.getByTestId("plan-overview-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
