import type { ReactNode } from "react";
import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { AppStoreProvider, INITIAL_STATE, type AppState } from "@/core/store";
import { lightTheme } from "@/theme/tokens";
import { getBundledExam } from "@/features/exams/data/bundled-exams";
import type * as BundledExams from "@/features/exams/data/bundled-exams";
import { ExamOverviewScreen, ExamSessionScreen } from "@/features/exams";
import { examPassagesHref, examTopicsHref } from "@/features/exams/logic/routes";
import {
  correctResponseFor,
  theologyExam,
  withExamAttempt,
  theologyExamResult,
} from "@tests/factories/exam-state";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@/core/links/open-passage-link", () => ({
  openPassageLink: jest.fn().mockResolvedValue("closed"),
}));

jest.mock("@/features/exams/data/bundled-exams", () => ({
  ...jest.requireActual<typeof BundledExams>("@/features/exams/data/bundled-exams"),
  getBundledExam: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockBack = jest.fn<void, []>();

const { exam } = theologyExam();

/** Flattens whatever shape `router.push`/`replace` was called with into one searchable string. */
function hrefText(href: unknown): string {
  if (typeof href === "string") return href;
  if (href && typeof href === "object") {
    const { pathname, params } = href as { pathname?: unknown; params?: Record<string, unknown> };
    return [pathname, params && Object.values(params).join("/")].filter(Boolean).join(" ");
  }
  return String(href);
}

function lastPush(): string {
  const call = mockPush.mock.calls.at(-1);
  return call ? hrefText(call[0]) : "";
}

/** Pulls an `attemptId` out of whatever `router.push` was last called with. */
function pushedAttemptId(): string {
  const call = mockPush.mock.calls.at(-1);
  const href = call?.[0];
  if (href && typeof href === "object" && "params" in href) {
    const params = (href as { params?: Record<string, unknown> }).params;
    const id = params?.attemptId;
    if (typeof id === "string") return id;
  }
  const match = hrefText(href).match(/\/exam\/([^/\s]+)/);
  if (!match) throw new Error(`No attemptId found in push call: ${JSON.stringify(href)}`);
  return match[1]!;
}

function overviewTree(state: AppState, extra?: ReactNode) {
  return (
    <AppStoreProvider initialState={state}>
      <ExamOverviewScreen />
      {extra}
    </AppStoreProvider>
  );
}

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush, back: mockBack } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(getBundledExam).mockReturnValue({ ok: true, ...theologyExam() });
  jest.mocked(useLocalSearchParams).mockReturnValue({ examId: "THEO-01-01" });
});

