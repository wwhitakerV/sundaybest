import { fireEvent, render, screen } from "@tests/helpers/render";

import { PassageHeading } from "@/entities/scripture/ui/PassageHeading";
import { lightTheme } from "@/theme/tokens";

const { colors } = lightTheme;

describe("PassageHeading", () => {
  it("shows the reference and the translation", () => {
    render(<PassageHeading reference="Ephesians 2:8-10" translation="ESV" testID="heading" />);

    expect(screen.getByText("Ephesians 2:8-10")).toBeVisible();
    expect(screen.getByText("ESV")).toBeVisible();
  });

  it("sets the translation in a pill in the app's soft fill, with a card's edge", () => {
    render(<PassageHeading reference="Ephesians 2:8-10" translation="ESV" testID="heading" />);

    expect(screen.getByTestId("heading-translation")).toHaveStyle({
      borderWidth: 1,
      backgroundColor: colors.surface,
      borderColor: colors.containerBorder,
    });
  });

  it("is the app's inline pill: drawn 36 tall, tapped at 44", () => {
    render(
      <PassageHeading
        reference="Ephesians 2:8-10"
        translation="ESV"
        testID="heading"
        onChangeTranslation={jest.fn()}
      />,
    );

    const pill = screen.getByTestId("heading-translation");
    expect(pill).toHaveStyle({ height: 36 });
    expect(pill.props.hitSlop).toBe(4);
  });

  it("opens the translation to change it when its pill is tapped", () => {
    const onChangeTranslation = jest.fn();
    render(
      <PassageHeading
        reference="Ephesians 2:8-10"
        translation="ESV"
        testID="heading"
        onChangeTranslation={onChangeTranslation}
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Bible translation: ESV" }));

    expect(onChangeTranslation).toHaveBeenCalledTimes(1);
  });

  it("is only a label where there's nowhere to go (Welcome's tour)", () => {
    render(<PassageHeading reference="Ephesians 2:8-10" translation="ESV" testID="heading" />);

    expect(screen.queryByRole("button")).toBeNull();
  });
});
