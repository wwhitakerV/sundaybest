import { http, HttpResponse } from "msw";

import { renderHook, waitFor } from "@tests/helpers/render";
import { API_URL, aGeneration } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import { useClearReadyBuild } from "@/features/plans/hooks/use-clear-ready-build";
import type { ApiPlanGeneration } from "@/core/api/contracts";

const dismissed: string[] = [];
let listed = 0;

function serve(generations: ApiPlanGeneration[]) {
  server.use(
    http.get(`${API_URL}/v1/plan-generations/current`, () => {
      listed++;
      return HttpResponse.json({ generations });
    }),
    http.post(`${API_URL}/v1/plan-generations/:id/dismiss`, ({ params }) => {
      dismissed.push(String(params.id));
      return HttpResponse.json({ generation: aGeneration() });
    }),
  );
}

beforeEach(() => {
  dismissed.length = 0;
  listed = 0;
});

/** Lets the list arrive and anything it would set off run. */
async function settle() {
  await waitFor(() => expect(listed).toBeGreaterThan(0));
  await new Promise((resolve) => setTimeout(resolve, 50));
}

describe("useClearReadyBuild", () => {
  it("takes a ready plan off the generation bar once the plan is open", async () => {
    serve([aGeneration({ status: "completed", progress: 100 })]);

    renderHook(() => useClearReadyBuild(aGeneration().planId));

    await waitFor(() => expect(dismissed).toEqual([aGeneration().id]));
  });

  it("leaves a plan still being built on the bar", async () => {
    serve([aGeneration()]);
    renderHook(() => useClearReadyBuild(aGeneration().planId));

    await settle();
    expect(dismissed).toEqual([]);
  });

  it("leaves another plan's ready build on the bar", async () => {
    serve([aGeneration({ status: "completed", progress: 100 })]);
    renderHook(() => useClearReadyBuild("00000000-0000-4000-8000-0000000000ff"));

    await settle();
    expect(dismissed).toEqual([]);
  });
});
