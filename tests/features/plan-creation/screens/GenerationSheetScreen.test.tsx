import { http, HttpResponse } from "msw";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { fireEvent, render, screen } from "@tests/helpers/render";
import { API_URL, aGeneration } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import { planOverviewHref } from "@/entities/plan";
import { GenerationSheetScreen } from "@/features/plan-creation";
import type { ApiPlanGeneration } from "@/core/api/contracts";
import { lightTheme } from "@/theme/tokens";

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

    expect(await screen.findByText("Creating your plan")).toBeVisible();
    expect(screen.getByTestId("generation-steps-writingDays-spinner")).toBeOnTheScreen();
  });

  it("puts how far along it is at the header's right, beside the title, not on a step", async () => {
    serve([aGeneration()]);
    render(<GenerationSheetScreen />);

    expect(await screen.findByTestId("generation-sheet-header-percent")).toHaveTextContent("48%");
    expect(screen.queryByTestId("generation-steps-writingDays-percent")).toBeNull();
  });

  it("says what each step does, and nothing more under them", async () => {
    serve([aGeneration()]);
    render(<GenerationSheetScreen />);

    expect(await screen.findByText("Heard the whole message.")).toBeVisible();
    expect(screen.queryByText("This keeps running while you browse.")).toBeNull();
  });

  it("heads the sheet with only its title and line: no tile, no close", async () => {
    serve([aGeneration()]);
    render(<GenerationSheetScreen />);

    await screen.findByText("Creating your plan");
    expect(screen.queryByTestId("generation-sheet-header-close")).toBeNull();
    expect(screen.queryByTestId("generation-sheet-header-tile")).toBeNull();
  });

  it("is one solid colour, the primary control's, while building", async () => {
    serve([aGeneration()]);
    render(<GenerationSheetScreen />);

    await screen.findByText("Creating your plan");
    expect(screen.getByTestId("generation-sheet")).toHaveStyle({
      backgroundColor: lightTheme.colors.controlPrimary,
    });
  });

  it("turns all green once the plan is ready", async () => {
    serve([aGeneration({ status: "completed", progress: 100 })]);
    render(<GenerationSheetScreen />);

    expect(await screen.findByText("Your plan is ready")).toBeVisible();
    expect(screen.getByTestId("generation-sheet")).toHaveStyle({
      backgroundColor: lightTheme.colors.success,
    });
  });

  it("once ready, is only a large sparkle, the news, and Open, centred and in white", async () => {
    serve([aGeneration({ status: "completed", progress: 100 })]);
    render(<GenerationSheetScreen />);

    const title = await screen.findByText("Your plan is ready");
    expect(screen.getByTestId("generation-sheet-ready")).toHaveStyle({ alignItems: "center" });
    expect(screen.getByTestId("generation-sheet-ready-sparkle")).toBeOnTheScreen();
    expect(title).toHaveStyle({ color: lightTheme.colors.onSuccessBright });
    expect(screen.getByTestId("generation-sheet-open")).toHaveStyle({
      backgroundColor: lightTheme.colors.onSuccessBright,
    });
    expect(screen.queryByTestId("generation-steps")).toBeNull();
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
          message: "We couldn’t create this plan right now. Please try again.",
        },
      }),
    ]);
    render(<GenerationSheetScreen />);

    expect(
      await screen.findByText("We couldn’t create this plan right now.\nPlease try again."),
    ).toBeVisible();
    fireEvent.press(screen.getByTestId("generation-sheet-retry"));

    expect(back).toHaveBeenCalledTimes(1);
  });

  it("lays a failure out as the ready sheet is: a large mark, the news, why, and its buttons, centred", async () => {
    serve([
      aGeneration({
        status: "failed",
        error: {
          code: "unknown",
          message: "We couldn’t create this plan right now. Please try again.",
        },
      }),
    ]);
    render(<GenerationSheetScreen />);

    expect(await screen.findByText("Couldn’t create your plan")).toBeVisible();
    expect(screen.getByTestId("generation-sheet-failed")).toHaveStyle({ alignItems: "center" });
    expect(screen.getByTestId("generation-sheet-failed-mark")).toBeOnTheScreen();
    expect(screen.getByTestId("generation-sheet-retry")).toBeVisible();
    expect(screen.getByTestId("generation-sheet-dismiss")).toBeVisible();
    expect(screen.queryByTestId("generation-sheet-header")).toBeNull();
  });

  it("draws the app's own grabber at its top, in every state", async () => {
    serve([aGeneration()]);
    render(<GenerationSheetScreen />);

    await screen.findByText("Creating your plan");
    expect(screen.getByTestId("generation-sheet-grabber")).toHaveStyle({ width: 48 });
  });

  it("sets a failure's reason back, under the news", async () => {
    serve([
      aGeneration({
        status: "failed",
        error: {
          code: "unknown",
          message: "We couldn’t create this plan right now. Please try again.",
        },
      }),
    ]);
    render(<GenerationSheetScreen />);

    expect(
      await screen.findByText("We couldn’t create this plan right now.\nPlease try again."),
    ).toHaveStyle({
      color: lightTheme.colors.onControlPrimaryMuted,
    });
  });

  it("keeps the steps close under the header while building", async () => {
    serve([aGeneration()]);
    render(<GenerationSheetScreen />);

    expect(await screen.findByTestId("generation-sheet-header")).toHaveStyle({ paddingBottom: 8 });
  });

  it("offers a way out when nothing's being built", async () => {
    serve([]);
    render(<GenerationSheetScreen />);

    fireEvent.press(await screen.findByTestId("generation-sheet-empty-action"));

    expect(back).toHaveBeenCalledTimes(1);
  });
});
