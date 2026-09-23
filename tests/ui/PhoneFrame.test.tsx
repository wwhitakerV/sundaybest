import { Text } from "react-native";
import { render, screen } from "@tests/helpers/render";

import { PHONE_FRAME, PhoneFrame } from "@/ui/PhoneFrame";

describe("PhoneFrame", () => {
  it("renders its screen content", () => {
    render(
      <PhoneFrame>
        <Text>a screen</Text>
      </PhoneFrame>,
    );

    expect(screen.getByText("a screen")).toBeVisible();
  });

  it("shows a status bar clock", () => {
    render(<PhoneFrame />);

    expect(screen.getByText("9:41")).toBeVisible();
  });

  it("is drawn at the full phone size, bezel included", () => {
    render(<PhoneFrame testID="a-phone" />);

    expect(screen.getByTestId("a-phone")).toHaveStyle({
      width: PHONE_FRAME.width,
      height: PHONE_FRAME.height,
    });
  });
});
