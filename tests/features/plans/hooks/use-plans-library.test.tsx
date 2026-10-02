import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import * as haptics from "@/core/haptics/haptics";
import {
  AppStoreProvider,
  getCompletedPlans,
  getCurrentPlanDay,
  getPlanById,
  getSermonForPlan,
  getUserPlans,
  useAppSelector,
} from "@/core/store";
import { studyHref } from "@/entities/plan";
import { usePlansLibrary } from "@/features/plans/hooks/use-plans-library";

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

function wrapper({ children }: { children: ReactNode }) {
  return <AppStoreProvider>{children}</AppStoreProvider>;
}

function renderLibrary() {
  return renderHook(
    () => ({
      library: usePlansLibrary(),
      all: useAppSelector((state) => getUserPlans(state).map((plan) => plan.id)),
      done: useAppSelector((state) => getCompletedPlans(state).map((plan) => plan.id)),
      activeDay: useAppSelector(
        (state) => getCurrentPlanDay(state, "plan-today-i-choose-to-be-a-blessing")?.dayNumber,
      ),
      stillPrayingChurch: useAppSelector(
        (state) => getSermonForPlan(state, "plan-still-praying")?.church ?? null,
      ),
      stillPrayingStatus: useAppSelector(
        (state) => getPlanById(state, "plan-still-praying")?.status,
      ),
    }),
    { wrapper },
  );
}

beforeEach(() => {
  mockPush.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("usePlansLibrary", () => {
  it("starts on All", () => {
    const { result } = renderLibrary();

    expect(result.current.library.filter).toBe("All");
  });

  it("shows a card for each of the user's plans on All", () => {
    const { result } = renderLibrary();

    expect(result.current.library.cards.map(({ plan }) => plan.id)).toEqual(result.current.all);
  });

  it("counts each filter's plans in its options", () => {
    const { result } = renderLibrary();

    expect(result.current.library.filters.at(0)).toEqual({
      label: "All",
      count: result.current.all.length,
    });
  });

  it("narrows to the finished plans on setFilter(Done)", () => {
    const { result } = renderLibrary();

    act(() => result.current.library.setFilter("Done"));

    expect(result.current.library.filter).toBe("Done");
    expect(result.current.library.cards.map(({ plan }) => plan.id)).toEqual(result.current.done);
    expect(result.current.done.length).toBeLessThan(result.current.all.length);
  });

  it("gives each card the plan's completion percentage", () => {
    const { result } = renderLibrary();
    const ids = ["plan-today-i-choose-to-be-a-blessing", "plan-still-praying"];

    const percents = Object.fromEntries(
      result.current.library.cards.map((card) => [card.plan.id, card.percent]),
    );

    // Six days, day 1 done; and one not started.
    expect(percents[ids[0] as string]).toBe(17);
    expect(percents[ids[1] as string]).toBe(0);
  });

  it("opens a plan's overview with openPlan", () => {
    const { result } = renderLibrary();

    act(() => result.current.library.openPlan("plan-still-praying"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(tabs)/plans/[planId]",
      params: { planId: "plan-still-praying" },
    });
  });
});

describe("usePlansLibrary continue", () => {
  beforeEach(() => jest.clearAllMocks());

  it("gives a plan in progress the day it is on as continueDay", () => {
    const { result } = renderLibrary();

    const card = result.current.library.cards.find(
      ({ plan }) => plan.id === "plan-today-i-choose-to-be-a-blessing",
    );

    expect(result.current.activeDay).toBeDefined();
    expect(card).toHaveProperty("continueDay", result.current.activeDay);
  });

  it("marks only a finished plan as done", () => {
    const { result } = renderLibrary();
    const doneOf = (id: string) =>
      result.current.library.cards.find(({ plan }) => plan.id === id)?.done;

    expect(doneOf("plan-break-the-cycle-of-negative-thinking")).toBe(true);
    expect(doneOf("plan-today-i-choose-to-be-a-blessing")).toBe(false);
    expect(doneOf("plan-still-praying")).toBe(false);
  });

  it("gives a plan not started or done a null continueDay", () => {
    const { result } = renderLibrary();

    for (const id of ["plan-still-praying", "plan-break-the-cycle-of-negative-thinking"]) {
      const card = result.current.library.cards.find(({ plan }) => plan.id === id);
      expect(card).toHaveProperty("continueDay", null);
    }
  });

  it("opens the study at that day with continuePlan, with one tap haptic", () => {
    const { result } = renderLibrary();

    act(() => result.current.library.continuePlan("plan-today-i-choose-to-be-a-blessing", 2));

    expect(mockPush).toHaveBeenCalledWith(studyHref("plan-today-i-choose-to-be-a-blessing", 2));
    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });
});

describe("usePlansLibrary start", () => {
  beforeEach(() => jest.clearAllMocks());

  it("gives each card its sermon's church", () => {
    const { result } = renderLibrary();
    const card = result.current.library.cards.find(({ plan }) => plan.id === "plan-still-praying");

    expect(result.current.stillPrayingChurch).not.toBeNull();
    expect(card).toHaveProperty("church", result.current.stillPrayingChurch);
  });

  it("marks only a plan not started as startable", () => {
    const { result } = renderLibrary();
    const startableOf = (id: string) =>
      result.current.library.cards.find(({ plan }) => plan.id === id)?.startable;

    expect(startableOf("plan-still-praying")).toBe(true);
    expect(startableOf("plan-today-i-choose-to-be-a-blessing")).toBe(false);
    expect(startableOf("plan-break-the-cycle-of-negative-thinking")).toBe(false);
  });

  it("starts the plan with startPlan", () => {
    const { result } = renderLibrary();

    act(() => result.current.library.startPlan("plan-still-praying"));

    expect(result.current.stillPrayingStatus).toBe("active");
  });

  it("opens the started plan's first day, with one tap haptic", () => {
    const { result } = renderLibrary();

    act(() => result.current.library.startPlan("plan-still-praying"));

    expect(mockPush).toHaveBeenCalledWith(studyHref("plan-still-praying", 1));
    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });
});

describe("usePlansLibrary haptics", () => {
  beforeEach(() => jest.clearAllMocks());

  it("selects with a selection haptic once when the filter changes", () => {
    const { result } = renderLibrary();

    act(() => result.current.library.setFilter("Done"));

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });

  it("is silent when the current filter is picked again", () => {
    const { result } = renderLibrary();

    act(() => result.current.library.setFilter("All"));

    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
  });
});
