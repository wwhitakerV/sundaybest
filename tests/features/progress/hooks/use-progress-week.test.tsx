import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import * as haptics from "@/core/haptics/haptics";
import { AppStoreProvider } from "@/core/store";
import { useProgressWeek } from "@/features/progress/hooks/use-progress-week";
import { addDays } from "@/utils/dates/addDays";

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
// Six days, day 1 done, day 2 today.
const ACTIVE = "plan-today-i-choose-to-be-a-blessing";

function wrapper({ children }: { children: ReactNode }) {
  return <AppStoreProvider>{children}</AppStoreProvider>;
}

beforeEach(() => {
  mockPush.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("useProgressWeek", () => {
  it("starts on this week", () => {
    const { result } = renderHook(() => useProgressWeek(), { wrapper });

    expect(result.current.weekOffset).toBe(0);
  });

  it("moves the week back seven days on previousWeek", () => {
    const { result } = renderHook(() => useProgressWeek(), { wrapper });
    const first = result.current.week.at(0)?.date ?? "";

    act(() => result.current.previousWeek());

    expect(result.current.weekOffset).toBe(-1);
    expect(result.current.week.at(0)?.date).toBe(addDays(first, -7));
  });

  it("moves forward again on nextWeek after going back", () => {
    const { result } = renderHook(() => useProgressWeek(), { wrapper });
    const first = result.current.week.at(0)?.date;
    act(() => result.current.previousWeek());

    act(() => result.current.nextWeek());

    expect(result.current.weekOffset).toBe(0);
    expect(result.current.week.at(0)?.date).toBe(first);
  });

  it("says what's up next: the active plan's day 2", () => {
    const { result } = renderHook(() => useProgressWeek(), { wrapper });

    expect(result.current.upNext).toMatchObject({
      plan: { id: ACTIVE },
      day: { dayNumber: 2 },
    });
  });

  it("opens the up-next plan's overview with openUpNext", () => {
    const { result } = renderHook(() => useProgressWeek(), { wrapper });

    act(() => result.current.openUpNext());

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(tabs)/plans/[planId]",
      params: { planId: ACTIVE },
    });
  });
});

describe("useProgressWeek haptics", () => {
  it("selects once going back a week", () => {
    const { result } = renderHook(() => useProgressWeek(), { wrapper });

    act(() => result.current.previousWeek());

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
  });

  it("selects once going forward a week", () => {
    const { result } = renderHook(() => useProgressWeek(), { wrapper });

    act(() => result.current.nextWeek());

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
  });
});
