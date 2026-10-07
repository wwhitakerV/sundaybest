import { act, renderHook, waitFor } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { aPlan, summaryOf } from "@tests/factories/api-plans";
import { servePlans } from "@tests/mocks/plans-api";
import * as haptics from "@/core/haptics/haptics";
import { planOverviewHref, studyHref } from "@/entities/plan";
import { useHomeView } from "@/features/home/hooks/use-home-view";
import { describeApiPlan } from "@/features/plans/logic/api-plan-wording";

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

/** The plan under way: six days, day 1 done, day 2 today. */
const ACTIVE = aPlan({
  seed: 1,
  title: "Today I Choose to Be a Blessing",
  lengthDays: 6,
  completedDays: 1,
});
/** The sample, ready for a reader with none of their own. */
const SAMPLE = aPlan({ seed: 9, status: "ready", isSample: true, lengthDays: 5 });

/** Home's view model, once the reader's plans have arrived. */
async function renderHomeView(plans: Parameters<typeof servePlans>[0] = [ACTIVE, SAMPLE]) {
  servePlans(plans);
  const view = renderHook(() => useHomeView());
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

beforeEach(() => {
  mockPush.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("useHomeView", () => {
  it("is loading until the reader's plans arrive", () => {
    servePlans([ACTIVE]);
    const { result } = renderHook(() => useHomeView());

    expect(result.current.loading).toBe(true);
  });

  it("says what the featured plan's hero holds, in words", async () => {
    const { result } = await renderHomeView();

    expect(result.current.active?.hero).toMatchObject({
      title: "Today I Choose to Be a Blessing",
      currentDay: 2,
      totalDays: 6,
      completedDayCount: 1,
      words: { status: "IN PROGRESS · DAY 2 OF 6", action: "Continue Day 2" },
    });
  });

  it("names today's day on the plan bar", async () => {
    const { result } = await renderHomeView();

    expect(result.current.active?.bar).toMatchObject({
      title: "Today I Choose to Be a Blessing",
      day: "Day 2",
    });
  });

  it("says the next day opens tomorrow, once today's is done", async () => {
    const waiting = aPlan({ seed: 1, lengthDays: 6, completedDays: 1, currentDayStatus: "locked" });
    const { result } = await renderHomeView([waiting]);

    expect(result.current.active?.hero.words).toMatchObject({
      action: "Day 2 tomorrow",
      waiting: true,
    });
    expect(result.current.active?.bar).toMatchObject({ waiting: true });
  });

  it("points the featured plan at its Home plan overview", async () => {
    const { result } = await renderHomeView();

    expect(result.current.active?.href).toEqual({
      pathname: "/(tabs)/home/[planId]",
      params: { planId: ACTIVE.id },
    });
  });

  it("has plans when the user has plans of their own", async () => {
    const { result } = await renderHomeView();

    expect(result.current.hasPlans).toBe(true);
  });

  it("has no active plan, and offers the sample, when there's only the sample", async () => {
    const { result } = await renderHomeView([SAMPLE]);

    expect(result.current.active).toBeNull();
    expect(result.current.hasPlans).toBe(false);
    expect(result.current.sample).toEqual({
      id: SAMPLE.id,
      title: SAMPLE.title,
      detail: describeApiPlan(summaryOf(SAMPLE)),
    });
  });

  it("opens a plan's overview with openPlan", async () => {
    const { result } = await renderHomeView();

    act(() => result.current.openPlan(ACTIVE.id));

    expect(mockPush).toHaveBeenCalledWith(planOverviewHref(ACTIVE.id));
  });

  it("opens New Plan with addSermon", async () => {
    const { result } = await renderHomeView();

    act(() => result.current.addSermon());

    expect(mockPush).toHaveBeenCalledWith("/(plan-creation)/paste-sermon");
  });

  it("opens today's study with continueToday", async () => {
    const { result } = await renderHomeView();

    act(() => result.current.continueToday());

    expect(mockPush).toHaveBeenCalledWith(studyHref(ACTIVE.id, 2));
  });

  it("opens the plan, not a study it can't start, when today's day isn't open yet", async () => {
    const waiting = aPlan({ seed: 1, lengthDays: 6, completedDays: 1, currentDayStatus: "locked" });
    const { result } = await renderHomeView([waiting]);

    act(() => result.current.continueToday());

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(tabs)/home/[planId]",
      params: { planId: waiting.id },
    });
  });

  it("opens the sample plan's overview with openSample", async () => {
    const { result } = await renderHomeView([SAMPLE]);

    act(() => result.current.openSample());

    expect(mockPush).toHaveBeenCalledWith(planOverviewHref(SAMPLE.id));
  });

  it("does nothing on openSample when there is no sample", async () => {
    const { result } = await renderHomeView([ACTIVE]);

    act(() => result.current.openSample());

    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("useHomeView's haptics", () => {
  it("taps as Continue opens today's study", async () => {
    const { result } = await renderHomeView();

    act(() => result.current.continueToday());

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });

  it("taps as Add sermon opens New Plan", async () => {
    const { result } = await renderHomeView();

    act(() => result.current.addSermon());

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });

  it("gives nothing as a plan is opened", async () => {
    const { result } = await renderHomeView();

    act(() => result.current.openPlan(ACTIVE.id));

    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });
});
