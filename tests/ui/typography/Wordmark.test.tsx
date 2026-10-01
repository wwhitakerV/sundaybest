import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { Wordmark } from "@/ui/typography/Wordmark";

const { typography, colors } = lightTheme;

describe("Wordmark", () => {
  it("renders the SUNDAYBEST text", () => {
    render(<Wordmark />);

    expect(screen.getByText("SUNDAYBEST")).toBeOnTheScreen();
  });

  it("sets the masthead type", () => {
    render(<Wordmark testID="mark" />);

    expect(screen.getByTestId("mark")).toHaveStyle(typography.masthead);
  });

  it("defaults to the text colour", () => {
    render(<Wordmark testID="mark" />);

    expect(screen.getByTestId("mark")).toHaveStyle({ color: colors.text });
  });
});
