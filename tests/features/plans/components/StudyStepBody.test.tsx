import { render, screen } from "@tests/helpers/render";
import { studyDayContent } from "@tests/factories/study";

import { StudyEnterProvider } from "@/features/plans/components/StudyEnter";
import { StudyStepBody } from "@/features/plans/components/StudyStepBody";
import type { StudyStepKey } from "@/features/plans/logic/study-steps";
import { motion } from "@/theme";

const STEPS: StudyStepKey[] = ["read", "scripture", "reflect", "pray"];

function renderStep(stepKey: StudyStepKey, withProvider = true) {
  const body = (
    <StudyStepBody
      stepKey={stepKey}
      page={0}
      content={studyDayContent()}
      answerFor={() => ""}
      onAnswerChange={jest.fn()}
    />
  );
  return render(
    withProvider ? <StudyEnterProvider still={false}>{body}</StudyEnterProvider> : body,
  );
}

describe("StudyStepBody", () => {
  it.each(STEPS)("brings every part of the %s step in, one after another", (step) => {
    renderStep(step);

    for (const order of [0, 1, 2]) {
      expect(screen.getByTestId(`study-enter-${order}`)).toHaveStyle({
        animationDuration: motion.pageEnter.durationMs,
        animationDelay: order * motion.pageEnter.staggerMs,
      });
    }
  });

  it("shows a step as it is outside the Daily Study", () => {
    renderStep("read", false);

    expect(screen.getByText("Grace is received")).toBeVisible();
    expect(screen.queryByTestId("study-enter-0")).toBeNull();
  });
});
