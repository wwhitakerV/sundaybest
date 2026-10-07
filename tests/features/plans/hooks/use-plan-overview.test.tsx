import { Alert } from "react-native";
import { act, renderHook, waitFor } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { aPlan } from "@tests/factories/api-plans";
import { servePlans } from "@tests/mocks/plans-api";
import * as haptics from "@/core/haptics/haptics";
import { PLANS_HREF, quickCheckHref, studyHref } from "@/entities/plan";
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
const mockReplace = jest.fn<void, [ExpoRouter.Href]>();

/** Six days, day 1 done, day 2 today. */
const ACTIVE = aPlan({ seed: 1, lengthDays: 6, completedDays: 1 });

type Overview = ReturnType<typeof usePlanOverview>;
type Found = Extract<Overview, { found: true }>;

/** Plan Overview's view model for these route params, once the plan has arrived. */
async function renderOverview(
  params: Record<string, string> = { planId: ACTIVE.id },
  plans: Parameters<typeof servePlans>[0] = [ACTIVE],
) {
  const seen = servePlans(plans);
  jest.mocked(useLocalSearchParams).mockReturnValue(params);
  const view = renderHook(() => usePlanOverview());
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return { ...view, seen };
}

/** The view model, which must have found its plan. */
function found(result: { current: Overview }): Found {
  if (!result.current.found) throw new Error("the plan should be found");
  return result.current;
}

beforeEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
  jest.mocked(useRouter).mockReturnValue({
    push: mockPush,
    replace: mockReplace,
  } as unknown as ReturnType<typeof useRouter>);
});

describe("usePlanOverview", () => {
  it("finds no plan when there is no planId", () => {
    servePlans([ACTIVE]);
    jest.mocked(useLocalSearchParams).mockReturnValue({});
    const { result } = renderHook(() => usePlanOverview());

    expect(result.current.found).toBe(false);
  });

  it("finds no plan for an id the server doesn't have, and says why", async () => {
    servePlans([ACTIVE]);
    jest
      .mocked(useLocalSearchParams)
      .mockReturnValue({ planId: "00000000-0000-4000-8000-00000000dead" });
    const { result } = renderHook(() => usePlanOverview());

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.found).toBe(false);
  });

  it("says where the plan stands in the hero's words", async () => {
    const { result } = await renderOverview();

    expect(result.current).toMatchObject({
      found: true,
      planId: ACTIVE.id,
      totalDays: 6,
      continueLabel: "Continue Day 2",
      continueWaiting: false,
      hero: { totalDays: 6, completedDayCount: 1, words: { status: "IN PROGRESS · DAY 2 OF 6" } },
    });
  });

  it("says the next day opens tomorrow, once today's is done", async () => {
    const waiting = aPlan({ seed: 1, lengthDays: 6, completedDays: 1, currentDayStatus: "locked" });
    const { result } = await renderOverview({ planId: waiting.id }, [waiting]);

    expect(result.current).toMatchObject({
      continueLabel: "Day 2 tomorrow",
      continueWaiting: true,
    });
  });

  it("has a tile for each day", async () => {
    const { result } = await renderOverview();

    expect(found(result).tiles).toHaveLength(6);
  });

  it("starts with the plan's current day picked", async () => {
    const { result } = await renderOverview();

    expect(found(result).selectedNumber).toBe(2);
  });

  it("picks another day", async () => {
    const { result } = await renderOverview();

    act(() => found(result).pickDay(1));

    expect(found(result).selectedNumber).toBe(1);
  });

  it("opens the current day's study at its next step with openCurrentDay", async () => {
    const { result } = await renderOverview();

    act(() => found(result).openCurrentDay());

    expect(mockPush).toHaveBeenCalledWith(studyHref(ACTIVE.id, 2, "read"));
  });

  it("goes on at the step after the ones done", async () => {
    const partway = aPlan({
      seed: 1,
      lengthDays: 6,
      completedDays: 1,
      currentDayStatus: "inProgress",
      currentDaySteps: ["read", "scripture"],
    });
    const { result } = await renderOverview({ planId: partway.id }, [partway]);

    act(() => found(result).openCurrentDay());

    expect(mockPush).toHaveBeenCalledWith(studyHref(partway.id, 2, "reflect"));
  });

  it("goes straight to the Quick Check once the day's study is done", async () => {
    const studied = aPlan({
      seed: 1,
      lengthDays: 6,
      completedDays: 1,
      currentDayStatus: "inProgress",
      currentDaySteps: ["read", "scripture", "reflect", "pray"],
    });
    const { result } = await renderOverview({ planId: studied.id }, [studied]);

    act(() => found(result).openCurrentDay());

    expect(mockPush).toHaveBeenCalledWith(quickCheckHref(studied.id, 2));
  });

  it("picks a day not open yet, rather than opening it, with openCurrentDay", async () => {
    const waiting = aPlan({ seed: 1, lengthDays: 6, completedDays: 1, currentDayStatus: "locked" });
    const { result } = await renderOverview({ planId: waiting.id }, [waiting]);
    act(() => found(result).pickDay(1));

    act(() => found(result).openCurrentDay());

    expect(mockPush).not.toHaveBeenCalled();
    expect(found(result).selectedNumber).toBe(2);
  });

  it("opens the selected day's study at one of its steps", async () => {
    const { result } = await renderOverview();
    act(() => found(result).pickDay(1));

    act(() => found(result).openStep("read"));

    expect(mockPush).toHaveBeenCalledWith(studyHref(ACTIVE.id, 1, "read"));
  });

  it("opens the selected day's Quick Check from its Quick Check step", async () => {
    const { result } = await renderOverview();

    act(() => found(result).openStep("quickCheck"));

    expect(mockPush).toHaveBeenCalledWith(quickCheckHref(ACTIVE.id, 2));
  });

  it("starts a plan not yet started before opening one of its steps", async () => {
    const notStarted = aPlan({ seed: 2, status: "ready", lengthDays: 3 });
    const { result, seen } = await renderOverview({ planId: notStarted.id }, [notStarted]);

    act(() => found(result).openStep("read"));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(studyHref(notStarted.id, 1, "read")));
    expect(seen).toContainEqual(
      expect.objectContaining({ method: "POST", path: `/v1/plans/${notStarted.id}/start` }),
    );
  });

  it("goes back to Plans with goBack, wherever it was opened from", async () => {
    const { result } = await renderOverview();

    act(() => found(result).goBack());

    expect(mockReplace).toHaveBeenCalledWith(PLANS_HREF);
  });
});

