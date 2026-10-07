import { http, HttpResponse } from "msw";
import { act, renderHook, waitFor } from "@tests/helpers/render";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL, someSettings } from "@tests/factories/api";
import { aPlan } from "@tests/factories/api-plans";
import { servePlans } from "@tests/mocks/plans-api";
import {
  clearSavedAnswers,
  saveReflectionAnswer,
  savedAnswers,
} from "@tests/mocks/reflection-answers";
import { server } from "@tests/mocks/server";
import * as haptics from "@/core/haptics/haptics";
import type { ApiPlanDetail } from "@/core/api/contracts";
import { dayCompleteHref, quickCheckHref } from "@/entities/plan";
import { useStudySession } from "@/features/plans/hooks/use-study-session";

jest.mock("@/core/haptics/haptics", () => ({
  tapFeedback: jest.fn(),
  selectionFeedback: jest.fn(),
  successFeedback: jest.fn(),
  warningFeedback: jest.fn(),
  errorFeedback: jest.fn(),
}));

jest.mock("@/core/storage/reflection-answers", () =>
  jest.requireActual<object>("@tests/mocks/reflection-answers"),
);

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockReplace = jest.fn<void, [ExpoRouter.Href]>();
const mockExitSession = jest.fn<void, []>();

/** Three days, none done: day 1 open, with a Quick Check. */
const STILL_PRAYING = aPlan({ seed: 2, title: "Still Praying", completedDays: 0 });
/** The same, made without Quick Checks. */
const NO_QUIZ = aPlan({ seed: 3, completedDays: 0, quickCheckEnabled: false });
/** Day 1 part-way: Read done. */
const READ_DONE = aPlan({ seed: 4, completedDays: 0, currentDaySteps: ["read"] });
/** Day 1's four steps done, its Quick Check not taken. */
const STUDIED = aPlan({
  seed: 5,
  completedDays: 0,
  currentDaySteps: ["read", "scripture", "reflect", "pray"],
});
/** Day 1 done — its steps and its Quick Check — and day 2 open. */
const DAY_ONE_DONE = aPlan({ seed: 6, completedDays: 1 });

/** Day 1 of a plan's Daily Study, once it's loaded. */
async function renderStudy(plan: ApiPlanDetail = STILL_PRAYING, params: object = {}) {
  const seen = servePlans([plan]);
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId: plan.id, day: "1", ...params });
  const view = renderHook(() => useStudySession());
  await waitFor(() => expect(view.result.current.loading).toBe(false), { timeout: 10000 });
  return { ...view, seen };
}

type Session = Awaited<ReturnType<typeof renderStudy>>["result"];

/** Presses Next, and waits for the step it records. */
async function next(result: Session) {
  const before = result.current.position;
  act(() => {
    if (result.current.found) result.current.next();
  });
  await waitFor(() => expect(result.current.position).not.toEqual(before));
}

/** Next to the last page: Scripture, two Reflect questions, then Pray. */
async function toPray(result: Session) {
  for (let page = 0; page < 4; page += 1) await next(result);
  expect(result.current.found && result.current.isLastPage).toBe(true);
}

/** Presses Next on the last page — Finish — and lets it settle. */
async function finish(result: Session) {
  await act(async () => {
    if (result.current.found) result.current.next();
    await Promise.resolve();
  });
}

const steps = (seen: { method: string; path: string }[]) =>
  seen
    .filter(({ method, path }) => method === "PUT" && path.includes("/steps/"))
    .map(({ path }) => path.split("/").at(-1));

const completions = (seen: { method: string; path: string }[]) =>
  seen.filter(({ path }) => path.endsWith("/complete"));

beforeEach(() => {
  clearSavedAnswers();
  mockReplace.mockClear();
  mockExitSession.mockClear();
  jest.mocked(useNavigation).mockReturnValue({
    getParent: () => ({ goBack: mockExitSession }),
  });
  jest
    .mocked(useRouter)
    .mockReturnValue({ replace: mockReplace } as unknown as ReturnType<typeof useRouter>);
});

