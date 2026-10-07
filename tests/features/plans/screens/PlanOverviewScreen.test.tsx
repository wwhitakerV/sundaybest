import { render, screen, fireEvent, waitFor, within } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { aPlan } from "@tests/factories/api-plans";
import { servePlans } from "@tests/mocks/plans-api";
import { selectionFeedback } from "@/core/haptics/haptics";
import { PLANS_HREF, quickCheckHref, studyHref } from "@/entities/plan";
import { PlanOverviewScreen } from "@/features/plans/screens/PlanOverviewScreen";

jest.mock("@/core/haptics/haptics", () => ({
  tapFeedback: jest.fn(),
  selectionFeedback: jest.fn(),
  successFeedback: jest.fn(),
  warningFeedback: jest.fn(),
  errorFeedback: jest.fn(),
}));

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn<{ planId: string }, []>(),
  // The screen's shown — so the tab bar and status bar may follow it.
  useIsFocused: () => true,
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockReplace = jest.fn<void, [ExpoRouter.Href]>();

/**
 * Under way: six days from Thu 1 Oct, day 1 done, day 2 today with Read and
 * Scripture done, days 3–6 locked. Its sermon's colours are known.
 */
const ACTIVE = aPlan({
  seed: 1,
  title: "Today I Choose to Be a Blessing",
  church: "VOUS Church",
  lengthDays: 6,
  completedDays: 1,
  currentDayStatus: "inProgress",
  currentDaySteps: ["read", "scripture"],
  thumbnailColors: ["#3d403f", "#1f5a6e", "#1c1d20"],
  about: {
    overview: ["Choosing God is a daily act."],
    scripturesReferenced: [],
    keyTakeaways: ["Grace comes before obedience."],
  },
});
/** Ready and not started: three days, day 1 open, no Quick Checks, its still on the web. */
const READY = aPlan({
  seed: 2,
  title: "Still Praying",
  status: "ready",
  lengthDays: 3,
  quickCheckEnabled: false,
  thumbnailUrl: "https://images.example.com/still-praying.jpg",
});

/** Plan Overview for this plan, once it has arrived. */
async function openOverview(plan: typeof ACTIVE = ACTIVE, plans = [ACTIVE, READY]) {
  const seen = servePlans(plans);
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId: plan.id });
  render(<PlanOverviewScreen />);
  await screen.findByTestId("plan-overview-title");
  return seen;
}

beforeEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
  jest.mocked(useRouter).mockReturnValue({
    push: mockPush,
    replace: mockReplace,
  } as unknown as ReturnType<typeof useRouter>);
});

