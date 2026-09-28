import { render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { AppStoreProvider, INITIAL_STATE, type AppState } from "@/core/store";
import { openPassageLink } from "@/core/links/open-passage-link";
import { UnderstandWhyScreen } from "@/features/exams";
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

jest.mock("@/core/links/open-passage-link", () => ({
  openPassageLink: jest.fn().mockResolvedValue("closed"),
}));

const ATTEMPT_ID = "attempt-why-test";
const Q01 = "THEO-01-01-Q01";

const mockBack = jest.fn<void, []>();

beforeEach(() => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ attemptId: ATTEMPT_ID, questionId: Q01 });
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: mockBack } as unknown as ReturnType<typeof useRouter>);
});

function renderWhy(state: AppState) {
  return render(
    <AppStoreProvider initialState={state}>
      <UnderstandWhyScreen />
    </AppStoreProvider>,
  );
}

describe("UnderstandWhyScreen", () => {
  it("is addressable as exam-why-screen", () => {
    const submitted = withExamAttempt(INITIAL_STATE, {
      attemptId: ATTEMPT_ID,
      mode: "exam",
      responses: { [Q01]: correctResponseFor(Q01) },
      completedResult: theologyExamResult(),
    });

    renderWhy(submitted);

    expect(screen.getByTestId("exam-why-screen")).toBeVisible();
  });

  describe("once an Exam Mode attempt is submitted", () => {
    function submittedState(): AppState {
      return withExamAttempt(INITIAL_STATE, {
        attemptId: ATTEMPT_ID,
        mode: "exam",
        responses: { [Q01]: correctResponseFor(Q01) },
        completedResult: theologyExamResult(),
      });
    }

    it("shows the question's teaching title", () => {
      renderWhy(submittedState());

      expect(screen.getByText("Scripture Known In Childhood")).toBeVisible();
    });

    it("shows the question's teaching concept", () => {
      renderWhy(submittedState());

      expect(
        screen.getByText(/The letter appeals to writings Timothy had already learned/),
      ).toBeVisible();
    });

    it("shows a Biblical grounding passage link for each grounding passage", () => {
      renderWhy(submittedState());

      expect(screen.getByText("Biblical grounding")).toBeVisible();
      expect(screen.getByTestId("exam-why-passage-link-0")).toBeVisible();
    });

    it("opens the grounding passage when its link is pressed", () => {
      renderWhy(submittedState());

      fireEvent.press(screen.getByTestId("exam-why-passage-link-0"));

      expect(openPassageLink).toHaveBeenCalledWith(
        "https://www.biblegateway.com/passage/?search=2%20Timothy%203%3A14-15&version=KJV",
      );
    });

    it("shows the important distinction", () => {
      renderWhy(submittedState());

      expect(
        screen.getByText("The text identifies the holy Scriptures Timothy knew from childhood."),
      ).toBeVisible();
    });

    it("shows what to remember", () => {
      renderWhy(submittedState());

      expect(
        screen.getByText("Read what the passage names before drawing a later canon conclusion."),
      ).toBeVisible();
    });
  });

  it("stays locked before an Exam Mode attempt is submitted", () => {
    const inProgress = withExamAttempt(INITIAL_STATE, {
      attemptId: ATTEMPT_ID,
      mode: "exam",
      responses: { [Q01]: correctResponseFor(Q01) },
    });

    renderWhy(inProgress);

    expect(screen.getByTestId("exam-why-locked")).toBeVisible();
    expect(screen.queryByText("Scripture Known In Childhood")).toBeNull();
  });

  it("stays locked for a Study Mode question not yet checked", () => {
    const unchecked = withExamAttempt(INITIAL_STATE, {
      attemptId: ATTEMPT_ID,
      mode: "study",
      responses: { [Q01]: correctResponseFor(Q01) },
    });

    renderWhy(unchecked);

    expect(screen.getByTestId("exam-why-locked")).toBeVisible();
    expect(screen.queryByText("Scripture Known In Childhood")).toBeNull();
  });

  it("unlocks once a Study Mode question has been checked", () => {
    const checked = withExamAttempt(INITIAL_STATE, {
      attemptId: ATTEMPT_ID,
      mode: "study",
      responses: { [Q01]: wrongSingleChoiceResponseFor(Q01) },
      checks: { [Q01]: { at: "2026-09-28T07:05:00.000Z", correct: false } },
    });

    renderWhy(checked);

    expect(screen.getByText("Scripture Known In Childhood")).toBeVisible();
    expect(screen.queryByTestId("exam-why-locked")).toBeNull();
  });

  it("goes back when the back button is pressed", () => {
    const unchecked = withExamAttempt(INITIAL_STATE, {
      attemptId: ATTEMPT_ID,
      mode: "study",
      responses: { [Q01]: correctResponseFor(Q01) },
    });

    renderWhy(unchecked);

    fireEvent.press(screen.getByTestId("exam-why-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
