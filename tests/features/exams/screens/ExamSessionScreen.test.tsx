import { render, screen, fireEvent, within } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { announce } from "@/core/accessibility/announce";
import { AppStoreProvider, INITIAL_STATE, type AppState } from "@/core/store";
import { openPassageLink } from "@/core/links/open-passage-link";
import { ExamSessionScreen, theologyExamsHref } from "@/features/exams";
import { examResultsHref, understandWhyHref } from "@/features/exams/logic/routes";
import type { ExamMode } from "@/types/domain";
import {
  correctResponseFor,
  theologyExam,
  theologyExamResult,
  withExamAttempt,
} from "@tests/factories/exam-state";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@/core/accessibility/announce", () => ({ announce: jest.fn() }));

jest.mock("@/core/links/open-passage-link", () => ({
  openPassageLink: jest.fn().mockResolvedValue("closed"),
}));

const ATTEMPT_ID = "attempt-session-test";
/** A real question ID, from its 1-indexed place in the exam. */
const qid = (n: number) => `THEO-01-01-Q${String(n).padStart(2, "0")}`;

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockReplace = jest.fn<void, [ExpoRouter.Href]>();
const mockDismissTo = jest.fn<void, [ExpoRouter.Href]>();

beforeEach(() => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ attemptId: ATTEMPT_ID });
  jest.mocked(useRouter).mockReturnValue({
    push: mockPush,
    replace: mockReplace,
    dismissTo: mockDismissTo,
  } as unknown as ReturnType<typeof useRouter>);
});

function freshAttempt(mode: ExamMode = "exam"): AppState {
  return withExamAttempt(INITIAL_STATE, { attemptId: ATTEMPT_ID, mode });
}

/** A Study attempt with every question answered correctly and checked — ready to finish. */
function everyAnswerChecked(): AppState {
  const questionIds = theologyExam().exam.questions.map((question) => question.id);
  return withExamAttempt(INITIAL_STATE, {
    attemptId: ATTEMPT_ID,
    mode: "study",
    responses: Object.fromEntries(questionIds.map((id) => [id, correctResponseFor(id)])),
    checks: Object.fromEntries(
      questionIds.map((id) => [id, { at: "2026-09-28T07:05:00.000Z", correct: true }]),
    ),
  });
}

/** Q04's prompt label, from the real content — what "Used for" and the move announcement name. */
function q04PromptLabel(promptId: string): string {
  const question = theologyExam().exam.questions.at(3);
  const prompt =
    question?.kind === "matching" ? question.prompts.find((p) => p.id === promptId) : undefined;
  if (!prompt) throw new Error(`Q04 has no prompt ${promptId}`);
  return prompt.label;
}

function renderSession(state: AppState) {
  return render(
    <AppStoreProvider initialState={state}>
      <ExamSessionScreen />
    </AppStoreProvider>,
  );
}

/** From question 1, presses Next until question `n` is on screen. */
function goToQuestion(n: number) {
  for (let i = 1; i < n; i += 1) {
    fireEvent.press(screen.getByTestId("exam-next-button"));
  }
}

