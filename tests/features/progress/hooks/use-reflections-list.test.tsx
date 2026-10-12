import { http, HttpResponse } from "msw";
import { act, renderHook } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import { useReflectionsList } from "@/features/progress/hooks/use-reflections-list";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  usePreventZoomTransitionDismissal: jest.fn(),
}));

jest.mock("@/core/storage/reflection-answers", () =>
  jest.requireActual<object>("@tests/mocks/reflection-answers"),
);

jest.mock("@/core/haptics/haptics", () => ({
  tapFeedback: jest.fn(),
  selectionFeedback: jest.fn(),
  successFeedback: jest.fn(),
  warningFeedback: jest.fn(),
  errorFeedback: jest.fn(),
}));

beforeEach(() => {
  server.use(http.get(`${API_URL}/v1/me/reflections`, () => HttpResponse.json({ prompts: [] })));
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: jest.fn(), navigate: jest.fn() } as unknown as ReturnType<
      typeof useRouter
    >);
});

describe("useReflectionsList's search", () => {
  it("closes from its own X: the words cleared, the field gone, the header back", () => {
    const { result } = renderHook(() => useReflectionsList());

    act(() => result.current.openSearch());
    act(() => result.current.setSearch("grace"));
    act(() => result.current.closeSearch());

    expect(result.current.searching).toBe(false);
    expect(result.current.search).toBe("");
  });

  it("stays open, its words kept, when the keyboard's put away with something typed", () => {
    const { result } = renderHook(() => useReflectionsList());

    act(() => result.current.openSearch());
    act(() => result.current.setSearch("grace"));
    act(() => result.current.leaveSearch());

    expect(result.current.searching).toBe(true);
    expect(result.current.search).toBe("grace");
  });
});
