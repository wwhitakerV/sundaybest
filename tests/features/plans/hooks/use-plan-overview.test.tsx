import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import * as haptics from "@/core/haptics/haptics";
import { AppStoreProvider, getLibraryPlans, useAppSelector } from "@/core/store";
import { usePlanOverview } from "@/features/plans/hooks/use-plan-overview";

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
  useLocalSearchParams: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockBack = jest.fn<void, []>();
// Six days, day 1 done, day 2 today.
const ACTIVE = "plan-today-i-choose-to-be-a-blessing";

function wrapper({ children }: { children: ReactNode }) {
  return <AppStoreProvider>{children}</AppStoreProvider>;
}

function renderOverview(params: Record<string, string> = { planId: ACTIVE }) {
  jest.mocked(useLocalSearchParams).mockReturnValue(params);
  return renderHook(() => usePlanOverview(), { wrapper });
}

beforeEach(() => {
  mockPush.mockClear();
  mockBack.mockClear();
  jest.clearAllMocks();
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush, back: mockBack } as unknown as ReturnType<typeof useRouter>);
});

describe("usePlanOverview", () => {
  it("finds no plan when there is no planId", () => {
    const { result } = renderOverview({});

    expect(result.current.found).toBe(false);
  });

  it("finds no plan for an id the store doesn't have", () => {
    const { result } = renderOverview({ planId: "plan-nope" });

    expect(result.current.found).toBe(false);
  });

  it("says where the plan stands in the hero's words", () => {
    const { result } = renderOverview();

    expect(result.current).toMatchObject({
      found: true,
      planId: ACTIVE,
      totalDays: 6,
      continueLabel: "Continue Day 2",
      hero: { totalDays: 6, completedDayCount: 1, words: { status: "IN PROGRESS · DAY 2 OF 6" } },
    });
  });

  it("has a tile for each day", () => {
    const { result } = renderOverview();

    expect(result.current.found && result.current.tiles).toHaveLength(6);
  });

  it("starts with the plan's current day picked", () => {
    const { result } = renderOverview();

    expect(result.current.found && result.current.selectedNumber).toBe(2);
  });

  it("picks another day", () => {
    const { result } = renderOverview();

    act(() => {
      if (result.current.found) result.current.pickDay(1);
    });

    expect(result.current.found && result.current.selectedNumber).toBe(1);
  });

  it("opens the current day's study with openCurrentDay", () => {
    const { result } = renderOverview();

    act(() => {
      if (result.current.found) result.current.openCurrentDay();
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/study/[planId]",
      params: { planId: ACTIVE, day: "2" },
    });
  });

  it("opens the selected day's study from one of its steps", () => {
    const { result } = renderOverview();
    act(() => {
      if (result.current.found) result.current.pickDay(1);
    });

    act(() => {
      if (result.current.found) result.current.openStep("read");
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/study/[planId]",
      params: { planId: ACTIVE, day: "1" },
    });
  });

  it("opens the selected day's Quick Check from its Quick Check step", () => {
    const { result } = renderOverview();

    act(() => {
      if (result.current.found) result.current.openStep("quickCheck");
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/study/[planId]/quick-check",
      params: { planId: ACTIVE, day: "2" },
    });
  });

  it("goes back with goBack", () => {
    const { result } = renderOverview();

    act(() => {
      if (result.current.found) result.current.goBack();
    });

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

describe("usePlanOverview haptics", () => {
  it("gives a selection haptic, not a tap, when another day is picked", () => {
    const { result } = renderOverview();

    act(() => {
      if (result.current.found) result.current.pickDay(1);
    });

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });

  it("is silent when the day already picked is picked again", () => {
    const { result } = renderOverview();

    act(() => {
      if (result.current.found) result.current.pickDay(2);
    });

    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });

  it("taps as openCurrentDay opens the study", () => {
    const { result } = renderOverview();

    act(() => {
      if (result.current.found) result.current.openCurrentDay();
    });

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });
});

describe("usePlanOverview's More menu", () => {
  function renderMore() {
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: ACTIVE });
    return renderHook(
      () => ({
        overview: usePlanOverview(),
        savedIds: useAppSelector((state) => getLibraryPlans(state).map((plan) => plan.id)),
      }),
      { wrapper },
    );
  }

  function more(result: ReturnType<typeof renderMore>["result"]) {
    const { overview } = result.current;
    if (!overview.found) throw new Error("the plan should be found");
    return overview.more;
  }

  it("is closed at first, opens on show(), and closes on close()", () => {
    const { result } = renderMore();
    expect(more(result).open).toBe(false);

    act(() => more(result).show());
    expect(more(result).open).toBe(true);

    act(() => more(result).close());
    expect(more(result).open).toBe(false);
  });

  it("offers save, reminder, and how it's made, in that order", () => {
    const { result } = renderMore();

    expect(more(result).items.map((item) => item.key)).toEqual(["save", "reminder", "howMade"]);
    expect(more(result).items.map((item) => item.label)).toEqual([
      "Save plan",
      "Daily reminder",
      "How plans are made",
    ]);
  });

  it("saves the plan to the library, and offers to remove it", () => {
    const { result } = renderMore();
    expect(result.current.savedIds).not.toContain(ACTIVE);

    act(() => more(result).items[0]?.select());

    expect(result.current.savedIds).toContain(ACTIVE);
    expect(more(result).items[0]?.label).toBe("Remove from Saved");
  });

  it("removes the plan from the library when selected again", () => {
    const { result } = renderMore();
    act(() => more(result).items[0]?.select());

    act(() => more(result).items[0]?.select());

    expect(result.current.savedIds).not.toContain(ACTIVE);
    expect(more(result).items[0]?.label).toBe("Save plan");
  });

  it("gives a selection haptic once for each change to the library", () => {
    const { result } = renderMore();

    act(() => more(result).items[0]?.select());
    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);

    act(() => more(result).items[0]?.select());
    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(2);
  });

  it("opens the daily reminder, with no haptic", () => {
    const { result } = renderMore();

    act(() => more(result).items[1]?.select());

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/daily-reminder");
    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });

  it("opens how plans are made, with no haptic", () => {
    const { result } = renderMore();

    act(() => more(result).items[2]?.select());

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/how-plans-are-made");
    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });
});