describe("useStudySession", () => {
  it("finds no day when the day isn't a number", async () => {
    const { result } = await renderStudy(STILL_PRAYING, { day: "one" });

    expect(result.current.found).toBe(false);
  });

  it("finds no day when the plan doesn't have it", async () => {
    const { result } = await renderStudy(STILL_PRAYING, { day: "6" });

    expect(result.current.found).toBe(false);
  });

  it("finds no day when the plan doesn't exist", async () => {
    const { result } = await renderStudy(STILL_PRAYING, {
      planId: "00000000-0000-4000-8000-00000000dead",
    });

    expect(result.current.found).toBe(false);
  });

  it("opens on the first page of Read, with the day's context", async () => {
    const { result } = await renderStudy();

    expect(result.current).toMatchObject({
      found: true,
      dayNumber: 1,
      totalDays: 3,
      position: { step: 0, page: 0 },
      pages: [1, 1, 2, 1],
    });
  });

  it("opens on the first step not yet done", async () => {
    const { result } = await renderStudy(READ_DONE);

    expect(result.current.position).toEqual({ step: 1, page: 0 });
  });

  it("opens on the step asked for, done or not", async () => {
    const { result } = await renderStudy(READ_DONE, { step: "read" });

    expect(result.current.position).toEqual({ step: 0, page: 0 });
  });

  it("moves on to Scripture on next(), recording Read as done", async () => {
    const { result, seen } = await renderStudy();

    await next(result);

    expect(result.current.position).toEqual({ step: 1, page: 0 });
    expect(steps(seen)).toEqual(["read"]);
  });

  it("doesn't record a step again that's already done", async () => {
    const { result, seen } = await renderStudy(READ_DONE, { step: "read" });

    await next(result);

    expect(steps(seen)).toEqual([]);
  });

  it("leaves the study on previous() from the first page", async () => {
    const { result } = await renderStudy();

    act(() => {
      if (result.current.found) result.current.previous();
    });

    expect(mockExitSession).toHaveBeenCalledTimes(1);
  });

  it("goes back a step on previous() after the first", async () => {
    const { result } = await renderStudy();
    await next(result);

    await act(async () => {
      if (result.current.found) result.current.previous();
      await Promise.resolve();
    });

    expect(result.current.position).toEqual({ step: 0, page: 0 });
    expect(mockExitSession).not.toHaveBeenCalled();
  });

  it("leaves the study on close()", async () => {
    const { result } = await renderStudy();

    act(() => {
      if (result.current.found) result.current.close();
    });

    expect(mockExitSession).toHaveBeenCalledTimes(1);
  });

  it("shows the answer typed at once, and keeps it on the device, never the server", async () => {
    const { result, seen } = await renderStudy();
    const reflection = STILL_PRAYING.days[0]?.reflectionPrompts[0]?.id ?? "";
    // Read as the screen does, as it renders: unanswered.
    expect(result.current.found && result.current.answerFor(reflection)).toBe("");

    act(() => {
      if (result.current.found) result.current.changeAnswer(reflection, "Still here");
    });

    await waitFor(() =>
      expect(result.current.found && result.current.answerFor(reflection)).toBe("Still here"),
    );
    await waitFor(() => expect(savedAnswers().get(reflection)).toBe("Still here"));
    expect(JSON.stringify(seen)).not.toContain("Still here");
  });

  it("shows an answer already saved on the device", async () => {
    const reflection = STILL_PRAYING.days[0]?.reflectionPrompts[0]?.id ?? "";
    await saveReflectionAnswer("me", reflection, "Written before");

    const { result } = await renderStudy();

    expect(result.current.found && result.current.answerFor(reflection)).toBe("Written before");
  });

  it("doesn't complete the day by reaching the last page", async () => {
    const { result, seen } = await renderStudy(NO_QUIZ);

    await toPray(result);

    expect(steps(seen)).toEqual(["read", "scripture", "reflect"]);
    expect(completions(seen)).toHaveLength(0);
  });

  it("finishes a day without a Quick Check on next() from the last page: prayed, completed, and Day Complete shown", async () => {
    const { result, seen } = await renderStudy(NO_QUIZ);
    await toPray(result);

    await finish(result);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(dayCompleteHref(NO_QUIZ.id, 1)));
    expect(steps(seen)).toContain("pray");
    expect(completions(seen)).toHaveLength(1);
  });

  it("opens the Quick Check, not Day Complete, on Finish — the day not completed until it's taken", async () => {
    const { result, seen } = await renderStudy();
    await toPray(result);

    await finish(result);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(quickCheckHref(STILL_PRAYING.id, 1)),
    );
    expect(completions(seen)).toHaveLength(0);
  });

  it("goes on to Day Complete on Finish, revisiting a day already done", async () => {
    const { result, seen } = await renderStudy(DAY_ONE_DONE, { step: "pray" });

    await finish(result);

    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith(dayCompleteHref(DAY_ONE_DONE.id, 1)),
    );
    expect(completions(seen)).toHaveLength(1);
  });

  it("goes straight on to a Quick Check that's due, when continued with the study done", async () => {
    servePlans([STUDIED]);
    jest.mocked(useLocalSearchParams).mockReturnValue({ planId: STUDIED.id, day: "1" });
    renderHook(() => useStudySession());

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(quickCheckHref(STUDIED.id, 1)));
  });

  it("stays on a done step asked for, though its Quick Check is due", async () => {
    const { result } = await renderStudy(STUDIED, { step: "read" });

    expect(result.current.position).toEqual({ step: 0, page: 0 });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  describe("reading", () => {
    /** The settings changes sent, in order. */
    function serveSettingsChanges() {
      const sent: unknown[] = [];
      server.use(
        http.patch(`${API_URL}/v1/me/settings`, async ({ request }) => {
          const body = (await request.json()) as object;
          sent.push(body);
          return HttpResponse.json({ settings: someSettings(body) });
        }),
      );
      return sent;
    }

    it("starts at the reader's settings: no offset, white paper", async () => {
      const { result } = await renderStudy();

      expect(result.current.found && result.current.reading).toMatchObject({
        textOffset: 0,
        paper: "white",
      });
    });

    it("saves a new text offset on setTextOffset", async () => {
      const sent = serveSettingsChanges();
      const { result } = await renderStudy();

      act(() => {
        if (result.current.found) result.current.reading.setTextOffset(2);
      });

      await waitFor(() => expect(sent).toEqual([{ readingTextOffset: 2 }]));
      await waitFor(() =>
        expect(result.current.found && result.current.reading.textOffset).toBe(2),
      );
    });

    it("refuses an offset off the scale", async () => {
      const sent = serveSettingsChanges();
      const { result } = await renderStudy();

      act(() => {
        if (result.current.found) result.current.reading.setTextOffset(3);
      });

      expect(sent).toEqual([]);
      expect(haptics.selectionFeedback).not.toHaveBeenCalled();
    });

    it("saves a new paper on setPaper", async () => {
      const sent = serveSettingsChanges();
      const { result } = await renderStudy();

      act(() => {
        if (result.current.found) result.current.reading.setPaper("night");
      });

      await waitFor(() => expect(sent).toEqual([{ readingPaper: "night" }]));
    });
  });
});

