import { Text } from "react-native";
import { render, screen } from "@tests/helpers/render";

import { FadeInView } from "@/ui/FadeInView";

// The fade itself runs natively; Jest's Reanimated mock doesn't play entering
// animations, so these assert what's rendered once it has appeared.
describe("FadeInView", () => {
  it("shows its children", () => {
    render(
      <FadeInView>
        <Text>Your days</Text>
      </FadeInView>,
    );

    expect(screen.getByText("Your days")).toBeVisible();
  });

  it("is addressable by the testID it's given, and takes the caller's layout", () => {
    render(<FadeInView testID="a-fade" style={{ flex: 1 }} />);

    expect(screen.getByTestId("a-fade")).toHaveStyle({ flex: 1 });
  });
});
