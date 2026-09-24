import { render, screen, fireEvent } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { AppStoreProvider, INITIAL_STATE, appReducer, type AppState } from "@/core/store";
import { HomeScreen } from "@/features/home/screens/HomeScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
// The store's starting data has "Choose Whom You Will Serve" under way: six
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
    it("shows the plan, the day it's on, and how far through it is", () => {
      renderHome();

      expect(screen.getByTestId("home-tab-active-plan")).toBeVisible();
      expect(screen.getAllByText("Choose Whom You Will Serve").length).toBeGreaterThan(0);
      expect(screen.getByTestId("home-tab-active-plan-day")).toHaveTextContent("Day 2 of 6");
      expect(screen.getByText("Continue")).toBeVisible();
    });

    it("makes the whole card one control, saying where the plan stands", () => {
      renderHome();

      expect(screen.getByTestId("home-tab-active-plan")).toHaveAccessibleName(
        "Choose Whom You Will Serve, day 2 of 6. 1 of 6 days done.",
      );
      expect(screen.queryByTestId("home-tab-continue-button")).toBeNull();
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

      expect(screen.getByTestId("home-tab-active-plan-day")).toHaveTextContent("Day 3 of 6");
      expect(screen.getByTestId("home-tab-active-plan")).toHaveAccessibleName(
        "Choose Whom You Will Serve, day 3 of 6. 2 of 6 days done.",
      );
    });
  });
});
