import { act, render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { BUILD_STAGE_MS, PlanBuilder } from "@/core/plan-builder";
import { AppStoreProvider, INITIAL_STATE } from "@/core/store";
import { PreparingPlanScreen } from "@/features/plan-creation/screens/PreparingPlanScreen";
import {
  BUILDING_PLAN_ID,
  PENDING_PLAN_DAYS,
  PENDING_PLAN_TITLE,
  withPlanBeingBuilt,
} from "@tests/factories/pending-plans";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockReplace = jest.fn<void, [ExpoRouter.Href]>();
const mockBack = jest.fn<void, []>();
const mockExitModal = jest.fn<void, []>();
// A plan made in New Plan and being built: four days with a Quick Check, writing its days.
const PLAN_ID = BUILDING_PLAN_ID;

/** Preparing, over a store with that plan being built — and the builder that moves it on. */
function renderPreparing() {
  return render(
    <AppStoreProvider initialState={withPlanBeingBuilt(INITIAL_STATE)}>
      <PlanBuilder />
      <PreparingPlanScreen />
    </AppStoreProvider>,
  );
}

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId: PLAN_ID });
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitModal }),
  });
  jest.mocked(useRouter).mockReturnValue({
    replace: mockReplace,
    back: mockBack,
  } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("PreparingPlanScreen", () => {
  it("is laid out as a milestone page while it builds", () => {
    renderPreparing();

    expect(screen.getByTestId("preparing-plan-screen-body")).toBeOnTheScreen();
  });

  it("is addressable as preparing-plan-screen", () => {
    renderPreparing();

    expect(screen.getByTestId("preparing-plan-screen")).toBeVisible();
  });

  it("shows the plan being built, and where the build is", () => {
    renderPreparing();

    expect(screen.getByText("Preparing your plan")).toBeVisible();
    expect(screen.getByText(PENDING_PLAN_TITLE)).toBeVisible();
    expect(screen.getByText(`Writing your ${PENDING_PLAN_DAYS} days`)).toBeVisible();
    expect(screen.getByTestId("preparing-plan-stages-writingDays")).toBeBusy();
  });

  it("leaves the flow when Close is pressed", () => {
    renderPreparing();

    fireEvent.press(screen.getByTestId("preparing-plan-close-button"));

    expect(mockExitModal).toHaveBeenCalledTimes(1);
  });

  it("moves on to Plan Ready once the plan is built", async () => {
    renderPreparing();

    // Writing the days, then the quiz, then done.
    for (let stage = 0; stage < 3; stage += 1) {
      // Each stage's timer is set once the last one lands, so one at a time.
      await act(async () => {
        jest.advanceTimersByTime(BUILD_STAGE_MS);
        await Promise.resolve();
      });
    }

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/(plan-creation)/ready",
      params: { planId: PLAN_ID },
    });
  });

  describe("without a plan", () => {
    beforeEach(() => {
      jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-nope" });
    });

    it("says the plan isn't here, as a header", () => {
      renderPreparing();

      expect(screen.getByTestId("preparing-plan-not-found")).toBeVisible();
      expect(screen.getByRole("header", { name: "This plan isn't here" })).toBeVisible();
    });

    it("leaves the session when Close is pressed", () => {
      renderPreparing();

      fireEvent.press(screen.getByTestId("preparing-plan-not-found-action"));

      expect(screen.getByText("Close")).toBeVisible();
      expect(mockExitModal).toHaveBeenCalledTimes(1);
    });
  });
});
