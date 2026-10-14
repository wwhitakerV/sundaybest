import { http, HttpResponse } from "msw";
import { act, renderHook, waitFor } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL } from "@tests/factories/api";
import { aWeek, aWeekPlan } from "@tests/factories/api-lists";
import { buildList } from "@tests/factories/build";
import { forgetShownSearches } from "@tests/mocks/searches-shown";
import { server } from "@tests/mocks/server";
import { placePlanHref } from "@/entities/tabs";
import { useWeeksBrowser } from "@/features/progress/hooks/use-weeks-browser";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@/core/storage/reflection-answers", () =>
  jest.requireActual<object>("@tests/mocks/reflection-answers"),
);

jest.mock("@/core/storage/searches-shown", () =>
  jest.requireActual<object>("@tests/mocks/searches-shown"),
);

const calls: string[] = [];
const mockBack = jest.fn(() => calls.push("back"));
const mockPush = jest.fn((href: ExpoRouter.Href) => calls.push(JSON.stringify(href)));

/** `count` weeks a plan ran in, a week apart, newest first — the last one's plan "The Shepherd". */
function serveWeeks(count: number) {
  const weeks = buildList(count, (index) =>
    aWeek({
      weekStart: new Date(Date.UTC(2026, 8, 20 - 7 * index)).toISOString().slice(0, 10),
      plans: [aWeekPlan(index === count - 1 ? { title: "The Shepherd" } : {})],
    }),
  );
  server.use(
    http.get(`${API_URL}/v1/me/weeks`, () =>
      HttpResponse.json({ currentWeekStart: "2026-09-20", weeks }),
    ),
  );
}

const shownWeeks = (months: ReturnType<typeof useWeeksBrowser>["months"]) =>
  months.flatMap((month) => month.cards).length;

beforeEach(() => {
  forgetShownSearches();
  calls.length = 0;
  server.use(http.get(`${API_URL}/v1/me/weeks`, () => HttpResponse.json({ weeks: [] })));
  jest.mocked(useLocalSearchParams).mockReturnValue({});
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: mockBack, push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("useWeeksBrowser", () => {
  it("opens a week's plan on top of Weeks, in one movement: Back returns to Weeks", () => {
    const { result } = renderHook(() => useWeeksBrowser());

    act(() => result.current.openPlan("plan-1"));

    expect(calls).toEqual([JSON.stringify(placePlanHref("over", "plan-1"))]);
  });
});

describe("useWeeksBrowser's search", () => {
  it("isn't offered with seven weeks: scrolling finds one", async () => {
    serveWeeks(7);
    const { result } = renderHook(() => useWeeksBrowser());

    await waitFor(() => expect(shownWeeks(result.current.months)).toBe(7));
    expect(result.current.searchable).toBe(false);
  });

  it("is offered from eight weeks", async () => {
    serveWeeks(8);
    const { result } = renderHook(() => useWeeksBrowser());

    await waitFor(() => expect(result.current.searchable).toBe(true));
  });

  it("narrows the weeks to what's typed", async () => {
    serveWeeks(8);
    const { result } = renderHook(() => useWeeksBrowser());
    await waitFor(() => expect(result.current.searchable).toBe(true));

    act(() => result.current.openSearch());
    act(() => result.current.setSearch("shepherd"));

    await waitFor(() => expect(shownWeeks(result.current.months)).toBe(1));
    expect(result.current.searching).toBe(true);
  });

  it("closes from its own X, every week back", async () => {
    serveWeeks(8);
    const { result } = renderHook(() => useWeeksBrowser());
    await waitFor(() => expect(result.current.searchable).toBe(true));

    act(() => result.current.openSearch());
    act(() => result.current.setSearch("shepherd"));
    act(() => result.current.closeSearch());

    await waitFor(() => expect(shownWeeks(result.current.months)).toBe(8));
    expect(result.current.searching).toBe(false);
  });
});
