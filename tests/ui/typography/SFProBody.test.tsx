import { render, screen } from "@tests/helpers/render";

import { lightTheme } from "@/theme/tokens";
import { SFProBody } from "@/ui/typography/SFProBody";

const { typography, colors } = lightTheme;

describe("SFProBody", () => {
  it("defaults to the body variant", () => {
    render(<SFProBody testID="text">Hello</SFProBody>);

    expect(screen.getByTestId("text")).toHaveStyle(typography.body);
  });

  it.each([
    ["body", "body"],
    ["bodyLoose", "bodyLoose"],
    ["listItem", "listItem"],
    ["label", "label"],
    ["reading", "reading"],
    ["detail", "cardDetail"],
  ] as const)("sets the %s variant in the %s token", (variant, token) => {
    render(
      <SFProBody testID="text" variant={variant}>
        Hello
      </SFProBody>,
    );

    const expected = new Map(Object.entries(typography)).get(token);
    expect(expected).toBeDefined();
    expect(screen.getByTestId("text")).toHaveStyle(expected);
  });

  it("shows its children", () => {
    render(<SFProBody>Hello there</SFProBody>);

    expect(screen.getByText("Hello there")).toBeOnTheScreen();
  });

  it("defaults to the text colour", () => {
    render(<SFProBody testID="text">Hello</SFProBody>);

    expect(screen.getByTestId("text")).toHaveStyle({ color: colors.text });
  });

  it("takes the colour of a non-default tone", () => {
    render(
      <SFProBody testID="text" tone="textMuted">
        Hello
      </SFProBody>,
    );

    expect(screen.getByTestId("text")).toHaveStyle({ color: colors.textMuted });
  });

  it("applies a layout style on top of the variant", () => {
    render(
      <SFProBody testID="text" style={{ marginTop: 4 }}>
        Hello
      </SFProBody>,
    );

    expect(screen.getByTestId("text")).toHaveStyle({ marginTop: 4, ...typography.body });
  });

  it("forwards numberOfLines", () => {
    render(
      <SFProBody testID="text" numberOfLines={2}>
        Hello
      </SFProBody>,
    );

    expect(screen.getByTestId("text").props.numberOfLines).toBe(2);
  });

  it("forwards accessibilityRole and accessibilityLabel", () => {
    render(
      <SFProBody testID="text" accessibilityRole="header" accessibilityLabel="Greeting">
        Hello
      </SFProBody>,
    );

    expect(screen.getByRole("header", { name: "Greeting" })).toBeOnTheScreen();
  });
});
