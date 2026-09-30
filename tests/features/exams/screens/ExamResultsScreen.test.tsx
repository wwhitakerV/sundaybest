import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { AppStoreProvider, INITIAL_STATE, type AppState } from "@/core/store";
import { lightTheme } from "@/theme/tokens";
import { ExamResultsScreen, examOverviewHref } from "@/features/exams";
import {
  correctResponseFor,
  theologyExamResult,
  withExamAttempt,
  wrongSingleChoiceResponseFor,
} from "@tests/factories/exam-state";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const ATTEMPT_ID = "attempt-results-test";
const qid = (n: number) => `THEO-01-01-Q${String(n).padStart(2, "0")}`;

const mockDismissTo = jest.fn<void, [ExpoRouter.Href]>();
const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockReplace = jest.fn<void, [ExpoRouter.Href]>();

function hrefText(href: unknown): string {
  if (typeof href === "string") return href;
  if (href && typeof href === "object") {
    const { pathname, params } = href as { pathname?: unknown; params?: Record<string, unknown> };
    return [pathname, params && Object.values(params).join("/")].filter(Boolean).join(" ");
  }
  return String(href);
}

beforeEach(() => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ attemptId: ATTEMPT_ID });
  jest.mocked(useRouter).mockReturnValue({
    dismissTo: mockDismissTo,
    push: mockPush,
    replace: mockReplace,
  } as unknown as ReturnType<typeof useRouter>);
});

function renderResults(state: AppState) {
  return render(
    <AppStoreProvider initialState={state}>
      <ExamResultsScreen />
    </AppStoreProvider>,
  );
}

/**
 * An 11-of-15 submitted Exam Mode attempt: Q02, Q08, and Q14 answered wrong;
 * Q05 never answered. Berean Examination's three questions (Q08, Q10, Q13)
 * land at 2 of 3 — exactly the spec's own "Needs review" example.
 */
function elevenOfFifteen(overrides: { attemptId?: string; practice?: boolean } = {}) {
  const wrong = [qid(2), qid(8), qid(14)];
  const responses = Object.fromEntries(
    Array.from({ length: 15 }, (_, i) => i + 1)
      .map(qid)
      .filter((id) => id !== qid(5))
      .map((id) => [
        id,
        wrong.includes(id) ? wrongSingleChoiceResponseFor(id) : correctResponseFor(id),
      ]),
  );

  // Practice is decided when an attempt starts — after an earlier one revealed
  // the answers — so a practice attempt needs that earlier attempt first.
  const before = overrides.practice
    ? withExamAttempt(INITIAL_STATE, {
        attemptId: "attempt-earlier",
        completedResult: theologyExamResult({}),
      })
    : INITIAL_STATE;

  return withExamAttempt(before, {
    attemptId: overrides.attemptId ?? ATTEMPT_ID,
    mode: "exam",
    responses,
    completedResult: theologyExamResult({
      incorrectQuestionIds: wrong,
      unansweredQuestionIds: [qid(5)],
      practice: overrides.practice ?? false,
    }),
  });
}

