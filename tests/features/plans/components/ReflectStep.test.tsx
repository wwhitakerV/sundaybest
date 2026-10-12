import { render, screen } from "@tests/helpers/render";

import { ReflectStep } from "@/features/plans/components/ReflectStep";
import { lightTheme } from "@/theme/tokens";

describe("ReflectStep", () => {
  it("answers in the app's text box: soft grey inside the white question card", () => {
    render(
      <ReflectStep
        dayNumber={1}
        title="Bring Your Pain to God"
        reflection={{ id: "r-1", order: 1, question: "Where did you see grace today?" }}
        total={2}
        answer=""
        onAnswerChange={jest.fn()}
      />,
    );

    expect(screen.getByTestId("study-reflect-answer-1")).toHaveStyle({
      backgroundColor: lightTheme.colors.surface,
      borderColor: lightTheme.colors.containerBorder,
    });
  });
});