describe("ExamSessionScreen", () => {
  it("is addressable as exam-session-screen", () => {
    renderSession(freshAttempt());

    expect(screen.getByTestId("exam-session-screen")).toBeVisible();
  });

  it("closes back to the exam overview", () => {
    renderSession(freshAttempt());

    fireEvent.press(screen.getByTestId("exam-session-close-button"));

    expect(mockDismissTo).toHaveBeenCalledWith(theologyExamsHref);
  });

  describe("every question", () => {
    it("shows its position among the 15", () => {
      renderSession(freshAttempt());

      expect(screen.getByText("1 of 15")).toBeVisible();
    });

    it("announces its position on the stem, for VoiceOver", () => {
      renderSession(freshAttempt());

      expect(screen.getByTestId("exam-question-stem")).toHaveProp(
        "accessibilityLabel",
        expect.stringMatching(/^Question 1 of 15/),
      );
    });

    it("shows the stem", () => {
      renderSession(freshAttempt());

      expect(
        screen.getByText("What had Timothy known since childhood, according to 2 Timothy 3:15?"),
      ).toBeVisible();
    });

    it("shows Choose one for a single-choice question", () => {
      renderSession(freshAttempt());

      expect(screen.getByText("Choose one")).toBeVisible();
    });

    it("shows True or false for a true/false question", () => {
      renderSession(freshAttempt());
      goToQuestion(3);

      expect(screen.getByText("True or false")).toBeVisible();
    });

    it("shows Select all that apply for a multiple-select question, with no count", () => {
      renderSession(freshAttempt());
      goToQuestion(9);

      expect(screen.getByText("Select all that apply")).toBeVisible();
      expect(screen.queryByText(/select \d+/i)).toBeNull();
    });

    it("shows Match each one for a matching question", () => {
      renderSession(freshAttempt());
      goToQuestion(4);

      expect(screen.getByText("Match each one")).toBeVisible();
    });

    it("shows Put these in order for an ordering question", () => {
      renderSession(freshAttempt());
      goToQuestion(11);

      expect(screen.getByText("Put these in order")).toBeVisible();
    });

    it("shows a passage link for each of the question's passage references", () => {
      renderSession(freshAttempt());

      expect(screen.getByTestId("exam-passage-link-0")).toBeVisible();
    });

    it("opens the question's own source when its passage link is pressed", () => {
      renderSession(freshAttempt());

      fireEvent.press(screen.getByTestId("exam-passage-link-0"));

      expect(openPassageLink).toHaveBeenCalledWith(
        "https://www.biblegateway.com/passage/?search=2%20Timothy%203%3A14-15&version=KJV",
      );
    });

    it("shows a choice row for every choice", () => {
      renderSession(freshAttempt());

      for (const letter of ["A", "B", "C", "D"]) {
        expect(screen.getByTestId(`exam-choice-${letter}`)).toBeVisible();
      }
    });

    it("shows a target choice for every prompt, on a matching question", () => {
      renderSession(freshAttempt());
      goToQuestion(4);

      for (const prompt of ["P1", "P2", "P3"]) {
        for (const target of ["R1", "R2", "R3"]) {
          expect(screen.getByTestId(`exam-match-${prompt}-${target}`)).toBeVisible();
        }
      }
    });

    it("shows a row for every step, and Clear order, on an ordering question", () => {
      renderSession(freshAttempt());
      goToQuestion(11);

      for (const step of ["S1", "S2", "S3", "S4"]) {
        expect(screen.getByTestId(`exam-order-step-${step}`)).toBeVisible();
      }
      expect(screen.getByTestId("exam-order-clear-button")).toBeVisible();
    });
  });

  describe("moving between questions", () => {
    it("keeps every response as it was left", () => {
      renderSession(freshAttempt());

      fireEvent.press(screen.getByTestId("exam-choice-A"));
      fireEvent.press(screen.getByTestId("exam-next-button"));
      fireEvent.press(screen.getByTestId("exam-previous-button"));

      expect(screen.getByTestId("exam-choice-A")).toBeSelected();
    });
  });

  describe("ordering", () => {
    it("numbers each tapped step with the next number, in the order tapped", () => {
      renderSession(freshAttempt());
      goToQuestion(11);

      fireEvent.press(screen.getByTestId("exam-order-step-S3"));
      fireEvent.press(screen.getByTestId("exam-order-step-S1"));

      expect(within(screen.getByTestId("exam-order-step-S3")).getByText("1")).toBeVisible();
      expect(within(screen.getByTestId("exam-order-step-S1")).getByText("2")).toBeVisible();
    });

    it("removes a tapped step's number and renumbers the rest when it's tapped again", () => {
      renderSession(freshAttempt());
      goToQuestion(11);

      fireEvent.press(screen.getByTestId("exam-order-step-S3"));
      fireEvent.press(screen.getByTestId("exam-order-step-S1"));
      fireEvent.press(screen.getByTestId("exam-order-step-S3"));

      expect(within(screen.getByTestId("exam-order-step-S1")).getByText("1")).toBeVisible();
      expect(within(screen.getByTestId("exam-order-step-S3")).queryByText(/^\d+$/)).toBeNull();
    });

    it("removes every number when Clear order is pressed", () => {
      renderSession(freshAttempt());
      goToQuestion(11);

      fireEvent.press(screen.getByTestId("exam-order-step-S3"));
      fireEvent.press(screen.getByTestId("exam-order-step-S1"));
      fireEvent.press(screen.getByTestId("exam-order-clear-button"));

      for (const step of ["S1", "S2", "S3", "S4"]) {
        expect(
          within(screen.getByTestId(`exam-order-step-${step}`)).queryByText(/^\d+$/),
        ).toBeNull();
      }
    });
  });

  describe("matching", () => {
    it("shows the target picked for a prompt as selected", () => {
      renderSession(freshAttempt());
      goToQuestion(4);

      fireEvent.press(screen.getByTestId("exam-match-P1-R1"));

      expect(screen.getByTestId("exam-match-P1-R1")).toBeSelected();
    });

    it("replaces a prompt's pick when another target is chosen for it", () => {
      renderSession(freshAttempt());
      goToQuestion(4);

      fireEvent.press(screen.getByTestId("exam-match-P1-R1"));
      fireEvent.press(screen.getByTestId("exam-match-P1-R2"));

      expect(screen.getByTestId("exam-match-P1-R2")).toBeSelected();
      expect(screen.getByTestId("exam-match-P1-R1")).not.toBeSelected();
    });

    it("marks a target already paired Used for its prompt, on every other prompt (criterion 11)", () => {
      renderSession(freshAttempt());
      goToQuestion(4);

      fireEvent.press(screen.getByTestId("exam-match-P1-R1"));

      expect(screen.getByTestId("exam-match-P2-R1")).toHaveTextContent(
        `Used for ${q04PromptLabel("P1")}`,
        { exact: false },
      );
    });

    it("announces a moved target to VoiceOver, naming the prompt left unanswered (criterion 11)", () => {
      renderSession(freshAttempt());
      goToQuestion(4);
      fireEvent.press(screen.getByTestId("exam-match-P1-R1"));

      fireEvent.press(screen.getByTestId("exam-match-P2-R1"));

      const from = q04PromptLabel("P1");
      expect(announce).toHaveBeenCalledWith(`Moved from ${from}. ${from} is now unanswered.`);
    });

    it("announces nothing when a target that was free is picked", () => {
      renderSession(freshAttempt());
      goToQuestion(4);

      fireEvent.press(screen.getByTestId("exam-match-P1-R1"));

      expect(announce).not.toHaveBeenCalled();
    });

    it("moves a target to the prompt it's newly picked for, leaving its old prompt unanswered", () => {
      renderSession(freshAttempt());
      goToQuestion(4);

      fireEvent.press(screen.getByTestId("exam-match-P1-R1"));
      fireEvent.press(screen.getByTestId("exam-match-P2-R1"));

      expect(screen.getByTestId("exam-match-P1-R1")).not.toBeSelected();
      expect(screen.getByTestId("exam-match-P1-R2")).not.toBeSelected();
      expect(screen.getByTestId("exam-match-P1-R3")).not.toBeSelected();
    });
  });

  describe("Exam Mode", () => {
    it("saves the response silently, with no verdict, once it's complete", () => {
      renderSession(freshAttempt("exam"));

      fireEvent.press(screen.getByTestId("exam-choice-A"));

      expect(screen.getByText("Answer saved")).toBeVisible();
    });

    it("shows no correctness before the exam is submitted", () => {
      renderSession(freshAttempt("exam"));

      fireEvent.press(screen.getByTestId("exam-choice-A"));

      expect(screen.queryByText("Correct")).toBeNull();
      expect(screen.queryByText("Incorrect")).toBeNull();
      expect(
        screen.queryByText("The text identifies the holy Scriptures Timothy knew from childhood."),
      ).toBeNull();
    });

    it("counts only complete responses toward the answered total", () => {
      renderSession(freshAttempt("exam"));

      fireEvent.press(screen.getByTestId("exam-choice-A"));

      expect(screen.getByTestId("exam-progress")).toHaveTextContent("1 of 15 answered", {
        exact: false,
      });
    });

    it("does not count a matching question with only one prompt paired", () => {
      renderSession(freshAttempt("exam"));
      goToQuestion(4);

      fireEvent.press(screen.getByTestId("exam-match-P1-R1"));

      expect(screen.getByTestId("exam-progress")).toHaveTextContent("0 of 15 answered", {
        exact: false,
      });
    });

    it("labels the last question's Next as Review answers", () => {
      renderSession(freshAttempt("exam"));
      goToQuestion(15);

      expect(screen.getByTestId("exam-next-button")).toHaveTextContent("Review answers", {
        exact: false,
      });
    });

    it("shows the review once the last question moves on", () => {
      renderSession(freshAttempt("exam"));
      goToQuestion(15);

      fireEvent.press(screen.getByTestId("exam-next-button"));

      expect(screen.getByText("Review your answers")).toBeVisible();
    });

    it("marks an answered question Answered on the review", () => {
      const answered = withExamAttempt(INITIAL_STATE, {
        attemptId: ATTEMPT_ID,
        mode: "exam",
        responses: { [qid(1)]: { kind: "single_choice", choiceId: "D" } },
      });
      renderSession(answered);
      // Q01 is answered, so the session resumes on Q02: 13 steps reach Q15.
      expect(screen.getByText("2 of 15")).toBeVisible();
      goToQuestion(14);
      fireEvent.press(screen.getByTestId("exam-next-button"));

      expect(screen.getByTestId(`exam-review-row-${qid(1)}`)).toHaveTextContent("Answered", {
        exact: false,
      });
    });

    it("marks a question with no response Unanswered on the review", () => {
      renderSession(freshAttempt("exam"));
      goToQuestion(15);
      fireEvent.press(screen.getByTestId("exam-next-button"));

      expect(screen.getByTestId(`exam-review-row-${qid(2)}`)).toHaveTextContent("Unanswered", {
        exact: false,
      });
    });

    it("returns to a question when its review row is pressed", () => {
      renderSession(freshAttempt("exam"));
      goToQuestion(15);
      fireEvent.press(screen.getByTestId("exam-next-button"));

      fireEvent.press(screen.getByTestId(`exam-review-row-${qid(1)}`));

      expect(screen.getByText("1 of 15")).toBeVisible();
    });

    describe("submitting", () => {
      function goToReview() {
        goToQuestion(15);
        fireEvent.press(screen.getByTestId("exam-next-button"));
      }

      it("asks for confirmation, naming what's unanswered and that it will count as incorrect", () => {
        renderSession(freshAttempt("exam"));
        goToReview();

        fireEvent.press(screen.getByTestId("exam-submit-button"));

        expect(screen.getByText("They'll count as incorrect.")).toBeVisible();
      });

      it("returns to the review when Keep working is pressed", () => {
        renderSession(freshAttempt("exam"));
        goToReview();
        fireEvent.press(screen.getByTestId("exam-submit-button"));

        fireEvent.press(screen.getByTestId("exam-submit-cancel-button"));

        expect(screen.getByText("Review your answers")).toBeVisible();
        expect(screen.queryByText("They'll count as incorrect.")).toBeNull();
      });

      it("submits the attempt and moves to its results when Submit now is pressed", () => {
        renderSession(freshAttempt("exam"));
        goToReview();
        fireEvent.press(screen.getByTestId("exam-submit-button"));

        fireEvent.press(screen.getByTestId("exam-submit-confirm-button"));

        expect(mockReplace).toHaveBeenCalledWith(examResultsHref(ATTEMPT_ID));
      });

      it("records the attempt as submitted in the store", () => {
        renderSession(freshAttempt("exam"));
        goToReview();
        fireEvent.press(screen.getByTestId("exam-submit-button"));

        fireEvent.press(screen.getByTestId("exam-submit-confirm-button"));

        // The router is mocked, so the session stays mounted and re-reads the
        // store: a submitted attempt shows its finished state.
        expect(screen.getByTestId("exam-session-unavailable")).toHaveTextContent(
          "This attempt is finished.",
          { exact: false },
        );
      });
    });
  });

  describe("Study Mode", () => {
    it("disables Check answer until the response is complete", () => {
      renderSession(freshAttempt("study"));

      expect(screen.getByTestId("exam-check-button")).toBeDisabled();
    });

    it("enables Check answer once the response is complete", () => {
      renderSession(freshAttempt("study"));

      fireEvent.press(screen.getByTestId("exam-choice-A"));

      expect(screen.getByTestId("exam-check-button")).not.toBeDisabled();
    });

    it("shows Incorrect once a wrong single choice is checked", () => {
      renderSession(freshAttempt("study"));

      fireEvent.press(screen.getByTestId("exam-choice-A"));
      fireEvent.press(screen.getByTestId("exam-check-button"));

      expect(screen.getByTestId("exam-study-feedback")).toHaveTextContent("Incorrect", {
        exact: false,
      });
    });

    it("shows the question's whyCorrect once checked", () => {
      renderSession(freshAttempt("study"));

      fireEvent.press(screen.getByTestId("exam-choice-A"));
      fireEvent.press(screen.getByTestId("exam-check-button"));

      expect(
        screen.getByText("The text identifies the holy Scriptures Timothy knew from childhood."),
      ).toBeVisible();
    });

    it("marks the picked wrong choice Your answer, Incorrect, with its rationale", () => {
      renderSession(freshAttempt("study"));

      fireEvent.press(screen.getByTestId("exam-choice-A"));
      fireEvent.press(screen.getByTestId("exam-check-button"));

      const choiceA = screen.getByTestId("exam-choice-A");
      expect(choiceA).toHaveTextContent("Your answer", { exact: false });
      expect(choiceA).toHaveTextContent("Incorrect", { exact: false });
      expect(choiceA).toHaveTextContent("No such collection is named here.", { exact: false });
    });

    it("marks the keyed choice Correct answer, with its rationale", () => {
      renderSession(freshAttempt("study"));

      fireEvent.press(screen.getByTestId("exam-choice-A"));
      fireEvent.press(screen.getByTestId("exam-check-button"));

      const choiceD = screen.getByTestId("exam-choice-D");
      expect(choiceD).toHaveTextContent("Correct answer", { exact: false });
      expect(choiceD).toHaveTextContent("This is what the passage explicitly says.", {
        exact: false,
      });
    });

    it("cannot be changed once checked", () => {
      renderSession(freshAttempt("study"));
      fireEvent.press(screen.getByTestId("exam-choice-A"));
      fireEvent.press(screen.getByTestId("exam-check-button"));

      fireEvent.press(screen.getByTestId("exam-choice-B"));

      expect(screen.getByTestId("exam-choice-A")).toBeSelected();
      expect(screen.getByTestId("exam-choice-B")).not.toBeSelected();
    });

    it("opens the reading sheet from Understand why", () => {
      renderSession(freshAttempt("study"));
      fireEvent.press(screen.getByTestId("exam-choice-A"));
      fireEvent.press(screen.getByTestId("exam-check-button"));

      fireEvent.press(screen.getByTestId("exam-understand-why-button"));

      expect(mockPush).toHaveBeenCalledWith(understandWhyHref(ATTEMPT_ID, qid(1)));
    });

    it("marks a missed correct choice Missed, with its rationale, on multiple select", () => {
      renderSession(freshAttempt("study"));
      goToQuestion(9);

      fireEvent.press(screen.getByTestId("exam-choice-A"));
      fireEvent.press(screen.getByTestId("exam-check-button"));

      const choiceB = screen.getByTestId("exam-choice-B");
      expect(choiceB).toHaveTextContent("Missed", { exact: false });
      expect(choiceB).toHaveTextContent("Doctrine is named in the KJV text.", { exact: false });
    });

    it("shows each prompt's matchFeedback line once a matching question is checked", () => {
      renderSession(freshAttempt("study"));
      goToQuestion(4);

      fireEvent.press(screen.getByTestId("exam-match-P1-R1"));
      fireEvent.press(screen.getByTestId("exam-match-P2-R2"));
      fireEvent.press(screen.getByTestId("exam-match-P3-R3"));
      fireEvent.press(screen.getByTestId("exam-check-button"));

      expect(screen.getByText("Jesus names these groupings in Luke 24:44.")).toBeVisible();
      expect(screen.getByText("Correction is among the uses in 2 Timothy 3:16.")).toBeVisible();
      expect(
        screen.getByText("The Bereans examine the Scriptures daily in Acts 17:11."),
      ).toBeVisible();
    });

    it("shows each step's stepFeedback line once an ordering question is checked", () => {
      renderSession(freshAttempt("study"));
      goToQuestion(11);

      fireEvent.press(screen.getByTestId("exam-order-step-S3"));
      fireEvent.press(screen.getByTestId("exam-order-step-S1"));
      fireEvent.press(screen.getByTestId("exam-order-step-S4"));
      fireEvent.press(screen.getByTestId("exam-order-step-S2"));
      fireEvent.press(screen.getByTestId("exam-check-button"));

      expect(screen.getByText("Verse 46 first states the Messiah’s suffering.")).toBeVisible();
      expect(screen.getByText("Verse 48 calls the disciples witnesses.")).toBeVisible();
    });

    it("labels the last question's Next as See results", () => {
      renderSession(freshAttempt("study"));
      goToQuestion(15);

      expect(screen.getByTestId("exam-next-button")).toHaveTextContent("See results", {
        exact: false,
      });
    });

    it("disables See results while any answer is unchecked (criterion 27)", () => {
      renderSession(freshAttempt("study"));
      goToQuestion(15);

      expect(screen.getByTestId("exam-next-button")).toBeDisabled();
    });

    it("says why See results is unavailable while any answer is unchecked (criterion 27)", () => {
      renderSession(freshAttempt("study"));
      goToQuestion(15);

      expect(screen.getByText("Check every answer to see your results.")).toBeVisible();
    });

    it("enables See results once every answer is checked (criterion 27)", () => {
      renderSession(everyAnswerChecked());
      goToQuestion(15);

      expect(screen.getByTestId("exam-next-button")).toBeEnabled();
    });

    it("finishes the attempt and moves to its results when See results is pressed", () => {
      renderSession(everyAnswerChecked());
      goToQuestion(15);

      fireEvent.press(screen.getByTestId("exam-next-button"));

      expect(mockReplace).toHaveBeenCalledWith(examResultsHref(ATTEMPT_ID));
    });

    it("records the Study attempt as finished in the store when See results is pressed", () => {
      renderSession(everyAnswerChecked());
      goToQuestion(15);

      fireEvent.press(screen.getByTestId("exam-next-button"));

      expect(screen.getByTestId("exam-session-unavailable")).toHaveTextContent(
        "This attempt is finished.",
        { exact: false },
      );
    });
  });

  describe("an attempt already finished", () => {
    const finished = () =>
      withExamAttempt(INITIAL_STATE, {
        attemptId: ATTEMPT_ID,
        completedResult: theologyExamResult(),
      });

    it("says the attempt is finished instead of showing a question", () => {
      renderSession(finished());

      expect(screen.getByTestId("exam-session-unavailable")).toHaveTextContent(
        "This attempt is finished.",
        { exact: false },
      );
    });

    it("moves to its results from See results", () => {
      renderSession(finished());

      fireEvent.press(screen.getByTestId("exam-session-unavailable-button"));

      expect(mockReplace).toHaveBeenCalledWith(examResultsHref(ATTEMPT_ID));
    });
  });
});
