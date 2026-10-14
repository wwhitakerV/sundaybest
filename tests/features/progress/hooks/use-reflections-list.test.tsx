import { http, HttpResponse } from "msw";
import { act, renderHook, waitFor } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL } from "@tests/factories/api";
import { aReflectionPrompt } from "@tests/factories/api-lists";
import { uuid } from "@tests/factories/api-plans";
import { clearSavedAnswers, saveReflectionAnswer } from "@tests/mocks/reflection-answers";
import { forgetShownSearches } from "@tests/mocks/searches-shown";
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

const GRACE = aReflectionPrompt({ id: uuid(1), question: "Where did you see grace?" });
const FEAR = aReflectionPrompt({ id: uuid(2), question: "What are you afraid of?" });

/** The reader's questions on the server, and what they wrote to each on the phone. */
async function written(...answers: [typeof GRACE, string][]) {
  server.use(
    http.get(`${API_URL}/v1/me/reflections`, () =>
      HttpResponse.json({ prompts: answers.map(([prompt]) => prompt) }),
    ),
  );
  for (const [prompt, answer] of answers) await saveReflectionAnswer("user", prompt.id, answer);
}

beforeEach(() => {
  clearSavedAnswers();
  forgetShownSearches();
  server.use(http.get(`${API_URL}/v1/me/reflections`, () => HttpResponse.json({ prompts: [] })));
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: jest.fn(), navigate: jest.fn() } as unknown as ReturnType<
      typeof useRouter
    >);
});

describe("useReflectionsList's search", () => {
  it("isn't offered with one reflection: scrolling finds it", async () => {
    await written([GRACE, "At the hospital."]);
    const { result } = renderHook(() => useReflectionsList());

    await waitFor(() => expect(result.current.plans).toHaveLength(1));
    expect(result.current.searchable).toBe(false);
  });

  it("is offered from two reflections", async () => {
    await written([GRACE, "At the hospital."], [FEAR, "Losing my job."]);
    const { result } = renderHook(() => useReflectionsList());

    await waitFor(() => expect(result.current.searchable).toBe(true));
  });

  it("narrows the list to what's typed", async () => {
    await written([GRACE, "At the hospital."], [FEAR, "Losing my job."]);
    const { result } = renderHook(() => useReflectionsList());
    await waitFor(() => expect(result.current.searchable).toBe(true));

    act(() => result.current.openSearch());
    act(() => result.current.setSearch("hospital"));

    await waitFor(() =>
      expect(result.current.plans.flatMap((plan) => plan.rows.map((row) => row.id))).toEqual([
        uuid(1),
      ]),
    );
  });

  it("says nothing matches, with what was typed", async () => {
    await written([GRACE, "At the hospital."], [FEAR, "Losing my job."]);
    const { result } = renderHook(() => useReflectionsList());
    await waitFor(() => expect(result.current.searchable).toBe(true));

    act(() => result.current.openSearch());
    act(() => result.current.setSearch("zebra"));

    await waitFor(() => expect(result.current.noMatch).toBe("zebra"));
  });

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
