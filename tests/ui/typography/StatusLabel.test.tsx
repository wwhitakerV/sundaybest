import { render, screen } from "@tests/helpers/render";

import { StatusLabel } from "@/ui/typography/StatusLabel";
import { TextSizeScope } from "@/ui/typography/TextSizeScope";
import { lightTheme } from "@/theme/tokens";

// The reader's text size at its largest: everything else in the app grows.
jest.mock("@/ui/typography/use-text-scale", () => ({ useTextScale: () => 1.5 }));

describe("StatusLabel", () => {
  it("draws the time in the status bar's own type", () => {
    render(<StatusLabel variant="time">1</StatusLabel>);

    expect(screen.getByText("1")).toHaveStyle({
      fontFamily: lightTheme.typography.statusBarTime.fontFamily,
      fontSize: lightTheme.typography.statusBarTime.fontSize,
    });
  });

  it("never grows with the reader's text size, as iOS's bar doesn't", () => {
    render(
      <TextSizeScope offset={4}>
        <StatusLabel variant="figures">82</StatusLabel>
      </TextSizeScope>,
    );

    expect(screen.getByText("82")).toHaveStyle({
      fontSize: lightTheme.typography.statusBarFigures.fontSize,
    });
    expect(screen.getByText("82")).toHaveProp("allowFontScaling", false);
  });

  it("sets its figures in italic when asked", () => {
    render(
      <StatusLabel variant="figures" italic>
        37
      </StatusLabel>,
    );

    expect(screen.getByText("37")).toHaveStyle({ fontStyle: "italic" });
  });

  it("takes the tone it's given", () => {
    render(
      <StatusLabel variant="time" tone="statusInkOnDark">
        9
      </StatusLabel>,
    );

    expect(screen.getByText("9")).toHaveStyle({ color: lightTheme.colors.statusInkOnDark });
  });
});
