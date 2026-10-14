import { http, HttpResponse } from "msw";
import { act, renderHook, waitFor } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL } from "@tests/factories/api";
import { aRecalledQuickCheck } from "@tests/factories/api-lists";
import { uuid } from "@tests/factories/api-plans";
import { buildList } from "@tests/factories/build";
import { forgetShownSearches } from "@tests/mocks/searches-shown";
import { server } from "@tests/mocks/server";
import { useQuickChecksList } from "@/features/progress/hooks/use-quick-checks-list";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  usePreventZoomTransitionDismissal: jest.fn(),
}));

jest.mock("@/core/storage/searches-shown", () =>
  jest.requireActual<object>("@tests/mocks/searches-shown"),
);

jest.mock("@/core/haptics/haptics", () => ({
  tapFeedback: jest.fn(),
  selectionFeedback: jest.fn(),
  successFeedback: jest.fn(),
  warningFeedback: jest.fn(),
  errorFeedback: jest.fn(),
}));

/** `count` finished Quick Checks, the last one on Psalm 23. */
function serveQuickChecks(count: number) {
  const quickChecks = buildList(count, (index) =>
    aRecalledQuickCheck({
      quizId: uuid(100 + index),
      reference: index === count - 1 ? "Psalm 23" : `Romans ${index + 1}`,
    }),
  );
  server.use(http.get(`${API_URL}/v1/me/quick-checks`, () => HttpResponse.json({ quickChecks })));
}

const shownRows = (plans: ReturnType<typeof useQuickChecksList>["plans"]) =>
  plans.flatMap((plan) => plan.rows).length;

beforeEach(() => {
  forgetShownSearches();
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: jest.fn(), push: jest.fn() } as unknown as ReturnType<
      typeof useRouter
    >);
});

describe("useQuickChecksList's search", () => {
  it("isn't offered with nine Quick Checks: scrolling finds one", async () => {
    serveQuickChecks(9);
    const { result } = renderHook(() => useQuickChecksList());

    await waitFor(() => expect(shownRows(result.current.plans)).toBe(9));
    expect(result.current.searchable).toBe(false);
  });

  it("is offered from ten Quick Checks", async () => {
    serveQuickChecks(10);
    const { result } = renderHook(() => useQuickChecksList());

    await waitFor(() => expect(result.current.searchable).toBe(true));
  });

  it("narrows the Quick Checks to what's typed", async () => {
    serveQuickChecks(10);
    const { result } = renderHook(() => useQuickChecksList());
    await waitFor(() => expect(result.current.searchable).toBe(true));

    act(() => result.current.openSearch());
    act(() => result.current.setSearch("psalm"));

    await waitFor(() => expect(shownRows(result.current.plans)).toBe(1));
    expect(result.current.searching).toBe(true);
  });

  it("says nothing matches, with what was typed", async () => {
    serveQuickChecks(10);
    const { result } = renderHook(() => useQuickChecksList());
    await waitFor(() => expect(result.current.searchable).toBe(true));

    act(() => result.current.openSearch());
    act(() => result.current.setSearch("zebra"));

    await waitFor(() => expect(result.current.noMatch).toBe("zebra"));
  });

  it("closes from its own X, every Quick Check back", async () => {
    serveQuickChecks(10);
    const { result } = renderHook(() => useQuickChecksList());
    await waitFor(() => expect(result.current.searchable).toBe(true));

    act(() => result.current.openSearch());
    act(() => result.current.setSearch("psalm"));
    act(() => result.current.closeSearch());

    await waitFor(() => expect(shownRows(result.current.plans)).toBe(10));
    expect(result.current.searching).toBe(false);
  });
});
