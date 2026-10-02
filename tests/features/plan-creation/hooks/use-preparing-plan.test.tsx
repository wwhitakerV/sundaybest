import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import * as haptics from "@/core/haptics/haptics";
import { BUILD_STAGE_MS, PlanBuilder } from "@/core/plan-builder";
import {
  AppStoreProvider,
  INITIAL_STATE,
  appReducer,
  getPlanById,
  getPlanGeneration,
  useAppSelector,
} from "@/core/store";
import { usePreparingPlan } from "@/features/plan-creation/hooks/use-preparing-plan";
import {
  BUILDING_PLAN_ID,
  DRAFT_PLAN_ID,
  withDraftPlan,
  withPlanBeingBuilt,
} from "@tests/factories/pending-plans";

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
  useNavigation: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockReplace = jest.fn<void, [ExpoRouter.Href]>();
const mockBack = jest.fn<void, []>();
const mockExitModal = jest.fn<void, []>();

/** A store with that plan being built, and the builder that moves it on. */
function wrapper({ children }: { children: ReactNode }) {
  return (
    <AppStoreProvider initialState={withPlanBeingBuilt(INITIAL_STATE)}>
      <PlanBuilder />
      {children}
    </AppStoreProvider>
  );
}

beforeEach(() => {
  jest.useFakeTimers({ advanceTimers: true });
  jest.clearAllMocks();
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId: BUILDING_PLAN_ID });
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

describe("usePreparingPlan", () => {
  it("has no failure while the plan is being built", () => {
    const { result } = renderHook(() => usePreparingPlan(), { wrapper });

    expect(result.current.failure).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("leaves the flow on close()", () => {
    const { result } = renderHook(() => usePreparingPlan(), { wrapper });

    act(() => result.current.close());

    expect(mockExitModal).toHaveBeenCalledTimes(1);
  });

  it("replaces to Plan Ready once the build completes", async () => {
    const { result } = renderHook(() => usePreparingPlan(), { wrapper });

    // Writing the days, then the quiz, then done — each stage's timer is set once the last lands.
    for (let stage = 0; stage < 3; stage += 1) {
      await act(async () => {
        jest.advanceTimersByTime(BUILD_STAGE_MS);
        await Promise.resolve();
      });
    }

    expect(result.current.status).toBe("completed");
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/(plan-creation)/ready",
      params: { planId: BUILDING_PLAN_ID },
    });
  });

  it("starts building a draft plan that has no build running", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: DRAFT_PLAN_ID });
    const draftWrapper = ({ children }: { children: ReactNode }) => (
      <AppStoreProvider initialState={withDraftPlan(INITIAL_STATE)}>{children}</AppStoreProvider>
    );

    const { result } = renderHook(
      () => ({
        view: usePreparingPlan(),
        planStatus: useAppSelector((state) => getPlanById(state, DRAFT_PLAN_ID)?.status),
        generation: useAppSelector(getPlanGeneration),
      }),
      { wrapper: draftWrapper },
    );

    expect(result.current.planStatus).toBe("generating");
    expect(result.current.generation?.planId).toBe(DRAFT_PLAN_ID);
  });

  it("goes back to New Plan when the video has no captions", () => {
    const failed = appReducer(withPlanBeingBuilt(INITIAL_STATE), {
      type: "generation/fail",
      error: { code: "noCaptions", message: "No captions." },
      at: "2026-09-23T12:06:00.000Z",
    });
    const failedWrapper = ({ children }: { children: ReactNode }) => (
      <AppStoreProvider initialState={failed}>{children}</AppStoreProvider>
    );

    const { result } = renderHook(() => usePreparingPlan(), { wrapper: failedWrapper });

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(result.current.failure).toBeNull();
  });

  it("is found when the route names a plan", () => {
    const { result } = renderHook(() => usePreparingPlan(), { wrapper });

    expect(result.current.found).toBe(true);
  });

  it("is not found when the route has no plan", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({});

    const { result } = renderHook(() => usePreparingPlan(), { wrapper });

    expect(result.current.found).toBe(false);
  });

  it("is not found when the route names a plan that doesn't exist", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-nope" });

    const { result } = renderHook(() => usePreparingPlan(), { wrapper });

    expect(result.current.found).toBe(false);
  });
});

describe("usePreparingPlan haptics", () => {
  function renderFailed(code: "noCaptions" | "network" | "unknown" | "videoUnavailable") {
    const failed = appReducer(withPlanBeingBuilt(INITIAL_STATE), {
      type: "generation/fail",
      error: { code, message: "It failed." },
      at: "2026-09-23T12:06:00.000Z",
    });
    const failedWrapper = ({ children }: { children: ReactNode }) => (
      <AppStoreProvider initialState={failed}>{children}</AppStoreProvider>
    );
    return renderHook(() => usePreparingPlan(), { wrapper: failedWrapper });
  }

  it("gives success once when the build completes", async () => {
    const { rerender } = renderHook(() => usePreparingPlan(), { wrapper });

    for (let stage = 0; stage < 3; stage += 1) {
      await act(async () => {
        jest.advanceTimersByTime(BUILD_STAGE_MS);
        await Promise.resolve();
      });
    }
    rerender({});

    expect(haptics.successFeedback).toHaveBeenCalledTimes(1);
    expect(haptics.errorFeedback).not.toHaveBeenCalled();
  });

  it("gives nothing while the plan is still being built", () => {
    renderHook(() => usePreparingPlan(), { wrapper });

    expect(haptics.successFeedback).not.toHaveBeenCalled();
    expect(haptics.errorFeedback).not.toHaveBeenCalled();
  });

  it("gives an error haptic once for a failure other than missing captions", () => {
    const { rerender } = renderFailed("network");

    rerender({});

    expect(haptics.errorFeedback).toHaveBeenCalledTimes(1);
    expect(haptics.successFeedback).not.toHaveBeenCalled();
  });

  it("gives an error haptic once when the video has no captions, as it hands back to New Plan", () => {
    const { rerender } = renderFailed("noCaptions");

    rerender({});

    expect(haptics.errorFeedback).toHaveBeenCalledTimes(1);
    expect(haptics.successFeedback).not.toHaveBeenCalled();
  });

  it("taps as Try again restarts the build", () => {
    const { result } = renderFailed("network");

    act(() => result.current.retry());

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });
});
