import { renderApp, screen, fireEvent } from "@tests/helpers/render";

// Same reason navigation.test.tsx holds Reduce Motion on: Welcome's intro
// story would otherwise keep ticking through renderApp()'s forced fake timers.
jest.mock("@/core/accessibility/use-reduce-motion", () => ({ useReduceMotion: () => true }));

/**
 * Proves the Theology Exams tile actually reaches the real exam screens
 * through the real route tree (criteria 1–2), not just that each screen
 * renders in isolation — that's covered by their own screen tests. Kept to
 * the one walk the navigation suite doesn't already cover; the exam flow's
 * own behavior belongs in ExamOverviewScreen.test.tsx and
 * ExamSessionScreen.test.tsx.
 */
// Mounting the whole route tree takes about 4s alone, close to Jest's 5s
// default, so a full parallel run would time this walk out.
const FULL_APP_WALK_MS = 20_000;

describe("theology exams", () => {
  it(
    "opens the exam overview from Fun's tile, and starts a session from it",
    async () => {
      renderApp();
      fireEvent.press(screen.getByTestId("welcome-get-a-plan-now-button"));
      fireEvent.press(screen.getByTestId("tab-fun"));

      fireEvent.press(screen.getByTestId("fun-games-exams"));

      expect(await screen.findByTestId("exam-overview-screen")).toBeVisible();

      fireEvent.press(screen.getByTestId("exam-overview-start-button"));

      expect(await screen.findByTestId("exam-session-screen")).toBeVisible();
      expect(screen.getByText("1 of 15")).toBeVisible();
    },
    FULL_APP_WALK_MS,
  );
});
