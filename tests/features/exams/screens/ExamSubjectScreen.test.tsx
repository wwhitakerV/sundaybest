import { render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { AppStoreProvider, INITIAL_STATE, type AppState } from "@/core/store";
import { openPassageLink } from "@/core/links/open-passage-link";
import { ExamSubjectScreen } from "@/features/exams";
import { theologyExamResult, withExamAttempt } from "@tests/factories/exam-state";
import { examOverviewHref } from "@/features/exams/logic/routes";

jest.mock("@/core/links/open-passage-link", () => ({
  openPassageLink: jest.fn().mockResolvedValue("closed"),
}));

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockBack = jest.fn<void, []>();

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({
    push: mockPush,
    back: mockBack,
  } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useLocalSearchParams).mockReturnValue({ subjectId: "THEO-01" });
});

function renderSubject(state: AppState = INITIAL_STATE) {
  render(
    <AppStoreProvider initialState={state}>
      <ExamSubjectScreen />
    </AppStoreProvider>,
  );
}

describe("ExamSubjectScreen", () => {
  it("is headed by the subject, with its place among them and how many exams it holds", () => {
    renderSubject();

    expect(screen.getByTestId("exam-subject-screen")).toBeVisible();
    expect(screen.getByRole("header", { name: "Scripture & Reading" })).toBeVisible();
    expect(screen.getByText("Subject 01 / 12")).toBeVisible();
    expect(screen.getByText(/^Four exams/)).toBeVisible();
  });

  it("lists its exams, each with its level and title", () => {
    renderSubject();

    expect(screen.getByTestId("exam-subject-item-THEO-01-01")).toHaveTextContent(
      /foundations.*The Scriptures Received/i,
    );
    expect(screen.getByTestId("exam-subject-item-THEO-01-04")).toHaveTextContent(
      /scholar.*Canon, Interpretation & Authority/i,
    );
  });

  it("gives an exam that can be taken its questions, time, and passages", () => {
    renderSubject();

    expect(screen.getByTestId("exam-subject-item-THEO-01-01")).toHaveTextContent(
      /15 questions.*8–12 min.*3 passages/,
    );
  });

  it("says an exam not yet written isn't available yet", () => {
    renderSubject();

    expect(screen.getByTestId("exam-subject-item-THEO-01-02")).toHaveTextContent(
      /Not available yet/,
    );
  });

  it("opens an exam's overview", () => {
    renderSubject();

    fireEvent.press(screen.getByTestId("exam-subject-item-THEO-01-01"));

    expect(mockPush).toHaveBeenCalledWith(examOverviewHref("THEO-01-01"));
  });

  describe("where the learner stands", () => {
    it("marks the first exam as where to start, on a first visit", () => {
      renderSubject();

      expect(screen.getByTestId("exam-subject-item-THEO-01-01-next")).toHaveTextContent(
        "Start here",
      );
    });

    it("says how far through an exam under way is, and marks it to continue", () => {
      renderSubject(withExamAttempt(INITIAL_STATE, { attemptId: "attempt-open-1" }));

      expect(screen.getByTestId("exam-subject-item-THEO-01-01")).toHaveTextContent(
        /In progress · 0 of 15 answered/,
      );
      expect(screen.getByTestId("exam-subject-item-THEO-01-01-next")).toHaveTextContent("Continue");
    });

    it("gives the last score once one's submitted, and marks nothing left to take", () => {
      renderSubject(
        withExamAttempt(INITIAL_STATE, {
          attemptId: "attempt-done-1",
          completedResult: theologyExamResult({}),
        }),
      );

      expect(screen.getByTestId("exam-subject-item-THEO-01-01")).toHaveTextContent(/Last score/);
      expect(screen.queryByTestId(/-next$/)).toBeNull();
    });
  });

  describe("as a syllabus", () => {
    it("sets its exams out as a course, taken in order", () => {
      renderSubject();

      expect(screen.getByText("Four exams · taken in order, each going deeper")).toBeVisible();
    });

    it("says what each exam that can be taken will have the learner able to do", () => {
      renderSubject();

      expect(screen.getByTestId("exam-subject-objectives")).toHaveTextContent(
        /Foundations · The Scriptures Received.*Identify major divisions/,
      );
    });

    it("lists the passages to read, each opening in Safari", () => {
      renderSubject();

      expect(screen.getByTestId("exam-subject-reading-0")).toHaveTextContent("Luke 24:25-49");
      fireEvent.press(screen.getByTestId("exam-subject-reading-0"));

      expect(openPassageLink).toHaveBeenCalledWith(
        "https://www.biblegateway.com/passage/?search=Luke%2024%3A25-49&version=KJV",
      );
    });
  });

  it("says what's due for review on an exam, once some was missed", () => {
    renderSubject(
      withExamAttempt(INITIAL_STATE, {
        attemptId: "attempt-missed-1",
        completedResult: theologyExamResult({ incorrectQuestionIds: ["THEO-01-01-Q08"] }),
      }),
    );

    expect(screen.getByTestId("exam-subject-item-THEO-01-01")).toHaveTextContent(
      /Review due · 1 concept/,
    );
  });

  it("says so when it hasn't the subject", () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ subjectId: "THEO-99" });
    renderSubject();

    expect(screen.getByTestId("exam-subject-unavailable")).toBeVisible();
  });

  it("goes back to the books", () => {
    renderSubject();

    fireEvent.press(screen.getByTestId("exam-subject-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
