import { render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { AppStoreProvider, INITIAL_STATE, appReducer, type AppState } from "@/core/store";
import { PlanOverviewScreen } from "@/features/plans/screens/PlanOverviewScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn<{ planId: string }, []>(),
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

  it("shows the plan's title and the sermon it's from", () => {
    renderOverview(ACTIVE);

    expect(screen.getByTestId("plan-overview-title")).toHaveTextContent(
      "Choose Whom You Will Serve",
    );
    expect(screen.getByText("From Choose Whom You Will Serve · VOUS Church")).toBeVisible();
  });

  it("shows the day it's on and how far through it is", () => {
    renderOverview(ACTIVE);

    expect(screen.getByTestId("plan-overview-current-day")).toHaveTextContent("2 of 6");
    expect(screen.getByLabelText("1 of 6 days done")).toBeVisible();
  });

  it("lists every day: done, under way, and locked", () => {
    renderOverview(ACTIVE);

    expect(screen.getByTestId("plan-overview-day-1")).toHaveTextContent(/Choose today.*Done/);
    expect(screen.getByTestId("plan-overview-day-2")).toHaveTextContent(
      /Grace is received.*Continue/,
    );
    expect(screen.getByTestId("plan-overview-day-3")).toBeDisabled();
    expect(screen.getByTestId("plan-overview-day-6")).toHaveTextContent(/Locked/);
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

    expect(screen.getByTestId("plan-overview-day-1")).toHaveTextContent(/Done/);
    expect(screen.getByTestId("plan-overview-day-2")).toHaveTextContent(/Done/);
    expect(screen.getByTestId("plan-overview-day-3")).toHaveTextContent(/Start/);
    fireEvent.press(screen.getByTestId("plan-overview-continue-button"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/study/[planId]",
      params: { planId: ACTIVE, day: "3" },
    });
  });

  it("starts a plan that hasn't been started on its first day", () => {
    renderOverview(READY);

    expect(screen.getByTestId("plan-overview-day-1")).toHaveTextContent(/Start/);
    expect(screen.getByLabelText("0 of 3 days done")).toBeVisible();
    fireEvent.press(screen.getByTestId("plan-overview-continue-button"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/study/[planId]",
      params: { planId: READY, day: "1" },
    });
  });

  it("goes back when the back action is pressed", () => {
    renderOverview(ACTIVE);

    fireEvent.press(screen.getByTestId("plan-overview-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
