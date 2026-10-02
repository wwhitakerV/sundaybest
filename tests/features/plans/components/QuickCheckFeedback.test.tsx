import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { render, screen } from "@tests/helpers/render";

import { INITIAL_STATE, getQuizQuestions, getQuizzesForPlan } from "@/core/store";
import { QuickCheckFeedback } from "@/features/plans/components/QuickCheckFeedback";
import { PAGE_INSET } from "@/ui/organisms/Screen";

const quiz = getQuizzesForPlan(INITIAL_STATE, "plan-break-the-cycle-of-negative-thinking").at(0);
const question = quiz && getQuizQuestions(INITIAL_STATE, quiz.id).at(0);
/** An iPhone's home indicator. */
const BOTTOM_INSET = 34;
/** How far the panel's edge sits past the screen, so only its curve shows. */
const EDGE = 1;

function renderFeedback(result: "correct" | "incorrect" = "correct") {
  if (!question) throw new Error("The mock data has no Quick Check question.");
  return render(
    <SafeAreaInsetsContext.Provider value={{ top: 0, right: 0, bottom: BOTTOM_INSET, left: 0 }}>
      <QuickCheckFeedback
        result={result}
        question={question}
        action={{ kind: "next", label: "Next", testID: "next-button", enabled: true }}
        onAction={() => undefined}
      />
    </SafeAreaInsetsContext.Provider>,
  );
}

describe("QuickCheckFeedback", () => {
  it("fills down to the screen's bottom edge, under the home indicator", () => {
    renderFeedback();

    expect(screen.getByTestId("quick-check-feedback")).toHaveStyle({
      marginBottom: -(BOTTOM_INSET + EDGE),
      paddingBottom: BOTTOM_INSET + EDGE,
    });
  });

  it("reaches just past both sides of the screen", () => {
    renderFeedback();

    expect(screen.getByTestId("quick-check-feedback")).toHaveStyle({
      marginHorizontal: -(PAGE_INSET + EDGE),
      paddingHorizontal: PAGE_INSET + EDGE,
    });
  });

  it("draws its edge all the way round, so its rounded corners keep it", () => {
    renderFeedback("incorrect");

    expect(screen.getByTestId("quick-check-feedback")).toHaveStyle({ borderWidth: EDGE });
  });
});
