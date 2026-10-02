import { render, screen } from "@tests/helpers/render";

import { PassageHeading } from "@/entities/scripture/ui/PassageHeading";
import { lightTheme } from "@/theme/tokens";

describe("PassageHeading", () => {
  it("shows the reference and the translation", () => {
    render(<PassageHeading reference="Ephesians 2:8-10" translation="ESV" testID="heading" />);

    expect(screen.getByText("Ephesians 2:8-10")).toBeVisible();
    expect(screen.getByText("ESV")).toBeVisible();
  });

  it("sets the translation in a pill with a hairline border", () => {
    render(<PassageHeading reference="Ephesians 2:8-10" translation="ESV" testID="heading" />);

    expect(screen.getByTestId("heading-translation")).toHaveStyle({
      borderWidth: 1,
      borderColor: lightTheme.colors.divider,
    });
  });
});
