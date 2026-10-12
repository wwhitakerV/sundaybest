import { render, screen } from "@tests/helpers/render";

import { studyDayContent } from "@tests/factories/study";
import { ScriptureStep } from "@/features/plans/components/ScriptureStep";
import { lightTheme } from "@/theme/tokens";

describe("ScriptureStep", () => {
  it("sets the day's verses as a quote, a line down their left", () => {
    render(
      <ScriptureStep
        dayNumber={1}
        passage={studyDayContent().scripture}
        onChangeTranslation={jest.fn()}
      />,
    );

    expect(screen.getByTestId("study-scripture-verses-quote")).toHaveStyle({
      borderLeftWidth: 2,
      borderLeftColor: lightTheme.colors.borderStrong,
    });
  });
});