describe("usePlanOverview haptics", () => {
  it("gives a selection haptic, not a tap, when another day is picked", async () => {
    const { result } = await renderOverview();

    act(() => found(result).pickDay(1));

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });

  it("is silent when the day already picked is picked again", async () => {
    const { result } = await renderOverview();

    act(() => found(result).pickDay(2));

    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });

  it("taps as openCurrentDay opens the study", async () => {
    const { result } = await renderOverview();

    act(() => found(result).openCurrentDay());

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });
});

describe("usePlanOverview's More menu", () => {
  const more = (result: { current: Overview }) => found(result).more;

  it("is closed at first, opens on show(), and closes on close()", async () => {
    const { result } = await renderOverview();
    expect(more(result).open).toBe(false);

    act(() => more(result).show());
    expect(more(result).open).toBe(true);

    act(() => more(result).close());
    expect(more(result).open).toBe(false);
  });

  it("offers save, reminder, how it's made, and reset, in that order", async () => {
    const { result } = await renderOverview();

    expect(more(result).items.map((item) => item.label)).toEqual([
      "Save plan",
      "Daily reminder",
      "How plans are made",
      "Reset plan",
    ]);
  });

  it("saves the plan, and offers to remove it", async () => {
    const { result, seen } = await renderOverview();

    act(() => more(result).items[0]?.select());

    await waitFor(() => expect(more(result).items[0]?.label).toBe("Remove from Saved"));
    await waitFor(() =>
      expect(seen).toContainEqual(
        expect.objectContaining({ method: "PUT", path: `/v1/plans/${ACTIVE.id}/saved` }),
      ),
    );
  });

  it("removes a saved plan when selected", async () => {
    const saved = aPlan({ seed: 1, lengthDays: 6, completedDays: 1, saved: true });
    const { result, seen } = await renderOverview({ planId: saved.id }, [saved]);
    expect(more(result).items[0]?.label).toBe("Remove from Saved");

    act(() => more(result).items[0]?.select());

    await waitFor(() => expect(more(result).items[0]?.label).toBe("Save plan"));
    await waitFor(() =>
      expect(seen).toContainEqual(
        expect.objectContaining({ method: "DELETE", path: `/v1/plans/${saved.id}/saved` }),
      ),
    );
  });

  it("gives a selection haptic for a change to Saved", async () => {
    const { result } = await renderOverview();

    act(() => more(result).items[0]?.select());

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
  });

  it("opens the daily reminder, with no haptic", async () => {
    const { result } = await renderOverview();

    act(() => more(result).items[1]?.select());

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/daily-reminder");
    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });

  it("opens how plans are made, with no haptic", async () => {
    const { result } = await renderOverview();

    act(() => more(result).items[2]?.select());

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/how-plans-are-made");
    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });

  it("asks before resetting, and resets only once it's confirmed", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const { result, seen } = await renderOverview();

    act(() => more(result).items[3]?.select());

    expect(alert).toHaveBeenCalledWith(
      "Reset this plan?",
      "Your progress, answers, and quiz scores will be cleared. The plan itself stays.",
      expect.any(Array),
    );
    expect(seen.some(({ path }) => path.endsWith("/reset"))).toBe(false);

    const buttons = alert.mock.calls[0]?.[2] ?? [];
    act(() => buttons.find((button) => button.text === "Reset")?.onPress?.());

    await waitFor(() =>
      expect(seen).toContainEqual(
        expect.objectContaining({ method: "POST", path: `/v1/plans/${ACTIVE.id}/reset` }),
      ),
    );
  });

  it("leaves the plan as it is when the reset is cancelled", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const { result, seen } = await renderOverview();

    act(() => more(result).items[3]?.select());
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    act(() => buttons.find((button) => button.text === "Cancel")?.onPress?.());

    expect(seen.some(({ path }) => path.endsWith("/reset"))).toBe(false);
    expect(buttons.find((button) => button.text === "Reset")?.style).toBe("destructive");
  });
});
