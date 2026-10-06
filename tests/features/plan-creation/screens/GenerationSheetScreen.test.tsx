import { http, HttpResponse } from "msw";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { fireEvent, render, screen } from "@tests/helpers/render";
import { API_URL, aGeneration } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import { planOverviewHref } from "@/entities/plan";
import { GenerationSheetScreen } from "@/features/plan-creation";
import type { ApiPlanGeneration } from "@/core/api/contracts";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const push = jest.fn();
const back = jest.fn();
const retried: string[] = [];

function serve(generations: ApiPlanGeneration[]) {
  server.use(
    http.get(`${API_URL}/v1/plan-generations/current`, () => HttpResponse.json({ generations })),
    http.post(`${API_URL}/v1/plan-generations/:id/dismiss`, () =>
      HttpResponse.json({ generation: aGeneration() }),
    ),
    http.post(`${API_URL}/v1/plan-generations/:id/retry`, ({ params }) => {
      retried.push(String(params.id));
      return HttpResponse.json({ generation: aGeneration({ status: "preparing" }) });
    }),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  retried.length = 0;
  jest.mocked(useRouter).mockReturnValue({ push, back } as unknown as ReturnType<typeof useRouter>);
});

describe("GenerationSheetScreen", () => {
  it("shows how far along the plan is, step by step, spinning on the step under way", async () => {
    serve([aGeneration()]);
    render(<GenerationSheetScreen />);

    expect(await screen.findByText("Generating your plan")).toBeVisible();
    expect(screen.getByText("48% · This keeps going while you browse.")).toBeVisible();
    expect(screen.getByTestId("generation-steps-writingDays-spinner")).toBeOnTheScreen();
  });

  it("opens a ready plan, closing the sheet first", async () => {
    serve([aGeneration({ status: "completed", progress: 100 })]);
    render(<GenerationSheetScreen />);

    fireEvent.press(await screen.findByTestId("generation-sheet-open"));

    expect(back).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(planOverviewHref(aGeneration().planId));
  });

  it("says why a plan couldn't be built, and builds it again", async () => {
    serve([
      aGeneration({
        status: "failed",
        error: {
          code: "unknown",
          message: "We couldn’t build this plan right now. Please try again.",
        },
      }),
    ]);
    render(<GenerationSheetScreen />);

    expect(
      await screen.findByText("We couldn’t build this plan right now. Please try again."),
    ).toBeVisible();
    fireEvent.press(screen.getByTestId("generation-sheet-retry"));

    expect(back).toHaveBeenCalledTimes(1);
  });

  it("offers a way out when nothing's being built", async () => {
    serve([]);
    render(<GenerationSheetScreen />);

    fireEvent.press(await screen.findByTestId("generation-sheet-empty-action"));

    expect(back).toHaveBeenCalledTimes(1);
  });
});
