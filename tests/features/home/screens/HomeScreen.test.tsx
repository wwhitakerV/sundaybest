import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import {
  AppStoreProvider,
  INITIAL_STATE,
  appReducer,
  getDayMinutes,
  getSermonForPlan,
  type AppState,
} from "@/core/store";
import { HomeScreen } from "@/features/home/screens/HomeScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  // Home's shown — so the status bar may follow its plan bar.
  useIsFocused: () => true,
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
// The store's starting data has "Today I Choose to Be a Blessing" under way: six
// days, day 1 done, day 2 today.
const ACTIVE = "plan-choose-whom-you-will-serve";

/** A store with only the sample plan in it — nothing of the user's own. */
const NO_PLANS: AppState = {
  ...INITIAL_STATE,
  plans: Object.fromEntries(
    Object.entries(INITIAL_STATE.plans).filter(([, plan]) => plan.isSample),
  ),
};

function renderHome(state?: AppState) {
  return render(
    state ? (
      <AppStoreProvider initialState={state}>
        <HomeScreen />
      </AppStoreProvider>
    ) : (
      <HomeScreen />
    ),
  );
}

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("HomeScreen", () => {
  it("is addressable as home-tab-screen", () => {
    renderHome();

    expect(screen.getByTestId("home-tab-screen")).toBeVisible();
  });

  it("shows the wordmark", () => {
    renderHome();

    expect(screen.getByText("SUNDAYBEST")).toBeVisible();
  });

  it("lets its content scroll up over the fixed header, not under it", () => {
    renderHome();

    // A scroll view clips its content to its own frame unless told not to;
    // unclipped, content scrolled past its top keeps drawing over the header.
    expect(screen.getByTestId("home-tab-scroll")).toHaveStyle({ overflow: "visible" });
  });

  it("leaves snapping a let-go collapse to iOS — free above it and below it", () => {
    renderHome();

    const scroll = screen.getByTestId("home-tab-scroll");
    expect(scroll).toHaveProp("snapToStart", false);
    expect(scroll).toHaveProp("snapToEnd", false);
  });

  it("navigates to Settings when the account icon is pressed", () => {
    renderHome();

    fireEvent.press(screen.getByTestId("home-tab-account-button"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings");
  });

  describe("with no plan under way", () => {
    it("offers to add a sermon instead of a plan", () => {
      renderHome(NO_PLANS);

      expect(screen.getByText("Start with last Sunday's sermon")).toBeVisible();
      expect(screen.queryByTestId("home-tab-active-plan")).toBeNull();
    });

    it("navigates to New Plan when Add a sermon is pressed", () => {
      renderHome(NO_PLANS);

      fireEvent.press(screen.getByTestId("home-tab-add-sermon-button"));

      expect(mockPush).toHaveBeenCalledWith("/(plan-creation)/paste-sermon");
    });

    it("offers the sample plan to try", () => {
      renderHome(NO_PLANS);

      expect(screen.getByText("God Won't Leave You")).toBeVisible();
      expect(screen.getByText("Sample plan, 5 days")).toBeVisible();
      fireEvent.press(screen.getByTestId("home-tab-sample-plan"));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/(tabs)/plans/[planId]",
        params: { planId: "sample-plan" },
      });
    });
  });

  describe("with a plan under way", () => {
    it("features it at the top, full width, in its sermon's colours", () => {
      renderHome();

      expect(screen.getByTestId("home-tab-active-hero")).toHaveStyle({
        backgroundColor: "#3D403F",
      });
      expect(screen.getByTestId("home-tab-active-hero-backdrop")).toBeOnTheScreen();
    });

    it("gives the colour room to breathe above and below the plan", () => {
      renderHome();

      expect(screen.getByTestId("home-tab-active-hero")).toHaveStyle({
        paddingTop: 52,
        paddingBottom: 44,
      });
    });

    it("puts the plan in context: where it stands, its title, and its church", () => {
      renderHome();

      expect(screen.getByTestId("home-tab-active-plan-status")).toHaveTextContent(
        "IN PROGRESS · DAY 2 OF 6",
      );
      const hero = within(screen.getByTestId("home-tab-active-hero"));
      expect(hero.getByText("Today I Choose to Be a Blessing")).toBeVisible();
      expect(hero.getByText("VOUS Church")).toBeVisible();
    });

    it("says what today's study is, and about how long it takes", () => {
      renderHome();
      const minutes = getDayMinutes(INITIAL_STATE, `${ACTIVE}-day-2`);

      expect(screen.getByTestId("home-tab-active-plan-today")).toHaveTextContent(
        `Today: Grace is received · ${minutes} min`,
      );
    });

    it("sets its words in white on a dark colour", () => {
      renderHome();

      const hero = within(screen.getByTestId("home-tab-active-hero"));
      expect(hero.getByText("Today I Choose to Be a Blessing")).toHaveStyle({ color: "#FFFFFF" });
    });

    it("continues with today's day from its button", () => {
      renderHome();

      fireEvent.press(screen.getByTestId("home-tab-continue-button"));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/study/[planId]",
        params: { planId: ACTIVE, day: "2" },
      });
    });

    it("opens the plan from its artwork, saying where the plan stands", () => {
      renderHome();

      expect(screen.getByTestId("home-tab-active-plan")).toHaveAccessibleName(
        "Today I Choose to Be a Blessing, day 2 of 6. 1 of 6 days done.",
      );
    });

    it("stands in a quiet colour for a sermon whose colours aren't known yet", () => {
      const sermon = getSermonForPlan(INITIAL_STATE, ACTIVE);
      if (!sermon) throw new Error("expected the active plan's sermon");
      renderHome({
        ...INITIAL_STATE,
        sermons: Object.fromEntries(
          Object.entries(INITIAL_STATE.sermons).map(([id, record]) => [
            id,
            id === sermon.id ? { ...record, thumbnailColors: [] } : record,
          ]),
        ),
      });

      expect(screen.getByTestId("home-tab-active-hero")).toHaveStyle({
        backgroundColor: "#111113",
      });
    });

    it("keeps the plan bar ready at rest, but out of the way — hidden, taking no taps", () => {
      renderHome();

      expect(screen.getByTestId("home-tab-plan-bar")).toHaveProp("pointerEvents", "none");
      expect(screen.getByTestId("home-tab-plan-bar")).toHaveTextContent(/Day 2/);
      expect(screen.getByTestId("home-tab-header")).toHaveProp("pointerEvents", "auto");
    });

    it("lists the user's plans, with a finished one marked when it finished", () => {
      renderHome();

      expect(screen.getByTestId("home-tab-plan-plan-give-thanks")).toHaveTextContent(
        /Finished Sep 5/,
      );
    });

    it("reads the day from the store, so a finished day moves it on", () => {
      const dayTwo = `${ACTIVE}-day-2`;
      renderHome(
        appReducer(INITIAL_STATE, {
          type: "planDay/complete",
          dayId: dayTwo,
          today: "2026-09-23",
          at: "2026-09-23T07:00:00.000Z",
        }),
      );

      expect(screen.getByTestId("home-tab-active-plan-status")).toHaveTextContent(
        "IN PROGRESS · DAY 3 OF 6",
      );
      expect(screen.getByTestId("home-tab-continue-button")).toHaveAccessibleName("Continue Day 3");
      expect(screen.getByTestId("home-tab-active-plan")).toHaveAccessibleName(
        "Today I Choose to Be a Blessing, day 3 of 6. 2 of 6 days done.",
      );
    });
  });
});
