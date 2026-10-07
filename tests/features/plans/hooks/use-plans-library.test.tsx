import { act, renderHook, waitFor } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { aPlan } from "@tests/factories/api-plans";
import { servePlans } from "@tests/mocks/plans-api";
import * as haptics from "@/core/haptics/haptics";
import { planOverviewHref, studyHref } from "@/entities/plan";
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

/** Six days, day 1 done, day 2 today. Newest of the reader's own. */
const ACTIVE = aPlan({
  seed: 1,
  lengthDays: 6,
  completedDays: 1,
  createdAt: "2026-10-04T12:00:00.000Z",
});
/** Every day done. */
const FINISHED = aPlan({ seed: 2, status: "completed", createdAt: "2026-10-03T12:00:00.000Z" });
/** Not started, kept in Saved, from another church. */
const NOT_STARTED = aPlan({
  seed: 3,
  status: "ready",
  saved: true,
  church: "Elevation Church",
  createdAt: "2026-10-02T12:00:00.000Z",
});
/** The sample, and a plan put away: neither is the reader's library. */
const SAMPLE = aPlan({ seed: 9, status: "ready", isSample: true });
const ARCHIVED = aPlan({ seed: 4, status: "archived" });

/** The library, once the reader's plans have arrived. */
async function renderLibrary(
  plans: Parameters<typeof servePlans>[0] = [ACTIVE, FINISHED, NOT_STARTED, SAMPLE, ARCHIVED],
) {
  const seen = servePlans(plans);
  const view = renderHook(() => usePlansLibrary());
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return { ...view, seen };
}

/** The card for a plan, from the library's cards. */
function cardFor(result: { current: ReturnType<typeof usePlansLibrary> }, planId: string) {
  const card = result.current.cards.find(({ plan }) => plan.id === planId);
  if (!card) throw new Error(`No card for ${planId}`);
  return card;
}

beforeEach(() => {
  mockPush.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("usePlansLibrary", () => {
  it("starts on All", async () => {
    const { result } = await renderLibrary();

    expect(result.current.filter).toBe("All");
  });

  it("shows a card for each of the reader's own plans on All, newest first", async () => {
    const { result } = await renderLibrary();

    expect(result.current.cards.map(({ plan }) => plan.id)).toEqual([
      ACTIVE.id,
      FINISHED.id,
      NOT_STARTED.id,
    ]);
  });

  it("counts each filter's plans in its options", async () => {
    const { result } = await renderLibrary();

    expect(result.current.filters).toEqual([
      { label: "All", count: 3 },
      { label: "In progress", count: 1 },
      { label: "Done", count: 1 },
      { label: "Saved", count: 1 },
    ]);
  });

  it("narrows to the finished plans on setFilter(Done)", async () => {
    const { result } = await renderLibrary();

    act(() => result.current.setFilter("Done"));

    expect(result.current.filter).toBe("Done");
    expect(result.current.cards.map(({ plan }) => plan.id)).toEqual([FINISHED.id]);
  });

  it("gives each card the plan's completion percentage", async () => {
    const { result } = await renderLibrary();

    // Six days, day 1 done; and one not started.
    expect(cardFor(result, ACTIVE.id).percent).toBe(17);
    expect(cardFor(result, NOT_STARTED.id).percent).toBe(0);
  });

  it("opens a plan's overview with openPlan", async () => {
    const { result } = await renderLibrary();

    act(() => result.current.openPlan(ACTIVE.id));

    expect(mockPush).toHaveBeenCalledWith(planOverviewHref(ACTIVE.id));
  });

  it("is waiting until the plans arrive", () => {
    servePlans([ACTIVE]);
    const { result } = renderHook(() => usePlansLibrary());

    expect(result.current.loading).toBe(true);
  });
});

describe("usePlansLibrary continue", () => {
  it("gives a plan in progress the day it is on as continueDay", async () => {
    const { result } = await renderLibrary();

    expect(cardFor(result, ACTIVE.id).continueDay).toBe(2);
  });

  it("marks only a finished plan as done", async () => {
    const { result } = await renderLibrary();

    expect(result.current.cards.filter(({ done }) => done).map(({ plan }) => plan.id)).toEqual([
      FINISHED.id,
    ]);
  });

  it("gives a plan not started or done a null continueDay", async () => {
    const { result } = await renderLibrary();

    expect(cardFor(result, NOT_STARTED.id).continueDay).toBeNull();
    expect(cardFor(result, FINISHED.id).continueDay).toBeNull();
  });

  it("opens the study at that day with Continue, with one tap haptic", async () => {
    const { result } = await renderLibrary();

    act(() => result.current.actionFor(cardFor(result, ACTIVE.id)).action?.onPress());

    expect(mockPush).toHaveBeenCalledWith(studyHref(ACTIVE.id, 2));
    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });

  it("opens the plan instead when its day isn't open yet", async () => {
    const waiting = aPlan({ seed: 1, lengthDays: 6, completedDays: 1, currentDayStatus: "locked" });
    const { result } = await renderLibrary([waiting]);

    act(() => result.current.actionFor(cardFor(result, waiting.id)).action?.onPress());

    expect(mockPush).toHaveBeenCalledWith(planOverviewHref(waiting.id));
  });

  it("offers no action on a finished plan", async () => {
    const { result } = await renderLibrary();

    expect(result.current.actionFor(cardFor(result, FINISHED.id))).toEqual({});
  });
});

describe("usePlansLibrary start", () => {
  it("gives each card its sermon's church", async () => {
    const { result } = await renderLibrary();

    expect(cardFor(result, NOT_STARTED.id).church).toBe("Elevation Church");
  });

  it("marks only a plan not started as startable", async () => {
    const { result } = await renderLibrary();

    expect(
      result.current.cards.filter(({ startable }) => startable).map(({ plan }) => plan.id),
    ).toEqual([NOT_STARTED.id]);
    expect(result.current.actionFor(cardFor(result, NOT_STARTED.id)).action?.label).toBe("Start");
  });

  it("starts the plan with Start, and opens its first day, with one tap haptic", async () => {
    const { result, seen } = await renderLibrary();

    act(() => result.current.actionFor(cardFor(result, NOT_STARTED.id)).action?.onPress());

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(studyHref(NOT_STARTED.id, 1)));
    expect(seen).toContainEqual(
      expect.objectContaining({ method: "POST", path: `/v1/plans/${NOT_STARTED.id}/start` }),
    );
    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });
});

describe("usePlansLibrary haptics", () => {
  it("selects with a selection haptic once when the filter changes", async () => {
    const { result } = await renderLibrary();

    act(() => result.current.setFilter("Done"));

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
  });

  it("is silent when the current filter is picked again", async () => {
    const { result } = await renderLibrary();

    act(() => result.current.setFilter("All"));

    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
  });
});
