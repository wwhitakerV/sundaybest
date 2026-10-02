import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import * as haptics from "@/core/haptics/haptics";
import { SAMPLE_PLAN_ID } from "@/core/mock-data";
import { AppStoreProvider, INITIAL_STATE, type AppState } from "@/core/store";
import { useHomeView } from "@/features/home/hooks/use-home-view";

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
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
// Under way: six days, day 1 done, day 2 today.
const ACTIVE = "plan-today-i-choose-to-be-a-blessing";

/** A store with only the sample plan in it — nothing of the user's own. */
const NO_PLANS: AppState = {
  ...INITIAL_STATE,
  plans: Object.fromEntries(
    Object.entries(INITIAL_STATE.plans).filter(([, plan]) => plan.isSample),
  ),
};

function renderHomeView(state?: AppState) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppStoreProvider {...(state && { initialState: state })}>{children}</AppStoreProvider>
  );
  return renderHook(() => useHomeView(), { wrapper });
}

beforeEach(() => {
  mockPush.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("useHomeView", () => {
  it("says what the featured plan's hero holds, in words", () => {
    const { result } = renderHomeView();

    expect(result.current.active?.hero).toMatchObject({
      title: "Today I Choose to Be a Blessing",
      currentDay: 2,
      totalDays: 6,
      completedDayCount: 1,
      words: { status: "IN PROGRESS · DAY 2 OF 6", action: "Continue Day 2" },
    });
  });

  it("names today's day on the plan bar", () => {
    const { result } = renderHomeView();

    expect(result.current.active?.bar).toMatchObject({
      title: "Today I Choose to Be a Blessing",
      day: "Day 2",
    });
  });

  it("points the featured plan at its Home plan overview", () => {
    const { result } = renderHomeView();

    expect(result.current.active?.href).toEqual({
      pathname: "/(tabs)/home/[planId]",
      params: { planId: ACTIVE },
    });
  });

  it("has plans when the user has plans of their own", () => {
    const { result } = renderHomeView();

    expect(result.current.hasPlans).toBe(true);
  });

  it("has no active plan, and offers the sample, when the store holds only the sample", () => {
    const { result } = renderHomeView(NO_PLANS);

    expect(result.current.active).toBeNull();
    expect(result.current.hasPlans).toBe(false);
    expect(result.current.sample).toMatchObject({
      id: SAMPLE_PLAN_ID,
      detail: "Sample plan, 5 days",
    });
  });

  it("opens a plan's overview with openPlan", () => {
    const { result } = renderHomeView();

    act(() => result.current.openPlan(ACTIVE));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(tabs)/plans/[planId]",
      params: { planId: ACTIVE },
    });
  });

  it("opens New Plan with addSermon", () => {
    const { result } = renderHomeView();

    act(() => result.current.addSermon());

    expect(mockPush).toHaveBeenCalledWith("/(plan-creation)/paste-sermon");
  });

  it("opens today's study with continueToday", () => {
    const { result } = renderHomeView();

    act(() => result.current.continueToday());

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/study/[planId]",
      params: { planId: ACTIVE, day: "2" },
    });
  });

  it("opens the sample plan's overview with openSample", () => {
    const { result } = renderHomeView(NO_PLANS);

    act(() => result.current.openSample());

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(tabs)/plans/[planId]",
      params: { planId: SAMPLE_PLAN_ID },
    });
  });

  it("does nothing on openSample when there is no sample", () => {
    const noSample: AppState = {
      ...INITIAL_STATE,
      plans: Object.fromEntries(
        Object.entries(INITIAL_STATE.plans).filter(([, plan]) => !plan.isSample),
      ),
    };
    const { result } = renderHomeView(noSample);

    act(() => result.current.openSample());

    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("useHomeView haptics", () => {
  it("taps as Continue opens today's study", () => {
    const { result } = renderHomeView();

    act(() => result.current.continueToday());

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });

  it("taps as Add sermon opens New Plan", () => {
    const { result } = renderHomeView();

    act(() => result.current.addSermon());

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });

  it("gives nothing as a plan is opened", () => {
    const { result } = renderHomeView();

    act(() => result.current.openPlan(ACTIVE));

    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });
});
