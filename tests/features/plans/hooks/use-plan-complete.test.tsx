import { act, renderHook, waitFor } from "@tests/helpers/render";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { aPlan } from "@tests/factories/api-plans";
import { servePlans } from "@tests/mocks/plans-api";
import * as haptics from "@/core/haptics/haptics";
import { countReflectionAnswers } from "@/core/storage/reflection-answers";
import { NEW_PLAN_HREF, planOverviewHref } from "@/entities/plan";
import { usePlanComplete } from "@/features/plans/hooks/use-plan-complete";

jest.mock("@/core/haptics/haptics", () => ({
  tapFeedback: jest.fn(),
  selectionFeedback: jest.fn(),
  successFeedback: jest.fn(),
  warningFeedback: jest.fn(),
  errorFeedback: jest.fn(),
}));

// Notes live on the device only; the count is all Plan Complete reads.
jest.mock("@/core/storage/reflection-answers", () => ({ countReflectionAnswers: jest.fn() }));

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockNavigate = jest.fn<void, [ExpoRouter.Href]>();
const mockExitSession = jest.fn<void, []>();

/** Seven days done; every Quick Check right but two answers on day 1. */
const FINISHED = (() => {
  const plan = aPlan({ seed: 4, title: "Break the Cycle", status: "completed", lengthDays: 7 });
  return {
    ...plan,
    days: plan.days.map((day) =>
      day.dayNumber === 1 && day.quickCheck
        ? { ...day, quickCheck: { ...day.quickCheck, correctCount: 1 } }
        : day,
    ),
  };
})();

async function renderPlanComplete(params: Record<string, string> = { planId: FINISHED.id }) {
  servePlans([FINISHED]);
  jest.mocked(useLocalSearchParams).mockReturnValue(params);
  const view = renderHook(() => usePlanComplete());
  await waitFor(() => expect(view.result.current.loading).toBe(false), { timeout: 10000 });
  return view;
}

beforeEach(() => {
  jest.mocked(countReflectionAnswers).mockResolvedValue(5);
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitSession }),
  });
  jest
    .mocked(useRouter)
    .mockReturnValue({ navigate: mockNavigate } as unknown as ReturnType<typeof useRouter>);
});

describe("usePlanComplete", () => {
  it("finds nothing for a plan the server doesn't have", async () => {
    const { result } = await renderPlanComplete({
      planId: "00000000-0000-4000-8000-00000000dead",
    });

    expect(result.current.found).toBe(false);
  });

  it("finds nothing when the params aren't a plan", async () => {
    servePlans([FINISHED]);
    jest.mocked(useLocalSearchParams).mockReturnValue({});
    const { result } = renderHook(() => usePlanComplete());

    expect(result.current.found).toBe(false);
    await waitFor(() => expect(result.current.loading).toBe(true));
  });

  it("summarises the finished plan: its days, the notes on this device, and its Quick Checks", async () => {
    const { result } = await renderPlanComplete();

    expect(result.current).toMatchObject({
      found: true,
      summary: { completedDays: 7, totalDays: 7, notes: 5, quizCorrect: 19, quizTotal: 21 },
    });
  });

  it("counts the notes to the plan's own questions", async () => {
    await renderPlanComplete();

    const asked = jest.mocked(countReflectionAnswers).mock.calls[0]?.[1];
    expect(asked).toEqual(
      FINISHED.days.flatMap((day) => day.reflectionPrompts.map(({ id }) => id)),
    );
  });

  it("leaves the session for the plan's overview on close", async () => {
    const { result } = await renderPlanComplete();

    act(() => result.current.close());

    expect(mockExitSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(planOverviewHref(FINISHED.id));
  });

  it("leaves the session for New Plan on addSermon", async () => {
    const { result } = await renderPlanComplete();

    act(() => {
      if (result.current.found) result.current.addSermon();
    });

    expect(mockExitSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(NEW_PLAN_HREF);
  });
});

describe("usePlanComplete haptics", () => {
  it("taps as Add sermon is pressed", async () => {
    const { result } = await renderPlanComplete();

    act(() => {
      if (result.current.found) result.current.addSermon();
    });

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });

  it("gives nothing as Close returns to the plan", async () => {
    const { result } = await renderPlanComplete();

    act(() => result.current.close());

    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });
});
