import type { ReactNode } from "react";
import { render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { AppStoreProvider, INITIAL_STATE, type AppState } from "@/core/store";
import { openPassageLink } from "@/core/links/open-passage-link";
import { getTheologyExam } from "@/features/exams/data/bundled-exams";
import type * as BundledExams from "@/features/exams/data/bundled-exams";
import { ExamOverviewScreen, ExamSessionScreen } from "@/features/exams";
import { theologyExam, withExamAttempt, theologyExamResult } from "@tests/factories/exam-state";

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
  getTheologyExam: jest.fn(),
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
  jest.mocked(getTheologyExam).mockReturnValue({ ok: true, ...theologyExam() });
});

describe("ExamOverviewScreen", () => {
  it("is addressable as exam-overview-screen", () => {
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByTestId("exam-overview-screen")).toBeVisible();
  });

  it("shows the exam's title", () => {
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByText(exam.summary.title)).toBeVisible();
  });

  it("shows the exam's domain and level", () => {
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByText("Scripture & Reading · Foundations")).toBeVisible();
  });

  it("shows the question count", () => {
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByText("15 questions")).toBeVisible();
  });

  it("shows the expected duration", () => {
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByText("8–12 min")).toBeVisible();
  });

  it("shows what the learner will do", () => {
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByText(exam.summary.overview)).toBeVisible();
  });

  it.each(exam.summary.objectives)("shows the objective: %s", (objective) => {
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByText(objective)).toBeVisible();
  });

  it.each(exam.summary.concepts)("shows the concept covered: %s", (concept) => {
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByText(concept)).toBeVisible();
  });

  it("shows a source link for every passage in the exam's source scope", () => {
    render(overviewTree(INITIAL_STATE));

    exam.summary.sourceLinks.forEach((_link, index) => {
      expect(screen.getByTestId(`exam-overview-source-link-${index}`)).toBeVisible();
    });
  });

  it("opens a source link's passage when pressed", () => {
    render(overviewTree(INITIAL_STATE));

    fireEvent.press(screen.getByTestId("exam-overview-source-link-0"));

    expect(openPassageLink).toHaveBeenCalledWith(exam.summary.sourceLinks[0]!.url);
  });

  it("says the score measures performance on these questions, not spiritual standing or a credential", () => {
    render(overviewTree(INITIAL_STATE));

    expect(
      screen.getByText(
        "Your score shows how you did on these questions. It doesn't measure spiritual standing, and it isn't a credential.",
      ),
    ).toBeVisible();
  });

  it("describes Exam Mode from the content's own completion behavior", () => {
    render(overviewTree(INITIAL_STATE));

    const mode = screen.getByTestId("exam-overview-mode-exam");
    expect(mode).toHaveTextContent("Exam Mode", { exact: false });
    expect(mode).toHaveTextContent(exam.summary.modeDescriptions.exam, { exact: false });
  });

  it("describes Study Mode from the content's own completion behavior", () => {
    render(overviewTree(INITIAL_STATE));

    const mode = screen.getByTestId("exam-overview-mode-study");
    expect(mode).toHaveTextContent("Study Mode", { exact: false });
    expect(mode).toHaveTextContent(exam.summary.modeDescriptions.study, { exact: false });
  });

  it("selects Exam Mode by default", () => {
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByTestId("exam-overview-mode-exam")).toBeSelected();
    expect(screen.getByTestId("exam-overview-mode-study")).not.toBeSelected();
  });

  it("reports each mode option with the radio role", () => {
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByTestId("exam-overview-mode-exam")).toHaveProp("accessibilityRole", "radio");
    expect(screen.getByTestId("exam-overview-mode-study")).toHaveProp("accessibilityRole", "radio");
  });

  it("selects Study Mode once it's pressed", () => {
    render(overviewTree(INITIAL_STATE));

    fireEvent.press(screen.getByTestId("exam-overview-mode-study"));

    expect(screen.getByTestId("exam-overview-mode-study")).toBeSelected();
    expect(screen.getByTestId("exam-overview-mode-exam")).not.toBeSelected();
  });

  it("labels the button Start when no attempt is open", () => {
    render(overviewTree(INITIAL_STATE));

    expect(screen.getByTestId("exam-overview-start-button")).toHaveTextContent("Start");
  });

  it("starts an attempt and moves to its session when Start is pressed", () => {
    render(overviewTree(INITIAL_STATE));

    fireEvent.press(screen.getByTestId("exam-overview-start-button"));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(lastPush()).toContain("/exam/");
  });

  it("begins the attempt in the mode last picked, not always Exam Mode", () => {
    const view = render(overviewTree(INITIAL_STATE));
    jest.mocked(useLocalSearchParams).mockReturnValue({});

    fireEvent.press(screen.getByTestId("exam-overview-mode-study"));
    fireEvent.press(screen.getByTestId("exam-overview-start-button"));
    const attemptId = pushedAttemptId();

    jest.mocked(useLocalSearchParams).mockReturnValue({ attemptId });
    view.rerender(overviewTree(INITIAL_STATE, <ExamSessionScreen />));

    // Study Mode's Check answer button only exists in a Study attempt — Exam
    // Mode never shows correctness before submission (criterion 15).
    expect(screen.getByTestId("exam-check-button")).toBeVisible();
  });

  it("labels the button Resume when an attempt is already open", () => {
    const opened = withExamAttempt(INITIAL_STATE, { attemptId: "attempt-open-1" });

    render(overviewTree(opened));

    expect(screen.getByTestId("exam-overview-start-button")).toHaveTextContent("Resume");
  });

  it("resumes the open attempt's own session when Resume is pressed", () => {
    const opened = withExamAttempt(INITIAL_STATE, { attemptId: "attempt-open-1" });

    render(overviewTree(opened));
    fireEvent.press(screen.getByTestId("exam-overview-start-button"));

    expect(lastPush()).toContain("attempt-open-1");
  });

  it("goes back when the back button is pressed", () => {
    render(overviewTree(INITIAL_STATE));

    fireEvent.press(screen.getByTestId("exam-overview-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  describe("when the bundled content fails closed", () => {
    beforeEach(() => {
      jest.mocked(getTheologyExam).mockReturnValue({
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

  it("shows a Practice notice once a prior Exam Mode attempt has already been submitted", () => {
    const priorAttempt = withExamAttempt(INITIAL_STATE, {
      attemptId: "attempt-prior-1",
      completedResult: theologyExamResult({}),
    });

    render(overviewTree(priorAttempt));

    expect(screen.getByText(/Practice/)).toBeVisible();
  });
});