describe("ExamResultsScreen", () => {
  it("is addressable as exam-results-screen", () => {
    renderResults(elevenOfFifteen());

    expect(screen.getByTestId("exam-results-screen")).toBeVisible();
  });

  it("shows the score as N of 15", () => {
    renderResults(elevenOfFifteen());

    expect(screen.getByTestId("exam-results-score")).toHaveTextContent("11 of 15", {
      exact: false,
    });
  });

  it("shows the score as a whole-number percentage", () => {
    renderResults(elevenOfFifteen());

    expect(screen.getByTestId("exam-results-score")).toHaveTextContent("73%", { exact: false });
  });

  it("shows the score band", () => {
    renderResults(elevenOfFifteen());

    expect(screen.getByTestId("exam-results-band")).toHaveTextContent("Developing", {
      exact: false,
    });
  });

  it("shows a concept's correct count out of its total observations", () => {
    renderResults(elevenOfFifteen());

    expect(screen.getByTestId("exam-results-concept-berean_examination")).toHaveTextContent(
      "2 of 3",
      { exact: false },
    );
  });

  it("labels a concept at 3+ observations under 80% Needs review", () => {
    renderResults(elevenOfFifteen());

    expect(screen.getByTestId("exam-results-concept-berean_examination")).toHaveTextContent(
      "Needs review",
      { exact: false },
    );
  });

  it("labels a concept with fewer than 3 observations Not enough evidence", () => {
    // Q01's concept, scripture_known_in_childhood, has only one question in the exam.
    renderResults(elevenOfFifteen());

    expect(
      screen.getByTestId("exam-results-concept-scripture_known_in_childhood"),
    ).toHaveTextContent("Not enough evidence", { exact: false });
  });

  it("shows the user's answer on a result item", () => {
    renderResults(elevenOfFifteen());

    // Q01 was answered correctly, with choice D: "The holy Scriptures".
    expect(screen.getByTestId(`exam-results-item-${qid(1)}`)).toHaveTextContent(
      "The holy Scriptures",
      { exact: false },
    );
  });

  it("shows No answer on a result item left unanswered", () => {
    renderResults(elevenOfFifteen());

    expect(screen.getByTestId(`exam-results-item-${qid(5)}`)).toHaveTextContent("No answer", {
      exact: false,
    });
  });

  it("shows the correct answer on a missed result item", () => {
    renderResults(elevenOfFifteen());

    // Q08's key is A: "They received it eagerly and examined the Scriptures daily".
    expect(screen.getByTestId(`exam-results-item-${qid(8)}`)).toHaveTextContent(
      "They received it eagerly and examined the Scriptures daily",
      { exact: false },
    );
  });

  it("marks a missed result item Incorrect, in words", () => {
    renderResults(elevenOfFifteen());

    expect(screen.getByTestId(`exam-results-item-${qid(8)}`)).toHaveTextContent("Incorrect", {
      exact: false,
    });
  });

  it("marks a right result item Correct, in words", () => {
    renderResults(elevenOfFifteen());

    expect(screen.getByTestId(`exam-results-item-${qid(1)}`)).toHaveTextContent("Correct", {
      exact: false,
    });
  });

  it("shows a result item's whyCorrect", () => {
    renderResults(elevenOfFifteen());

    expect(screen.getByTestId(`exam-results-item-${qid(1)}`)).toHaveTextContent(
      "The text identifies the holy Scriptures Timothy knew from childhood.",
      { exact: false },
    );
  });

  it("pushes that question's Understand why from inside its result item", () => {
    renderResults(elevenOfFifteen());

    fireEvent.press(screen.getByTestId(`exam-results-item-${qid(1)}-understand-why-button`));

    const [href] = mockPush.mock.calls.at(-1) ?? [];
    const text = hrefText(href);
    expect(text).toContain("why");
    expect(text).toContain(ATTEMPT_ID);
    expect(text).toContain(qid(1));
  });

  it("lists a concept missed with a wrong answer under For review (criterion 33)", () => {
    renderResults(elevenOfFifteen());

    // Q08 was answered wrong; its concept's teaching title is "Berean Examination".
    expect(
      within(screen.getByTestId("exam-results-review")).getByText("Berean Examination"),
    ).toBeVisible();
  });

  it("lists a concept missed by leaving its question unanswered under For review (criterion 33)", () => {
    renderResults(elevenOfFifteen());

    // Q05 was never answered; its concept's teaching title is "Good Works".
    expect(within(screen.getByTestId("exam-results-review")).getByText("Good Works")).toBeVisible();
  });

  it("leaves a concept answered right out of For review", () => {
    renderResults(elevenOfFifteen());

    // Q03, Inspiration's only question, was answered right.
    expect(within(screen.getByTestId("exam-results-review")).queryByText("Inspiration")).toBeNull();
  });

  it("shows Practice for a practice attempt", () => {
    renderResults(elevenOfFifteen({ practice: true }));

    expect(screen.getByText(/Practice/)).toBeVisible();
  });

  describe("a Study Mode attempt", () => {
    function studyResult() {
      // A Study attempt finishes only once every answer is checked.
      const wrong = [qid(2), qid(8), qid(14), qid(5)];
      const ids = Array.from({ length: 15 }, (_, i) => qid(i + 1));
      return withExamAttempt(INITIAL_STATE, {
        attemptId: ATTEMPT_ID,
        mode: "study",
        responses: Object.fromEntries(
          ids.map((id) => [
            id,
            wrong.includes(id) ? wrongSingleChoiceResponseFor(id) : correctResponseFor(id),
          ]),
        ),
        checks: Object.fromEntries(
          ids.map((id) => [id, { at: "2026-09-28T07:05:00.000Z", correct: !wrong.includes(id) }]),
        ),
        completedResult: theologyExamResult({
          mode: "study",
          incorrectQuestionIds: [qid(2), qid(8), qid(14), qid(5)],
        }),
      });
    }

    it("shows N of 15 correct, not a percentage or band", () => {
      renderResults(studyResult());

      expect(screen.getByText("11 of 15 correct")).toBeVisible();
    });

    it("says Study Mode isn't scored", () => {
      renderResults(studyResult());

      expect(screen.getByText("Study Mode isn't scored.")).toBeVisible();
    });

    it("shows no score band", () => {
      renderResults(studyResult());

      expect(screen.queryByTestId("exam-results-band")).toBeNull();
    });
  });

  it("floats Done, the black primary, in the bar every screen's actions float in", () => {
    renderResults(elevenOfFifteen());

    expect(
      within(screen.getByTestId("exam-results-bar")).getByTestId("exam-results-done-button"),
    ).toHaveStyle({ backgroundColor: lightTheme.colors.controlPrimary });
  });

  describe("what's next", () => {
    it("offers the next level up in the course", () => {
      renderResults(elevenOfFifteen());

      expect(screen.getByTestId("exam-results-next")).toHaveTextContent(
        /Reading in Context.*Intermediate/,
      );
      fireEvent.press(screen.getByTestId("exam-results-next"));

      expect(mockDismissTo).toHaveBeenCalledWith(examOverviewHref("THEO-01-02"));
    });

    it("offers to review what was missed, in a short study of just those questions", () => {
      renderResults(elevenOfFifteen());

      expect(screen.getByTestId("exam-results-review-button")).toHaveTextContent(
        /Review \d+ concepts?/,
      );
      fireEvent.press(screen.getByTestId("exam-results-review-button"));

      expect(hrefText(mockReplace.mock.calls.at(-1)?.[0])).toContain("/exam/[attemptId]");
    });

    it("offers no review once nothing was missed", () => {
      renderResults(
        withExamAttempt(INITIAL_STATE, {
          attemptId: ATTEMPT_ID,
          completedResult: theologyExamResult({}),
        }),
      );

      expect(screen.queryByTestId("exam-results-review-button")).toBeNull();
    });
  });

  it("dismisses to the exam overview when Done is pressed", () => {
    renderResults(elevenOfFifteen());

    fireEvent.press(screen.getByTestId("exam-results-done-button"));

    expect(mockDismissTo).toHaveBeenCalledWith(examOverviewHref("THEO-01-01"));
  });
});
