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

  it("says under each step what it does, or what it did", () => {
    renderSteps();

    expect(screen.getByText("Heard the whole message.")).toBeVisible();
    expect(screen.getByText("Readings, reflections, and prayers.")).toBeVisible();
  });

  it("parts the steps by room alone, with no lines between them", () => {
    renderSteps();

    expect(screen.queryByTestId("steps-findingScripture-separator")).toBeNull();
  });

  it("fades a step not yet started well back, its name and its line", () => {
    renderSteps();

    expect(screen.getByTestId("steps-buildingQuiz-words")).toHaveStyle({ opacity: 0.35 });
  });

  it("leaves a step under way or done at full strength", () => {
    renderSteps();

    expect(screen.getByTestId("steps-writingDays-words")).not.toHaveStyle({ opacity: 0.35 });
    expect(screen.getByTestId("steps-processingSermon-words")).not.toHaveStyle({ opacity: 0.35 });
  });
});
