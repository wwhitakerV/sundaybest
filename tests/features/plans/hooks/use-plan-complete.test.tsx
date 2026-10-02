import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import * as haptics from "@/core/haptics/haptics";
import { AppStoreProvider } from "@/core/store";
import { usePlanComplete } from "@/features/plans/hooks/use-plan-complete";

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

const mockNavigate = jest.fn<void, [ExpoRouter.Href]>();
const mockExitSession = jest.fn<void, []>();

// Finished in the mock data: seven days, a note on each, a Quick Check per day and one for the plan.
const FINISHED = "plan-break-the-cycle-of-negative-thinking";

function wrapper({ children }: { children: ReactNode }) {
  return <AppStoreProvider>{children}</AppStoreProvider>;
}

function renderPlanComplete(params: Record<string, string>) {
  jest.mocked(useLocalSearchParams).mockReturnValue(params);
  return renderHook(() => usePlanComplete(), { wrapper });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitSession }),
  });
  jest
    .mocked(useRouter)
    .mockReturnValue({ navigate: mockNavigate } as unknown as ReturnType<typeof useRouter>);
});

describe("usePlanComplete", () => {
  it("finds nothing for a plan that doesn't exist", () => {
    const { result } = renderPlanComplete({ planId: "plan-nope" });

    expect(result.current).toEqual({ found: false });
  });

  it("finds nothing when the params aren't a plan", () => {
    const { result } = renderPlanComplete({});

    expect(result.current).toEqual({ found: false });
  });

  it("summarises the finished plan from the store", () => {
    const { result } = renderPlanComplete({ planId: FINISHED });

    expect(result.current).toMatchObject({
      found: true,
      summary: { completedDays: 7, totalDays: 7, notes: 7, quizCorrect: 16, quizTotal: 21 },
    });
  });

  it("leaves the session for the plan's overview on close", () => {
    const { result } = renderPlanComplete({ planId: FINISHED });

    act(() => {
      if (result.current.found) result.current.close();
    });

    expect(mockExitSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: "/(tabs)/plans/[planId]",
      params: { planId: FINISHED },
    });
  });

  it("leaves the session for New Plan on addSermon", () => {
    const { result } = renderPlanComplete({ planId: FINISHED });

    act(() => {
      if (result.current.found) result.current.addSermon();
    });

    expect(mockExitSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/(plan-creation)/paste-sermon");
  });
});

describe("usePlanComplete haptics", () => {
  it("taps as Add sermon is pressed", () => {
    const { result } = renderPlanComplete({ planId: FINISHED });

    act(() => {
      if (result.current.found) result.current.addSermon();
    });

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });

  it("gives nothing as Close returns to the plan", () => {
    const { result } = renderPlanComplete({ planId: FINISHED });

    act(() => {
      if (result.current.found) result.current.close();
    });

    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });
});