describe("ExamOverviewScreen", () => {
  it("is addressable as exam-overview-screen", () => {
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByTestId("exam-overview-screen")).toBeVisible();
  });

  it("shows the exam's domain and level, its title, and the question it asks", () => {
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByText("Scripture & Reading / Foundations")).toBeVisible();
    expect(screen.getByText(exam.summary.title)).toBeVisible();
    expect(screen.getByText("What did Jesus and the apostles say about Scripture?")).toBeVisible();
  });

  it("shows how many questions, how long, and how many passages, on one line", () => {
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByTestId("exam-overview-facts-questions")).toHaveTextContent("15 questions");
    expect(screen.getByTestId("exam-overview-facts-duration")).toHaveTextContent("8–12 min");
    expect(screen.getByTestId("exam-overview-facts-passages")).toHaveTextContent("3 passages");
  });

  it("falls back to the exam's overview when the content asks no question of its own", () => {
    const { exam: plain, reveals } = theologyExam();
    jest.mocked(getBundledExam).mockReturnValue({
      ok: true,
      reveals,
      exam: { ...plain, summary: { ...plain.summary, question: null, explore: [] } },
    });
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByText(exam.summary.overview)).toBeVisible();
  });

  describe("what more it covers", () => {
    it("opens its topics in a sheet", () => {
      render(overviewTree(INITIAL_STATE));

      fireEvent.press(screen.getByTestId("exam-overview-topics-button"));

      expect(mockPush).toHaveBeenCalledWith(examTopicsHref("THEO-01-01"));
    });

    it("opens its passages in a sheet", () => {
      render(overviewTree(INITIAL_STATE));

      fireEvent.press(screen.getByTestId("exam-overview-passages-button"));

      expect(mockPush).toHaveBeenCalledWith(examPassagesHref("THEO-01-01"));
    });

    it("offers no topics when the content names none", () => {
      const { exam: plain, reveals } = theologyExam();
      jest.mocked(getBundledExam).mockReturnValue({
        ok: true,
        reveals,
        exam: { ...plain, summary: { ...plain.summary, explore: [] } },
      });
      render(overviewTree(INITIAL_STATE));

      expect(screen.queryByTestId("exam-overview-topics-button")).toBeNull();
      expect(screen.getByTestId("exam-overview-passages-button")).toBeVisible();
    });
  });

  it("makes its action the black primary button", () => {
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByTestId("exam-overview-start-button")).toHaveStyle({
      backgroundColor: lightTheme.colors.controlPrimary,
    });
  });

  it("floats its action where every bar in the app floats", () => {
    render(overviewTree(INITIAL_STATE));

    expect(
      within(screen.getByTestId("exam-overview-bar")).getByTestId("exam-overview-start-button"),
    ).toHaveTextContent("Begin study");
  });

  describe("choosing how to begin", () => {
    it("sets Study and Exam side by side, Study first, as a choice of two", () => {
      render(overviewTree(INITIAL_STATE));

      const options = screen.getByTestId("exam-overview-mode-options");
      expect(options).toHaveStyle({ flexDirection: "row" });
      expect(
        within(options)
          .getAllByRole("radio")
          .map((option) => String(option.props.testID)),
      ).toEqual(["exam-overview-mode-study", "exam-overview-mode-exam"]);
      expect(screen.getByTestId("exam-overview-mode-exam")).toHaveTextContent(/Exam/);
      expect(screen.getByTestId("exam-overview-mode-study")).toHaveTextContent(/Study/);
    });

    it("starts on Study, explaining it under the choice", () => {
      render(overviewTree(INITIAL_STATE));

      expect(screen.getByTestId("exam-overview-mode-study")).toBeChecked();
      expect(screen.getByTestId("exam-overview-mode-exam")).not.toBeChecked();
      expect(screen.getByTestId("exam-overview-mode-description")).toHaveTextContent(
        /Learn after each answer\..*Check each answer as you go, and learn why it's right\./,
      );
    });

    it("picks Exam when it's pressed — its explanation, and the action, follow", () => {
      render(overviewTree(INITIAL_STATE));

      fireEvent.press(screen.getByTestId("exam-overview-mode-exam"));

      expect(screen.getByTestId("exam-overview-mode-exam")).toBeChecked();
      expect(screen.getByTestId("exam-overview-mode-study")).not.toBeChecked();
      expect(screen.getByTestId("exam-overview-mode-description")).toHaveTextContent(
        /See answers after you submit\..*Answer every question, then submit\. Scored\./,
      );
      expect(screen.getByTestId("exam-overview-start-button")).toHaveTextContent("Begin exam");
    });

    it("tells VoiceOver what each way in is like, on the choice itself", () => {
      render(overviewTree(INITIAL_STATE));

      expect(screen.getByTestId("exam-overview-mode-study")).toHaveAccessibleName(
        /Study\. Learn after each answer\./,
      );
    });
  });

  it("pins Topics covered and Passages to the foot of the screen, apart from the choice", () => {
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByTestId("exam-overview-more")).toHaveStyle({ marginTop: "auto" });
    const begin = within(screen.getByTestId("exam-overview-begin"));
    expect(begin.queryByTestId("exam-overview-topics-button")).toBeNull();
    expect(
      within(screen.getByTestId("exam-overview-more")).getByTestId("exam-overview-passages-button"),
    ).toBeVisible();
  });

  describe("a first visit", () => {
    it("offers Begin study, alone", () => {
      render(overviewTree(INITIAL_STATE));

      expect(screen.getByTestId("exam-overview-start-button")).toHaveTextContent("Begin study");
      expect(screen.queryByTestId("exam-overview-secondary-button")).toBeNull();
    });

    it("begins an exam — no answer shown before it's submitted", () => {
      const view = render(overviewTree(INITIAL_STATE));

      fireEvent.press(screen.getByTestId("exam-overview-mode-exam"));
      fireEvent.press(screen.getByTestId("exam-overview-start-button"));
      const attemptId = pushedAttemptId();
      jest.mocked(useLocalSearchParams).mockReturnValue({ attemptId });
      view.rerender(overviewTree(INITIAL_STATE, <ExamSessionScreen />));
      fireEvent.press(screen.getByTestId("exam-session-start-button"));

      expect(screen.queryByTestId("exam-check-button")).toBeNull();
    });

    it("begins study — feedback after each question", () => {
      const view = render(overviewTree(INITIAL_STATE));

      fireEvent.press(screen.getByTestId("exam-overview-start-button"));
      const attemptId = pushedAttemptId();
      jest.mocked(useLocalSearchParams).mockReturnValue({ attemptId });
      view.rerender(overviewTree(INITIAL_STATE, <ExamSessionScreen />));
      fireEvent.press(screen.getByTestId("exam-session-start-button"));

      // Study Mode's Check answer button only exists in a Study attempt.
      expect(screen.getByTestId("exam-check-button")).toBeVisible();
    });
  });

  describe("an exam left unfinished", () => {
    const opened = withExamAttempt(INITIAL_STATE, { attemptId: "attempt-open-1" });

    it("offers Resume exam", () => {
      render(overviewTree(opened));

      expect(screen.getByTestId("exam-overview-start-button")).toHaveTextContent("Resume exam");
      expect(screen.queryByTestId("exam-overview-secondary-button")).toBeNull();
    });

    it("resumes the open attempt's own session", () => {
      render(overviewTree(opened));
      fireEvent.press(screen.getByTestId("exam-overview-start-button"));

      expect(lastPush()).toContain("attempt-open-1");
    });

    it("still lets study begin beside it", () => {
      render(overviewTree(opened));

      fireEvent.press(screen.getByTestId("exam-overview-mode-study"));

      expect(screen.getByTestId("exam-overview-start-button")).toHaveTextContent("Begin study");
    });

    it("says how far through it is", () => {
      render(overviewTree(opened));

      expect(screen.getByTestId("exam-overview-standing")).toHaveTextContent(
        /In progress · 0 of 15 answered/,
      );
    });
  });

  describe("an exam submitted", () => {
    const submitted = withExamAttempt(INITIAL_STATE, {
      attemptId: "attempt-done-1",
      completedResult: theologyExamResult({ incorrectQuestionIds: ["THEO-01-01-Q08"] }),
    });

    it("offers practising again, as an exam", () => {
      render(overviewTree(submitted));

      fireEvent.press(screen.getByTestId("exam-overview-mode-exam"));
      expect(screen.getByTestId("exam-overview-start-button")).toHaveTextContent("Practice again");
      fireEvent.press(screen.getByTestId("exam-overview-start-button"));

      expect(lastPush()).toContain("/exam/");
    });

    it("leads to its results beside it, in the same bar", () => {
      render(overviewTree(submitted));

      expect(
        within(screen.getByTestId("exam-overview-bar")).getByTestId(
          "exam-overview-secondary-button",
        ),
      ).toHaveTextContent("View results");
      fireEvent.press(screen.getByTestId("exam-overview-secondary-button"));

      expect(lastPush()).toContain("/exam/[attemptId]/results");
      expect(lastPush()).toContain("attempt-done-1");
    });

    it("gives the last score", () => {
      render(overviewTree(submitted));

      expect(screen.getByTestId("exam-overview-standing")).toHaveTextContent(
        /Last score · 14 of 15/,
      );
    });
  });

  describe("answers already seen in Study", () => {
    const [first] = exam.questions;
    const studied = withExamAttempt(INITIAL_STATE, {
      attemptId: "attempt-study-1",
      mode: "study",
      responses: first ? { [first.id]: correctResponseFor(first.id) } : {},
      checks: first ? { [first.id]: { at: "2026-09-28T07:05:00.000Z", correct: true } } : {},
    });

    it("starts on Study, continuing the one already begun", () => {
      render(overviewTree(studied));

      expect(screen.getByTestId("exam-overview-mode-study")).toBeChecked();
      expect(screen.getByTestId("exam-overview-start-button")).toHaveTextContent("Continue study");
      fireEvent.press(screen.getByTestId("exam-overview-start-button"));

      expect(lastPush()).toContain("attempt-study-1");
    });

    it("makes an exam a practice one, and says so", () => {
      render(overviewTree(studied));

      fireEvent.press(screen.getByTestId("exam-overview-mode-exam"));

      expect(screen.getByTestId("exam-overview-start-button")).toHaveTextContent(
        "Begin practice exam",
      );
      expect(screen.getByText(/a new exam is Practice/)).toBeVisible();
    });
  });

  it("shows an exam it doesn't have as unavailable", () => {
    jest.mocked(getBundledExam).mockReturnValue(null);
    jest.mocked(useLocalSearchParams).mockReturnValue({ examId: "THEO-99-99" });
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByTestId("exam-overview-unavailable")).toBeVisible();
    expect(screen.queryByTestId("exam-overview-start-button")).toBeNull();
  });

  it("goes back when the back button is pressed", () => {
    render(overviewTree(INITIAL_STATE));

    fireEvent.press(screen.getByTestId("exam-overview-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  describe("when the bundled content fails closed", () => {
    beforeEach(() => {
      jest.mocked(getBundledExam).mockReturnValue({
        ok: false,
        examId: "THEO-01-01",
        issues: ["questions[0].interaction.answerKey"],
      });
    });

    it("shows exam-content-error naming the failing field path", () => {
      render(overviewTree(INITIAL_STATE));

      expect(screen.getByTestId("exam-content-error")).toHaveTextContent(
        "questions[0].interaction.answerKey",
        { exact: false },
      );
    });

    it("offers no way to start", () => {
      render(overviewTree(INITIAL_STATE));

      expect(screen.queryByTestId("exam-overview-start-button")).toBeNull();
    });
  });

  it("lists a missed concept's teaching title under For review", () => {
    // Q08's primary concept is berean_examination, and its teaching title is
    // "Berean Examination" — real content, not invented for the test.
    const completed = withExamAttempt(INITIAL_STATE, {
      attemptId: "attempt-missed-1",
      completedResult: theologyExamResult({ incorrectQuestionIds: ["THEO-01-01-Q08"] }),
    });

    render(overviewTree(completed));

    expect(screen.getByText("Berean Examination")).toBeVisible();
  });

  it("reviews what was missed in a short study of just those questions", () => {
    // Q08's concept, berean_examination, is also Q10's and Q13's: three questions to review.
    const completed = withExamAttempt(INITIAL_STATE, {
      attemptId: "attempt-missed-1",
      completedResult: theologyExamResult({ incorrectQuestionIds: ["THEO-01-01-Q08"] }),
    });
    const view = render(overviewTree(completed));

    expect(screen.getByTestId("exam-overview-review-button")).toHaveTextContent("Review 1 concept");
    fireEvent.press(screen.getByTestId("exam-overview-review-button"));
    const attemptId = pushedAttemptId();
    jest.mocked(useLocalSearchParams).mockReturnValue({ attemptId });
    view.rerender(overviewTree(completed, <ExamSessionScreen />));
    fireEvent.press(screen.getByTestId("exam-session-start-button"));

    expect(screen.getByText("1 of 3")).toBeVisible();
    expect(screen.getByTestId("exam-check-button")).toBeOnTheScreen();
  });

  it("shows a Practice notice once a prior Exam Mode attempt has already been submitted", () => {
    const priorAttempt = withExamAttempt(INITIAL_STATE, {
      attemptId: "attempt-prior-1",
      completedResult: theologyExamResult({}),
    });

    render(overviewTree(priorAttempt));
    fireEvent.press(screen.getByTestId("exam-overview-mode-exam"));

    expect(screen.getByText(/a new exam is Practice/)).toBeVisible();
  });
});
