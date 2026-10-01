import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { SFProBody } from "@/ui/typography/SFProBody";
import { TextField } from "@/ui/typography/TextField";

jest.mock("@/ui/typography/use-text-scale", () => ({ useTextScale: () => 1.5 }));

describe("the reader's text size", () => {
  it("scales a line's size and leading together", () => {
    render(
      <SFProBody testID="text" variant="reading">
        Grace
      </SFProBody>,
    );

    expect(screen.getByTestId("text")).toHaveStyle({
      fontSize: lightTheme.typography.reading.fontSize * 1.5,
      lineHeight: lightTheme.typography.reading.lineHeight * 1.5,
    });
  });

  it("scales what's typed into a field the same way", () => {
    render(<TextField testID="field" value="Grace" />);

    expect(screen.getByTestId("field")).toHaveStyle({
      fontSize: lightTheme.typography.body.fontSize * 1.5,
    });
  });
});
