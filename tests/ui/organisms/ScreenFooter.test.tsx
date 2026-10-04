import { Text } from "react-native";
import { render, screen, within } from "@tests/helpers/render";

import { FOOTER_BOTTOM, ScreenFooter } from "@/ui/organisms/ScreenFooter";

describe("ScreenFooter", () => {
  it("renders its children", () => {
    render(
      <ScreenFooter testID="a-footer">
        <Text>A button</Text>
      </ScreenFooter>,
    );

    expect(within(screen.getByTestId("a-footer")).getByText("A button")).toBeVisible();
  });

  it("puts 12pt between buttons and FOOTER_BOTTOM under the last", () => {
    render(
      <ScreenFooter testID="a-footer">
        <Text>A button</Text>
      </ScreenFooter>,
    );

    expect(screen.getByTestId("a-footer")).toHaveStyle({ gap: 12, paddingBottom: FOOTER_BOTTOM });
  });

  it("leaves no room under the last button", () => {
    expect(FOOTER_BOTTOM).toBe(0);
  });

  it("applies extra layout style", () => {
    render(
      <ScreenFooter testID="a-footer" style={{ marginTop: 7 }}>
        <Text>A button</Text>
      </ScreenFooter>,
    );

    expect(screen.getByTestId("a-footer")).toHaveStyle({ marginTop: 7 });
  });
});