describe("useStudySession haptics", () => {
  it("taps on Next", async () => {
    const { result } = await renderStudy();

    await next(result);

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
  });

  it("gives nothing on Previous from the first page, which closes the session", async () => {
    const { result } = await renderStudy();

    act(() => {
      if (result.current.found) result.current.previous();
    });

    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });

  it("gives success on finishing the day", async () => {
    const { result } = await renderStudy(NO_QUIZ);
    await toPray(result);
    jest.mocked(haptics.tapFeedback).mockClear();

    await finish(result);

    await waitFor(() => expect(haptics.successFeedback).toHaveBeenCalledTimes(1));
    expect(haptics.tapFeedback).not.toHaveBeenCalled();
  });

  it("taps, and gives no success, on Finish into the Quick Check", async () => {
    const { result } = await renderStudy();
    await toPray(result);
    jest.mocked(haptics.tapFeedback).mockClear();

    await finish(result);

    await waitFor(() => expect(haptics.tapFeedback).toHaveBeenCalledTimes(1));
    expect(haptics.successFeedback).not.toHaveBeenCalled();
  });

  it("selects once when the text size steps", async () => {
    server.use(
      http.patch(`${API_URL}/v1/me/settings`, () =>
        HttpResponse.json({ settings: someSettings({ readingTextOffset: 2 }) }),
      ),
    );
    const { result } = await renderStudy();

    act(() => {
      if (result.current.found) result.current.reading.setTextOffset(2);
    });

    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
  });

  it("is silent when the text size is set to what it already is", async () => {
    const { result } = await renderStudy();

    act(() => {
      if (result.current.found) result.current.reading.setTextOffset(0);
    });

    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
  });

  it("is silent when the current paper is picked again", async () => {
    const { result } = await renderStudy();

    act(() => {
      if (result.current.found) result.current.reading.setPaper("white");
    });

    expect(haptics.selectionFeedback).not.toHaveBeenCalled();
  });
});
