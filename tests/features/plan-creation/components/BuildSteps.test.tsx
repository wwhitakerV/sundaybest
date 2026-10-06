import { render, screen } from "@tests/helpers/render";

import { BuildSteps } from "@/features/plan-creation/components/BuildSteps";
import { getBuildSteps } from "@/features/plan-creation/logic/build-steps";
import { lightTheme } from "@/theme/tokens";

function renderSteps() {
  return render(<BuildSteps testID="steps" steps={getBuildSteps("writingDays", 5, true)} />);
}

describe("BuildSteps", () => {
  it("lists every step in order", () => {
    renderSteps();

    expect(screen.getByText("Listening to the message")).toBeVisible();
    expect(screen.getByText("Writing your 5 days")).toBeVisible();
    expect(screen.getByText("Building your quiz")).toBeVisible();
  });

  it("fills a finished step's mark with the accent, checked", () => {
    renderSteps();

    expect(screen.getByTestId("steps-processingSermon-mark")).toHaveStyle({
      backgroundColor: lightTheme.colors.accent,
    });
    expect(screen.getByTestId("steps-processingSermon")).toHaveProp("accessibilityState", {
      busy: false,
      checked: true,
    });
  });

  it("spins on the step under way", () => {
    renderSteps();

    expect(screen.getByTestId("steps-writingDays-spinner")).toBeOnTheScreen();
    expect(screen.getByTestId("steps-writingDays")).toBeBusy();
  });

  it("leaves a step still to come an empty ring", () => {
    renderSteps();

    expect(screen.getByTestId("steps-buildingQuiz-mark")).toHaveStyle({
      backgroundColor: "transparent",
      borderColor: lightTheme.colors.sequenceLine,
    });
    expect(screen.queryByTestId("steps-buildingQuiz-spinner")).toBeNull();
  });
});
