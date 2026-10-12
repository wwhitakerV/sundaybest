import { render, screen } from "@tests/helpers/render";

import { space } from "@/theme";
import { lightTheme } from "@/theme/tokens";
import { PassageCard } from "@/entities/scripture/ui/PassageCard";

describe("PassageCard", () => {
  it("renders the passage inside the element with its testID", () => {
    render(<PassageCard testID="passage">For by grace you have been saved.</PassageCard>);

    expect(screen.getByTestId("passage")).toHaveTextContent("For by grace you have been saved.");
  });

  it("sets the passage as a quote: a 2pt line down its left in the strong grey, its words 16pt in", () => {
    render(<PassageCard testID="passage">Grace</PassageCard>);

    expect(screen.getByTestId("passage-quote")).toHaveStyle({
      borderLeftWidth: 2,
      borderLeftColor: lightTheme.colors.borderStrong,
      paddingLeft: space[16],
    });
  });

  it("sits on the page with no card behind it", () => {
    render(<PassageCard testID="passage">Grace</PassageCard>);

    expect(screen.queryByTestId("passage-card")).toBeNull();
    expect(screen.getByTestId("passage-quote")).not.toHaveStyle({ borderRadius: 24 });
  });

  it("drops the line when bare, for a preview set on its own grey", () => {
    render(
      <PassageCard testID="passage" bare>
        Grace
      </PassageCard>,
    );

    expect(screen.queryByTestId("passage-quote")).toBeNull();
    expect(screen.getByTestId("passage")).toHaveTextContent("Grace");
  });
});
