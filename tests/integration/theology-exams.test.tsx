import { router } from "expo-router";
import { act, renderApp, screen, fireEvent } from "@tests/helpers/render";
import { servePlans } from "@tests/mocks/plans-api";

// Same reason navigation.test.tsx holds Reduce Motion on: Welcome's intro
// story would otherwise keep ticking through renderApp()'s forced fake timers.
jest.mock("@/core/accessibility/use-reduce-motion", () => ({ useReduceMotion: () => true }));

/** Measures the exams page's shelf as an iPhone would, so its books have room to be drawn. */
function measureShelf() {
  fireEvent(screen.getByTestId("exams-carousel"), "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width: 393, height: 480 } },
  });
}

/**
 * Proves the Theology Exams tile actually reaches the real exam screens
 * through the real route tree (criteria 1–2), not just that each screen
 * renders in isolation — that's covered by their own screen tests. Kept to
 * the one walk the navigation suite doesn't already cover; the exam flow's
 * own behavior belongs in ExamOverviewScreen.test.tsx and
 * ExamSessionScreen.test.tsx.
 */
// Mounting the whole route tree takes about 4s alone, close to Jest's 5s
// default, so a full parallel run would time this walk out — and a run with
// coverage takes about three times as long again.
const FULL_APP_WALK_MS = 60_000;

describe("theology exams", () => {
  it(
    "opens the exams page from Fun's tile, an exam's overview from it — the tab bar out of the way — and a session from that",
    async () => {
      // A returning reader, already onboarded: the app opens on Home.
      servePlans([]);
      renderApp();
      await screen.findByTestId("home-tab-screen");
      // Fun has no tab for now; its route is still there.
      act(() => router.navigate("/fun"));

      fireEvent.press(await screen.findByTestId("fun-games-exams"));

      expect(await screen.findByTestId("exams-screen")).toBeVisible();
      measureShelf();

      fireEvent.press(screen.getByTestId("exams-folio-THEO-01"));
      fireEvent.press(await screen.findByTestId("exam-subject-item-THEO-01-01"));

      expect(await screen.findByTestId("exam-overview-screen")).toBeVisible();
      // Above the tabs: the tab bar steps aside, so its action has the bottom of the screen.
      expect(screen.getByTestId("tab-bar", { includeHiddenElements: true })).toHaveStyle({
        pointerEvents: "none",
      });

      fireEvent.press(screen.getByTestId("exam-overview-start-button"));

      expect(await screen.findByTestId("exam-session-screen")).toBeVisible();
      fireEvent.press(screen.getByTestId("exam-session-start-button"));
      expect(screen.getByText("1 of 15")).toBeVisible();
    },
    FULL_APP_WALK_MS,
  );

  it(
    "opens an exam's topics in a sheet over its overview",
    async () => {
      // A returning reader, already onboarded: the app opens on Home.
      servePlans([]);
      renderApp();
      await screen.findByTestId("home-tab-screen");
      // Fun has no tab for now; its route is still there.
      act(() => router.navigate("/fun"));
      fireEvent.press(await screen.findByTestId("fun-games-exams"));
      expect(await screen.findByTestId("exams-screen")).toBeVisible();
      measureShelf();
      fireEvent.press(screen.getByTestId("exams-folio-THEO-01"));
      fireEvent.press(await screen.findByTestId("exam-subject-item-THEO-01-01"));

      fireEvent.press(await screen.findByTestId("exam-overview-topics-button"));

      expect(await screen.findByTestId("exam-topics-sheet")).toBeVisible();
    },
    FULL_APP_WALK_MS,
  );

  it(
    "opens every subject in a sheet over the exams page, and comes back open on the one picked",
    async () => {
      // A returning reader, already onboarded: the app opens on Home.
      servePlans([]);
      renderApp();
      await screen.findByTestId("home-tab-screen");
      // Fun has no tab for now; its route is still there.
      act(() => router.navigate("/fun"));
      fireEvent.press(await screen.findByTestId("fun-games-exams"));

      fireEvent.press(await screen.findByTestId("exams-all-subjects-button"));
      fireEvent.press(await screen.findByTestId("exam-subjects-THEO-03"));

      expect(await screen.findByTestId("exams-screen")).toBeVisible();
      expect(screen.getByTestId("exams-position")).toHaveTextContent("Subject 03 / 12");
    },
    FULL_APP_WALK_MS,
  );
});
