import { http, HttpResponse } from "msw";
import { act, renderHook } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import { tabPlanHref } from "@/entities/tabs";
import { useWeeksBrowser } from "@/features/progress/hooks/use-weeks-browser";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

// Weeks opens over Progress.
jest.mock("@/hooks/use-focused-tab", () => ({ useFocusedTab: () => () => "progress" }));

const calls: string[] = [];
const mockBack = jest.fn(() => calls.push("back"));
const mockPush = jest.fn((href: ExpoRouter.Href) => calls.push(JSON.stringify(href)));

beforeEach(() => {
  calls.length = 0;
  server.use(http.get(`${API_URL}/v1/me/weeks`, () => HttpResponse.json({ weeks: [] })));
  jest.mocked(useLocalSearchParams).mockReturnValue({});
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: mockBack, push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("useWeeksBrowser", () => {
  it("closes Weeks, then opens a week's plan in Progress, under it", () => {
    const { result } = renderHook(() => useWeeksBrowser());

    act(() => result.current.openPlan("plan-1"));

    expect(calls).toEqual(["back", JSON.stringify(tabPlanHref("progress", "plan-1"))]);
  });
});
