import { http, HttpResponse } from "msw";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { act, renderHook, waitFor } from "@tests/helpers/render";
import { API_URL, aGeneration } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import { errorFeedback, successFeedback } from "@/core/haptics/haptics";
import { useCreatePlanMutation } from "@/core/api/queries";
import { NEW_PLAN_HREF, planOverviewHref } from "@/entities/plan";
import { useGenerationBar } from "@/features/plan-creation/hooks/use-generation-bar";
import { useSettledFeedback } from "@/features/plan-creation/hooks/use-settled-feedback";
import type { ApiPlanGeneration } from "@/core/api/contracts";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));
jest.mock("@/core/haptics/haptics", () => ({
  tapFeedback: jest.fn(),
  selectionFeedback: jest.fn(),
  successFeedback: jest.fn(),
  warningFeedback: jest.fn(),
  errorFeedback: jest.fn(),
}));

const push = jest.fn();
const dismissed: string[] = [];
const retried: string[] = [];
let current: ApiPlanGeneration[] = [];

beforeEach(() => {
  jest.clearAllMocks();
  dismissed.length = 0;
  retried.length = 0;
  current = [aGeneration()];
  jest.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  server.use(
    http.get(`${API_URL}/v1/plan-generations/current`, () =>
      HttpResponse.json({ generations: current }),
    ),
    http.post(`${API_URL}/v1/plan-generations/:id/dismiss`, ({ params }) => {
      dismissed.push(String(params.id));
      current = current.filter((generation) => generation.id !== params.id);
      return HttpResponse.json({ generation: aGeneration() });
    }),
    http.post(`${API_URL}/v1/plan-generations/:id/retry`, ({ params }) => {
      retried.push(String(params.id));
      return HttpResponse.json({ generation: aGeneration({ status: "preparing", progress: 0 }) });
    }),
  );
});

/** The bar as its host runs it: with the feel of a build finishing. */
function useHostedBar() {
  const bar = useGenerationBar();
  useSettledFeedback(bar.view);
  return bar;
}

describe("useGenerationBar", () => {
  it("shows the reader's newest build", async () => {
    const { result } = renderHook(useGenerationBar);

    await waitFor(() =>
      expect(result.current.view).toEqual({
        kind: "building",
        id: aGeneration().id,
        percent: 48,
        more: 0,
      }),
    );
  });

  it("opens a ready plan, and takes it off the bar", async () => {
    current = [aGeneration({ status: "completed", progress: 100 })];
    const { result } = renderHook(useGenerationBar);
    await waitFor(() => expect(result.current.view?.kind).toBe("ready"));

    act(() => result.current.open());

    expect(push).toHaveBeenCalledWith(planOverviewHref(aGeneration().planId));
    await waitFor(() => expect(dismissed).toEqual([aGeneration().id]));
  });

  it("dismisses a build", async () => {
    const { result } = renderHook(useGenerationBar);
    await waitFor(() => expect(result.current.view).not.toBeNull());

    act(() => result.current.dismiss());

    await waitFor(() => expect(result.current.view).toBeNull());
    expect(dismissed).toEqual([aGeneration().id]);
  });

  it("builds a failed plan again", async () => {
    current = [
      aGeneration({
        status: "failed",
        error: { code: "unknown", message: "We couldn’t build this plan right now." },
      }),
    ];
    const { result } = renderHook(useGenerationBar);
    await waitFor(() => expect(result.current.view?.kind).toBe("failed"));

    act(() => result.current.retry());

    await waitFor(() => expect(retried).toEqual([aGeneration().id]));
  });

  it("sends the reader to choose another sermon when this one can't be built from", async () => {
    current = [
      aGeneration({
        status: "failed",
        error: { code: "noCaptions", message: "We couldn’t find usable captions." },
      }),
    ];
    const { result } = renderHook(useGenerationBar);
    await waitFor(() => expect(result.current.view?.kind).toBe("failed"));

    act(() => result.current.chooseAnother());

    expect(push).toHaveBeenCalledWith(NEW_PLAN_HREF);
    await waitFor(() => expect(dismissed).toEqual([aGeneration().id]));
  });

  it("shows a plan building the moment it's asked for", async () => {
    current = [];
    server.use(http.post(`${API_URL}/v1/plans`, () => new Promise<never>(() => undefined)));
    const { result } = renderHook(() => ({
      bar: useGenerationBar(),
      create: useCreatePlanMutation(),
    }));

    act(() =>
      result.current.create.mutate({
        sermonId: aGeneration().sermonId!,
        lengthDays: 5,
        quickCheckEnabled: true,
      }),
    );

    await waitFor(() =>
      expect(result.current.bar.view).toEqual({ kind: "building", id: null, percent: 0, more: 0 }),
    );
  });

  it("dismisses a plan dismissed while it was still being asked for, once the server has it", async () => {
    current = [];
    let answer: () => void = () => undefined;
    const answered = new Promise<void>((resolve) => {
      answer = resolve;
    });
    server.use(
      http.post(`${API_URL}/v1/plans`, async () => {
        await answered;
        current = [aGeneration()];
        return HttpResponse.json({ planId: aGeneration().planId, generationId: aGeneration().id });
      }),
    );
    const { result } = renderHook(() => ({
      bar: useGenerationBar(),
      create: useCreatePlanMutation(),
    }));
    act(() =>
      result.current.create.mutate({
        sermonId: aGeneration().sermonId!,
        lengthDays: 5,
        quickCheckEnabled: true,
      }),
    );
    await waitFor(() => expect(result.current.bar.view?.kind).toBe("building"));

    act(() => result.current.bar.dismiss());
    expect(result.current.bar.view).toBeNull();
    answer();

    await waitFor(() => expect(dismissed).toEqual([aGeneration().id]));
    expect(result.current.bar.view).toBeNull();
  });

  it("gives the success feel when a plan it's watching becomes ready", async () => {
    const { result } = renderHook(useHostedBar);
    await waitFor(() => expect(result.current.view?.kind).toBe("building"));

    current = [aGeneration({ status: "completed", progress: 100 })];

    await waitFor(() => expect(result.current.view?.kind).toBe("ready"), { timeout: 4000 });
    expect(successFeedback).toHaveBeenCalledTimes(1);
    expect(errorFeedback).not.toHaveBeenCalled();
  });

  it("gives the error feel when a plan it's watching fails", async () => {
    const { result } = renderHook(useHostedBar);
    await waitFor(() => expect(result.current.view?.kind).toBe("building"));

    current = [
      aGeneration({
        status: "failed",
        error: { code: "unknown", message: "We couldn’t build this plan right now." },
      }),
    ];

    await waitFor(() => expect(result.current.view?.kind).toBe("failed"), { timeout: 4000 });
    expect(errorFeedback).toHaveBeenCalledTimes(1);
  });

  it("gives no feel for a plan already ready when the app opens", async () => {
    current = [aGeneration({ status: "completed", progress: 100 })];
    const { result } = renderHook(useHostedBar);

    await waitFor(() => expect(result.current.view?.kind).toBe("ready"));
    expect(successFeedback).not.toHaveBeenCalled();
  });
});
