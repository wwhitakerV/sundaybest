import { createRef } from "react";
import type { View } from "react-native";
import { http, HttpResponse } from "msw";
import { act, renderHook, waitFor } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL, someSettings } from "@tests/factories/api";
import { aPlan } from "@tests/factories/api-plans";
import { servePlans } from "@tests/mocks/plans-api";
import { forgetLikedVerses, likedVerses } from "@tests/mocks/liked-verses";
import { server } from "@tests/mocks/server";
import * as haptics from "@/core/haptics/haptics";
import { openShareSheet } from "@/core/sharing/share-sheet";
import { studyHref } from "@/entities/plan";
import { useHomeView } from "@/features/home/hooks/use-home-view";

jest.mock("@/core/haptics/haptics", () => ({
  tapFeedback: jest.fn(),
  selectionFeedback: jest.fn(),
  successFeedback: jest.fn(),
  warningFeedback: jest.fn(),
  errorFeedback: jest.fn(),
}));

jest.mock("@/core/storage/liked-verses", () =>
  jest.requireActual<object>("@tests/mocks/liked-verses"),
);

jest.mock("@/core/sharing/share-sheet", () => ({
  openShareSheet: jest.fn(() => Promise.resolve()),
  snapshotPng: jest.fn(() => Promise.resolve("cG5n")),
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

  it("is onboarding, with no active plan, when there's only the sample", async () => {
    const { result } = await renderHomeView([SAMPLE]);

    expect(result.current.active).toBeNull();
    expect(result.current.hasPlans).toBe(false);
    expect(result.current.onboarding).toBe(true);
  });

  it("isn't onboarding once there's a plan of their own", async () => {
    const { result } = await renderHomeView([ACTIVE, SAMPLE]);

    expect(result.current.onboarding).toBe(false);
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
});

describe("useHomeView's verse of the day", () => {
  // Monday 19 October 2026: Colossians 3:13.
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-19T10:00:00"), advanceTimers: true });
    jest.mocked(openShareSheet).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("offers today's verse, in the reader's translation, with the day's line", async () => {
    const { result } = await renderHomeView();

    expect(result.current.verse).toMatchObject({
      verse: expect.stringMatching(/^Bear with one another and forgive/) as string,
      reference: "Colossians 3:13 · BSB",
      caption: "Forgive without pretending the trust was never broken.",
    });
  });

  it("is in the KJV for a reader who reads it", async () => {
    server.use(
      http.get(`${API_URL}/v1/me/settings`, () =>
        HttpResponse.json({ settings: someSettings({ bibleTranslation: "KJV" }) }),
      ),
    );
    const { result } = await renderHomeView();

    await waitFor(() => expect(result.current.verse?.reference).toBe("Colossians 3:13 · KJV"));
    expect(result.current.verse?.verse).toMatch(/^Forbearing one another/);
  });

  it("shares it through iOS's share sheet, as its picture and its words, with a tap", async () => {
    const { result } = await renderHomeView();

    await act(() => result.current.verse?.share(createRef<View>()));

    expect(haptics.tapFeedback).toHaveBeenCalledTimes(1);
    expect(openShareSheet).toHaveBeenCalledWith({
      message: expect.stringMatching(
        /^“Bear with one another[\s\S]*”\nColossians 3:13 \(BSB\)$/,
      ) as string,
      png: "cG5n",
    });
  });

  it("names the day it's for", async () => {
    const { result } = await renderHomeView();

    expect(result.current.verse?.day).toBe("Monday, October 19");
  });

  it("isn't liked until it's liked", async () => {
    forgetLikedVerses();
    const { result } = await renderHomeView();

    expect(result.current.verse?.liked).toBe(false);
  });

  it("is liked with a selection haptic, and the like is kept on the phone", async () => {
    forgetLikedVerses();
    const { result } = await renderHomeView();
    await waitFor(() => expect(result.current.verse?.likeReady).toBe(true));

    act(() => result.current.verse?.toggleLike());

    await waitFor(() => expect(result.current.verse?.liked).toBe(true));
    expect(haptics.selectionFeedback).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(likedVerses().has("2026-10-19")).toBe(true));
  });

  it("opens one share sheet for a quick second tap", async () => {
    const { result } = await renderHomeView();

    const card = createRef<View>();
    await act(() =>
      Promise.all([result.current.verse?.share(card), result.current.verse?.share(card)]),
    );

    expect(openShareSheet).toHaveBeenCalledTimes(1);
  });
});
