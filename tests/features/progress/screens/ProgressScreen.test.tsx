import { http, HttpResponse } from "msw";
import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL } from "@tests/factories/api";
import { PLAN_UNDER_WAY, PROGRESS_NOW, serveProgress } from "@tests/factories/api-progress";
import { server } from "@tests/mocks/server";
import { ProgressScreen } from "@/features/progress/screens/ProgressScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

// "Today" is Wednesday 23 September 2026, in the week of Sun 20 – Sat 26: the plan under way
// was studied yesterday (Tue 22), and eight passages have been finished in all.

/** Progress, once this week has arrived. */
async function openProgress(week: Parameters<typeof serveProgress>[1] = {}) {
  const asked = serveProgress({}, week);
  render(<ProgressScreen />);
  await screen.findByTestId("progress-week-header");
  return asked;
}

const panel = () => within(screen.getByTestId("progress-day-panel"));

beforeEach(() => {
  jest.useFakeTimers({ now: PROGRESS_NOW, advanceTimers: true });
  mockPush.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("ProgressScreen", () => {
  it("is addressable as progress-screen", async () => {
    await openProgress();

    expect(screen.getByTestId("progress-screen")).toBeOnTheScreen();
  });

  it("heads the week with where its study came from, its plan's title, and its dates", async () => {
    await openProgress();

    const header = within(screen.getByTestId("progress-week-header"));
    expect(header.getByText("From the sermon")).toBeOnTheScreen();
    expect(header.getByText(PLAN_UNDER_WAY.title)).toBeOnTheScreen();
    expect(header.getByText("Sep 20 – 26")).toBeOnTheScreen();
  });

  it("shows the week's seven days", async () => {
    await openProgress();

    for (let day = 20; day <= 26; day++) {
      expect(screen.getByTestId(`progress-day-2026-09-${day}`)).toBeOnTheScreen();
    }
  });

  it("says which days were studied, which were missed, and which is today", async () => {
    await openProgress();

    expect(screen.getByTestId("progress-day-2026-09-22")).toHaveAccessibleName(
      /Tuesday, September 22, studied/,
    );
    expect(screen.getByTestId("progress-day-2026-09-21")).toHaveAccessibleName(
      /Monday, September 21, not studied/,
    );
    expect(screen.getByTestId("progress-day-2026-09-23")).toHaveAccessibleName(
      /Wednesday, September 23, today/,
    );
  });

  it("opens on today, and shows another day when it's picked", async () => {
    await openProgress();
    expect(panel().getByText("Today")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("progress-day-2026-09-22"));

    expect(panel().getByText("Tuesday")).toBeOnTheScreen();
  });

  it("counts what's been studied in all, on The Word's row", async () => {
    await openProgress();

    expect(screen.getByTestId("progress-row-word")).toHaveTextContent(/8 passages across 1 book/);
  });

  it("opens The Word from its row", async () => {
    await openProgress();

    fireEvent.press(screen.getByTestId("progress-row-word"));

    expect(mockPush).toHaveBeenCalledWith("/progress/word");
  });

  it("has no Quick Check row before any Quick Check is answered", async () => {
    await openProgress();

    expect(screen.queryByTestId("progress-row-quickCheck")).toBeNull();
  });

  it("says how many Quick Check answers were right and how many to revisit, once there are some", async () => {
    await openProgress({ summary: { passageCount: 8, bookCount: 1, right: 3, missed: 1 } });

    expect(screen.getByTestId("progress-row-quickCheck")).toHaveTextContent(
      /3 correct · 1 to revisit/,
    );
  });

  it("says so, with a way to try again, when the week can't be loaded", async () => {
    serveProgress();
    server.use(
      http.get(`${API_URL}/v1/me/week`, () =>
        HttpResponse.json({ error: { code: "unavailable" } }, { status: 503 }),
      ),
    );
    render(<ProgressScreen />);

    expect(await screen.findByTestId("progress-load-error", {}, { timeout: 10000 })).toBeVisible();
  });
});
