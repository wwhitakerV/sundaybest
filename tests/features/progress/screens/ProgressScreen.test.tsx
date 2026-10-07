import { http, HttpResponse } from "msw";
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL } from "@tests/factories/api";
import { PLAN_UNDER_WAY, PROGRESS_NOW, serveProgress } from "@tests/factories/api-progress";
import { server } from "@tests/mocks/server";
import { studyHref } from "@/entities/plan";
import { ProgressScreen } from "@/features/progress/screens/ProgressScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

// "Today" is Wednesday 23 September 2026: the plan under way had its day 1
// done yesterday (Tue 22) and day 2 open today; a seven-day plan was done every
// day from Sun 30 Aug to Sat 5 Sep; the latest Quick Check scored 1 of 2.

/** Progress, once this week's has arrived. */
async function openProgress() {
  const asked = serveProgress();
  render(<ProgressScreen />);
  await screen.findByTestId("progress-week-title");
  return asked;
}

const press = (testID: string) => fireEvent.press(screen.getByTestId(testID));

/** Presses a week arrow once it's back: a week being fetched shows its shape until it arrives. */
async function pressWhenLoaded(testID: string) {
  fireEvent.press(await screen.findByTestId(testID));
}

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
  it("is addressable as progress-screen", () => {
    serveProgress();
    render(<ProgressScreen />);

    expect(screen.getByTestId("progress-screen")).toBeVisible();
  });

  it("shows the title", () => {
    serveProgress();
    render(<ProgressScreen />);

    expect(screen.getByText("Progress")).toBeVisible();
  });

  it("shows the week's shape while it's on its way", () => {
    serveProgress();
    render(<ProgressScreen />);

    expect(screen.getByTestId("progress-content-pending")).toBeOnTheScreen();
  });

  it("says so, with a way to try again, when progress can't be loaded", async () => {
    server.use(
      http.get(`${API_URL}/v1/me/progress`, () =>
        HttpResponse.json({ error: { code: "NOT_FOUND", message: "No" } }, { status: 404 }),
      ),
    );
    render(<ProgressScreen />);

    expect(await screen.findByTestId("progress-load-error")).toBeVisible();
  });

  describe("the week", () => {
    it("opens on this week", async () => {
      await openProgress();

      expect(screen.getByTestId("progress-week-title")).toHaveTextContent("September 20–26");
    });

    it("marks the days something was finished, and today", async () => {
      await openProgress();

      expect(screen.getByTestId("progress-day-2026-09-22")).toHaveProp(
        "accessibilityLabel",
        "Tue, Sep 22: studied",
      );
      expect(screen.getByTestId("progress-day-2026-09-23")).toHaveProp(
        "accessibilityLabel",
        "Today, Sep 23: not yet",
      );
      expect(screen.getByTestId("progress-day-2026-09-21")).toHaveProp(
        "accessibilityLabel",
        "Mon, Sep 21: not studied",
      );
    });

    it("steps back a week at a time through the history, asking for each", async () => {
      const asked = await openProgress();

      await pressWhenLoaded("progress-week-previous");
      await waitFor(() =>
        expect(screen.getByTestId("progress-week-title")).toHaveTextContent("September 13–19"),
      );
      expect(screen.getByTestId("progress-day-2026-09-15")).toHaveProp(
        "accessibilityLabel",
        "Tue, Sep 15: not studied",
      );

      await pressWhenLoaded("progress-week-previous");
      await waitFor(() =>
        expect(screen.getByTestId("progress-week-title")).toHaveTextContent("September 6–12"),
      );
      await pressWhenLoaded("progress-week-previous");
      await waitFor(() =>
        expect(screen.getByTestId("progress-week-title")).toHaveTextContent("Aug 30 – Sep 5"),
      );
      for (const date of ["2026-08-30", "2026-09-02", "2026-09-05"]) {
        expect(screen.getByTestId(`progress-day-${date}`)).toHaveProp(
          "accessibilityLabel",
          expect.stringMatching(/: studied$/),
        );
      }
      expect(asked).toEqual(expect.arrayContaining(["2026-09-13", "2026-08-30"]));
    });

    it("steps forward again", async () => {
      await openProgress();

      await pressWhenLoaded("progress-week-previous");
      await waitFor(() =>
        expect(screen.getByTestId("progress-week-title")).toHaveTextContent("September 13–19"),
      );
      await pressWhenLoaded("progress-week-next");

      await waitFor(() =>
        expect(screen.getByTestId("progress-week-title")).toHaveTextContent("September 20–26"),
      );
    });
  });

  describe("up next", () => {
    it("names the day to study next, and when", async () => {
      await openProgress();

      expect(screen.getByTestId("progress-up-next")).toHaveTextContent("Up next Today, Sep 23");
    });

    it("shows the plan under way: its day, time, how far through, and the reminder", async () => {
      await openProgress();

      const card = screen.getByTestId("progress-active-plan");
      expect(card).toHaveTextContent(/Today I Choose to Be a Blessing/);
      expect(card).toHaveTextContent("Day 2, 9 min", { exact: false });
      expect(card).toHaveTextContent(/17%/);
      await waitFor(() =>
        expect(screen.getByTestId("progress-active-plan")).toHaveTextContent(/6:30 AM/),
      );
    });

    it("opens the day to study next", async () => {
      await openProgress();

      press("progress-active-plan");

      expect(mockPush).toHaveBeenCalledWith(studyHref(PLAN_UNDER_WAY.id, 2));
    });
  });

  describe("the totals", () => {
    it("shows the streak, every day done, and the latest quiz score", async () => {
      await openProgress();

      expect(screen.getByTestId("progress-stat-streak")).toHaveTextContent("1Day streak");
      expect(screen.getByTestId("progress-stat-days")).toHaveTextContent("8Days done");
      expect(screen.getByTestId("progress-stat-quiz")).toHaveTextContent("1/2Quiz score");
    });

    it("counts the plans finished", async () => {
      await openProgress();

      expect(screen.getByTestId("progress-plans-done")).toHaveTextContent("1 plan finished");
    });
  });
});
