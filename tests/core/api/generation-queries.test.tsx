import { http, HttpResponse } from "msw";

import { act, renderHook, waitFor } from "@tests/helpers/render";
import { API_URL, aGeneration } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import {
  useCurrentGenerationsQuery,
  useDismissGenerationMutation,
} from "@/core/api/generation-queries";

function useBar() {
  return { current: useCurrentGenerationsQuery(), dismiss: useDismissGenerationMutation() };
}

describe("the generation bar's queries", () => {
  it("lists the reader's current builds", async () => {
    server.use(
      http.get(`${API_URL}/v1/plan-generations/current`, () =>
        HttpResponse.json({ generations: [aGeneration()] }),
      ),
    );

    const { result } = renderHook(useCurrentGenerationsQuery);

    await waitFor(() =>
      expect(result.current.data?.map((generation) => generation.id)).toEqual([aGeneration().id]),
    );
  });

  it("takes a dismissed build off the list before the server answers", async () => {
    let answer: () => void = () => undefined;
    const answered = new Promise<void>((resolve) => {
      answer = resolve;
    });
    server.use(
      http.get(`${API_URL}/v1/plan-generations/current`, () =>
        HttpResponse.json({ generations: [aGeneration()] }),
      ),
      http.post(`${API_URL}/v1/plan-generations/:id/dismiss`, async () => {
        await answered;
        return HttpResponse.json({ generation: aGeneration() });
      }),
    );
    const { result } = renderHook(useBar);
    await waitFor(() => expect(result.current.current.data).toHaveLength(1));

    act(() => result.current.dismiss.mutate(aGeneration().id));

    await waitFor(() => expect(result.current.current.data).toEqual([]));
    expect(result.current.dismiss.isPending).toBe(true);
    answer();
    await waitFor(() => expect(result.current.dismiss.isSuccess).toBe(true));
  });

  it("puts a build back if the server refuses to dismiss it", async () => {
    server.use(
      http.get(`${API_URL}/v1/plan-generations/current`, () =>
        HttpResponse.json({ generations: [aGeneration()] }),
      ),
      http.post(`${API_URL}/v1/plan-generations/:id/dismiss`, () =>
        HttpResponse.json({ error: { code: "INTERNAL" } }, { status: 500 }),
      ),
    );
    const { result } = renderHook(useBar);
    await waitFor(() => expect(result.current.current.data).toHaveLength(1));

    act(() => result.current.dismiss.mutate(aGeneration().id));

    await waitFor(() => expect(result.current.dismiss.isError).toBe(true));
    expect(result.current.current.data).toHaveLength(1);
  });
});
