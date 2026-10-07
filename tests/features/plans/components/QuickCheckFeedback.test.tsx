import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { render, screen } from "@tests/helpers/render";

import { INITIAL_STATE, getQuizQuestions, getQuizzesForPlan } from "@/core/store";
import { QuickCheckFeedback } from "@/features/plans/components/QuickCheckFeedback";
import { FLOATING_NAV_BAR, getFloatingNavBarBottom } from "@/ui/organisms/floatingNavBar";

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
  it("keeps its way on where the tab bar's pill sits, above the home indicator", () => {
    renderFeedback();

    expect(screen.getByTestId("quick-check-feedback")).toHaveStyle({
      marginBottom: -EDGE,
      paddingBottom: getFloatingNavBarBottom(BOTTOM_INSET) + EDGE,
    });
  });

  it("reaches just past both sides, its button in from them as the pill is", () => {
    renderFeedback();

    expect(screen.getByTestId("quick-check-feedback")).toHaveStyle({
      marginHorizontal: -EDGE,
      paddingHorizontal: FLOATING_NAV_BAR.sideMargin + EDGE,
    });
  });

  it("draws its edge all the way round, so its rounded corners keep it", () => {
    renderFeedback("incorrect");

    expect(screen.getByTestId("quick-check-feedback")).toHaveStyle({ borderWidth: EDGE });
  });
});
