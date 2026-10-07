import { render, screen } from "@tests/helpers/render";
import { quizQuestion } from "@tests/factories/study";

import { QuickCheckQuestion } from "@/features/plans/components/QuickCheckQuestion";
import { lightTheme } from "@/theme/tokens";

const { typography, colors, elevation } = lightTheme;

function renderQuestion(question = quizQuestion()) {
  return render(
    <QuickCheckQuestion
      question={question}
      selectedChoiceId={null}
      answeredChoiceId={null}
      onPick={jest.fn()}
    />,
  );
}

describe("QuickCheckQuestion", () => {
  it("sets the question in the serif, a touch smaller than a screen title", () => {
    renderQuestion();

    expect(screen.getByText("What comes before obedience?")).toHaveStyle(typography.quizQuestion);
    expect(typography.quizQuestion.fontSize).toBeLessThan(typography.screenTitle.fontSize);
  });

  it("heads a verse to finish with its reference in the same serif", () => {
    renderQuestion(
      quizQuestion({
        kind: "finishTheVerse",
        source: "scripture",
        prompt: "For by ___ you have been saved.",
        scriptureReference: "Ephesians 2:8",
      }),
    );

    expect(screen.getByText("Ephesians 2:8")).toHaveStyle(typography.quizQuestion);
  });

  it("keeps the answers in the system face, loosely leaded", () => {
    renderQuestion();

    expect(screen.getByText("Grace")).toHaveStyle(typography.bodyLoose);
  });

  it("raises each answer off the page on a subtle edge, so it reads as something to tap", () => {
    renderQuestion();

    expect(screen.getByTestId("quick-check-choice-a")).toHaveStyle({
      borderColor: colors.containerBorder,
      shadowColor: colors.shadow,
      ...elevation.choice,
    });
  });
});