describe("PlanOverviewScreen", () => {
  it("is addressable as plan-overview-screen", async () => {
    await openOverview();

    expect(screen.getByTestId("plan-overview-screen")).toBeVisible();
  });

  it("shows the plan's shape, and the way back, while it's on its way", () => {
    servePlans([ACTIVE]);
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: ACTIVE.id });
    render(<PlanOverviewScreen />);

    expect(screen.getByTestId("plan-overview-content-pending")).toBeOnTheScreen();
    expect(screen.getByTestId("plan-overview-back-button-loading")).toBeOnTheScreen();
  });

  it("says so, with the way back to Plans, for a plan it can't load", async () => {
    servePlans([ACTIVE]);
    jest
      .mocked(useLocalSearchParams)
      .mockReturnValue({ planId: "00000000-0000-4000-8000-00000000dead" });
    render(<PlanOverviewScreen />);

    expect(
      await screen.findByRole("header", { name: "Couldn't load this plan" }, { timeout: 10000 }),
    ).toBeVisible();
    fireEvent.press(screen.getByTestId("plan-overview-load-error-secondary"));
    expect(mockReplace).toHaveBeenCalledWith(PLANS_HREF);
  });

  it("puts the plan in context: where it stands, its title, and its church", async () => {
    await openOverview();

    expect(screen.getByTestId("plan-overview-status")).toHaveTextContent(
      "IN PROGRESS · DAY 2 OF 6",
    );
    expect(screen.getByTestId("plan-overview-title")).toHaveTextContent(
      "Today I Choose to Be a Blessing",
    );
    expect(screen.getByText("VOUS Church")).toBeVisible();
  });

  it("sets its hero in the sermon's colours", async () => {
    await openOverview();

    expect(screen.getByTestId("plan-overview-hero")).toHaveStyle({ backgroundColor: "#3d403f" });
  });

  it("washes the sermon's still faintly across the hero, behind its artwork", async () => {
    await openOverview(READY);

    expect(screen.getByTestId("plan-overview-hero-backdrop-underlay")).toHaveProp("opacity", 0.2);
  });

  it("lays its colour back over the artwork's lower part once the hero's measured", async () => {
    await openOverview();

    fireEvent(screen.getByTestId("plan-overview-hero"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 393, height: 700 } },
    });

    expect(screen.getByTestId("plan-overview-hero-cover-fill").props.mask).toBeTruthy();
  });

  it("covers the still with that colour too, rather than carrying it down the words", async () => {
    await openOverview(READY);

    fireEvent(screen.getByTestId("plan-overview-hero"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 393, height: 700 } },
    });

    expect(screen.getByTestId("plan-overview-hero-cover")).toBeOnTheScreen();
    expect(screen.queryByTestId("plan-overview-hero-cover-underlay")).toBeNull();
  });

  it("lets the hero's colour reach past its top, so a pull down zooms it up to the screen's", async () => {
    await openOverview();

    expect(screen.getByTestId("plan-overview-hero")).not.toHaveStyle({ overflow: "hidden" });
    expect(screen.getByTestId("plan-overview-hero-colour")).toHaveStyle({
      transformOrigin: "bottom",
    });
    expect(screen.getByTestId("plan-overview-hero-content-colour")).toHaveStyle({
      transformOrigin: "bottom",
    });
  });

  it("still keeps the artwork within the hero", async () => {
    await openOverview();

    expect(screen.getByTestId("plan-overview-hero-artwork-clip")).toHaveStyle({
      overflow: "hidden",
    });
  });

  it("floats Back and More over the hero, dark over its dark colour", async () => {
    await openOverview();

    expect(screen.getByTestId("plan-overview-back-button")).toHaveStyle({
      backgroundColor: "rgba(8, 9, 10, 0.5)",
    });
    expect(screen.getByTestId("plan-overview-more-button")).toHaveStyle({
      backgroundColor: "rgba(8, 9, 10, 0.5)",
    });
  });

  it("has one Continue at rest — the hero's", async () => {
    await openOverview();

    expect(screen.getAllByText("Continue Day 2")).toHaveLength(1);
    expect(screen.getByTestId("plan-overview-continue-button")).toHaveAccessibleName(
      "Continue Day 2",
    );
  });

  it("fades its content in as it appears, rather than cutting to it", async () => {
    await openOverview();

    expect(
      within(screen.getByTestId("plan-overview-content")).getByTestId("plan-overview-title"),
    ).toBeVisible();
  });

  it("leaves how far through it is to the days below, not the hero", async () => {
    await openOverview();

    expect(screen.queryByLabelText(/days done/)).toBeNull();
    expect(screen.queryByTestId("plan-overview-progress")).toBeNull();
  });

  it("shows every day as a tile: done, today, and locked", async () => {
    await openOverview();

    expect(screen.getByTestId("plan-overview-day-1")).toHaveAccessibleName(/^Day 1, done/);
    expect(screen.getByTestId("plan-overview-day-2")).toHaveAccessibleName(/^Day 2, today/);
    expect(screen.getByTestId("plan-overview-day-6")).toHaveAccessibleName(/^Day 6, locked/);
  });

  it("heads its days as the journey they are, in capitals, as the hero puts things", async () => {
    await openOverview();

    expect(screen.getByText("6-day journey")).toHaveStyle({ textTransform: "uppercase" });
  });

  it("dates each day from the plan's schedule", async () => {
    await openOverview();

    expect(screen.getByTestId("plan-overview-day-3")).toHaveTextContent(/Oct 3/);
  });

  it("never spells out that a day's locked", async () => {
    await openOverview();

    expect(screen.queryByText(/Locked/)).toBeNull();
  });

  it("starts on the day it's on, with its steps", async () => {
    await openOverview();

    expect(screen.getByTestId("plan-overview-day-2")).toHaveProp("accessibilityState", {
      selected: true,
    });
    expect(screen.getByTestId("plan-overview-selected-day")).toHaveTextContent(/Day 2 reading/);
    expect(screen.getByTestId("plan-overview-step-scripture")).toHaveTextContent(/John 3:2/);
  });

  it("leaves saying which day is picked to the row of days", async () => {
    await openOverview();

    expect(screen.getByTestId("plan-overview-selected-day")).not.toHaveTextContent(
      /Day \d of|Today/,
    );
  });

  it("ticks the steps of the day that are done", async () => {
    await openOverview();

    expect(screen.getByTestId("plan-overview-step-read")).toHaveAccessibleName(/^Read, done/);
    expect(screen.getByTestId("plan-overview-step-scripture")).toHaveAccessibleName(
      /^Scripture, done/,
    );
    expect(screen.getByTestId("plan-overview-step-reflect")).toHaveAccessibleName(/^Reflect, next/);
    expect(screen.getByTestId("plan-overview-step-pray")).toHaveAccessibleName(/^Pray, not done/);
  });

  it("heads the day it's on with how long it takes, and how far through its study", async () => {
    await openOverview();

    // Day 2: Read and Scripture done, of its four study steps — the Quick Check's apart.
    expect(screen.getByTestId("plan-overview-selected-day")).toHaveTextContent(
      /Day 2 reading.*9 min · 2 of 4 done/,
    );
  });

  it("says when a finished day finished", async () => {
    await openOverview();

    fireEvent.press(screen.getByTestId("plan-overview-day-1"));

    expect(screen.getByTestId("plan-overview-selected-day")).toHaveTextContent(
      /Day 1 reading.*9 min · Finished Oct 5/,
    );
  });

  it("locks every step of a locked day", async () => {
    await openOverview();

    fireEvent.press(screen.getByTestId("plan-overview-day-4"));

    for (const step of ["read", "scripture", "reflect", "pray"]) {
      expect(screen.getByTestId(`plan-overview-step-${step}`)).toHaveAccessibleName(/, locked/);
    }
  });

  it("sets a day's Quick Check apart, after its study, with how it went", async () => {
    await openOverview();

    fireEvent.press(screen.getByTestId("plan-overview-day-1"));

    expect(
      within(screen.getByTestId("plan-overview-selected-day-steps")).queryByTestId(
        "plan-overview-step-quickCheck",
      ),
    ).toBeNull();
    expect(
      within(screen.getByTestId("plan-overview-selected-day-follow-up")).getByTestId(
        "plan-overview-step-quickCheck",
      ),
    ).toHaveAccessibleName(/^Quick Check, done, 3 of 3 correct/);
  });

  it("holds today's Quick Check until the day's steps are done", async () => {
    await openOverview();

    expect(screen.getByTestId("plan-overview-step-quickCheck")).toHaveAccessibleName(
      /^Quick Check, not open yet, After Pray/,
    );
    expect(screen.getByTestId("plan-overview-step-quickCheck")).toBeDisabled();
  });

  it("opens a day's Quick Check from its row", async () => {
    await openOverview();

    fireEvent.press(screen.getByTestId("plan-overview-day-1"));
    fireEvent.press(screen.getByTestId("plan-overview-step-quickCheck"));

    expect(mockPush).toHaveBeenCalledWith(quickCheckHref(ACTIVE.id, 1));
  });

  it("leaves the Quick Check out of a plan that doesn't have them", async () => {
    await openOverview(READY);

    expect(screen.queryByTestId("plan-overview-step-quickCheck")).toBeNull();
  });

  it("leads into the step you're on from its own row, rather than a tag", async () => {
    await openOverview();

    // Day 2's Read and Scripture are done: Reflect is next.
    expect(screen.getByTestId("plan-overview-step-reflect-chevron")).toBeOnTheScreen();
    expect(screen.queryByTestId("plan-overview-step-reflect-next")).toBeNull();
    expect(
      within(screen.getByTestId("plan-overview-selected-day")).queryByText(/^Next$/i),
    ).toBeNull();
  });

  it("keeps Continue to the page's one — none in the day's panel", async () => {
    await openOverview();

    expect(
      within(screen.getByTestId("plan-overview-selected-day")).queryByText(/Continue|Start/),
    ).toBeNull();
  });

  it("gives a selection haptic as a day's tile is picked", async () => {
    await openOverview();

    fireEvent.press(screen.getByTestId("plan-overview-day-1"));

    expect(selectionFeedback).toHaveBeenCalledTimes(1);
  });

  it("floats Back and More in the page's own look too, hidden until the hero's scrolled from under them", async () => {
    await openOverview();

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

  it("keeps the day in place as another's picked — only its words change", async () => {
    await openOverview();
    const day = screen.getByTestId("plan-overview-selected-day");

    fireEvent.press(screen.getByTestId("plan-overview-day-1"));

    expect(screen.getByTestId("plan-overview-selected-day")).toBe(day);
  });

  it("shows another day when its tile's tapped", async () => {
    await openOverview();

    fireEvent.press(screen.getByTestId("plan-overview-day-1"));

    expect(screen.getByTestId("plan-overview-selected-day")).toHaveTextContent(/Day 1 reading/);
    expect(screen.getByTestId("plan-overview-step-pray")).toHaveAccessibleName(/^Pray, done/);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("opens the day picked from any of its steps — to review one done", async () => {
    await openOverview();

    fireEvent.press(screen.getByTestId("plan-overview-day-1"));
    fireEvent.press(screen.getByTestId("plan-overview-step-scripture"));

    expect(mockPush).toHaveBeenCalledWith(studyHref(ACTIVE.id, 1, "scripture"));
  });

  it("continues with the day it's on, at its next step", async () => {
    await openOverview();

    fireEvent.press(screen.getByTestId("plan-overview-continue-button"));

    expect(mockPush).toHaveBeenCalledWith(studyHref(ACTIVE.id, 2, "reflect"));
  });

  it("won't open a locked day", async () => {
    await openOverview();

    fireEvent.press(screen.getByTestId("plan-overview-day-4"));
    fireEvent.press(screen.getByTestId("plan-overview-step-read"));

    expect(screen.getByTestId("plan-overview-step-read")).toBeDisabled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows the next day as today once the server has the current one done", async () => {
    const further = aPlan({ seed: 1, title: ACTIVE.title, lengthDays: 6, completedDays: 2 });
    await openOverview(further, [further]);

    expect(screen.getByTestId("plan-overview-day-1")).toHaveAccessibleName(/^Day 1, done/);
    expect(screen.getByTestId("plan-overview-day-2")).toHaveAccessibleName(/^Day 2, done/);
    expect(screen.getByTestId("plan-overview-day-3")).toHaveAccessibleName(/^Day 3, today/);
    fireEvent.press(screen.getByTestId("plan-overview-continue-button"));
    expect(mockPush).toHaveBeenCalledWith(studyHref(further.id, 3, "read"));
  });

  it("starts a plan that hasn't been started on its first day", async () => {
    const seen = await openOverview(READY);

    expect(screen.getByTestId("plan-overview-day-1")).toHaveAccessibleName(/^Day 1, today/);
    expect(screen.getByTestId("plan-overview-status")).toHaveTextContent("NOT STARTED · 3 DAYS");
    expect(screen.getByTestId("plan-overview-continue-button")).toHaveAccessibleName("Start Day 1");
    fireEvent.press(screen.getByTestId("plan-overview-continue-button"));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(studyHref(READY.id, 1, "read")));
    expect(seen).toContainEqual(
      expect.objectContaining({ method: "POST", path: `/v1/plans/${READY.id}/start` }),
    );
  });

  it("tells you about the plan, below its days", async () => {
    await openOverview();

    expect(
      within(screen.getByTestId("plan-overview-about")).getByRole("header", {
        name: "About this plan",
      }),
    ).toBeVisible();
  });

  it("goes back to Plans when the back action is pressed", async () => {
    await openOverview();

    fireEvent.press(screen.getByTestId("plan-overview-back-button"));

    expect(mockReplace).toHaveBeenCalledWith(PLANS_HREF);
  });
});

describe("PlanOverviewScreen's More menu", () => {
  it("is closed until More is pressed", async () => {
    await openOverview();

    expect(screen.queryByTestId("plan-overview-more-menu")).toBeNull();
  });

  it("opens its menu from the hero's More button", async () => {
    await openOverview();

    fireEvent.press(screen.getByTestId("plan-overview-more-button"));

    expect(screen.getByTestId("plan-overview-more-menu")).toBeOnTheScreen();
    expect(screen.getByTestId("plan-overview-more-save")).toBeOnTheScreen();
    expect(screen.getByTestId("plan-overview-more-reminder")).toBeOnTheScreen();
    expect(screen.getByTestId("plan-overview-more-how-made")).toBeOnTheScreen();
    expect(screen.getByTestId("plan-overview-more-reset")).toBeOnTheScreen();
  });

  // The page's own More button is wired the same way, but takes no touches
  // until the hero scrolls from under it — which Reanimated's mock can't
  // drive here; tests/features/plans/components/PlanNav.test.tsx presses it.

  it("offers Remove from Saved the next time it opens, once the plan is saved", async () => {
    await openOverview();
    fireEvent.press(screen.getByTestId("plan-overview-more-button"));
    expect(screen.getByText("Save plan")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("plan-overview-more-save"));
    fireEvent.press(screen.getByTestId("plan-overview-more-button"));

    expect(await screen.findByText("Remove from Saved")).toBeOnTheScreen();
  });
});
