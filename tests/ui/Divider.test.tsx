import { render, screen } from "@tests/helpers/render";

import { Divider } from "@/ui/Divider";

describe("Divider", () => {
  it("forwards testID to the outermost view", () => {
    render(<Divider testID="a-divider" />);

    expect(screen.getByTestId("a-divider")).toBeVisible();
  });

  it("draws a thin line in the divider colour", () => {
    render(<Divider testID="a-divider" />);

    expect(screen.getByTestId("a-divider")).toHaveStyle({ height: 1, backgroundColor: "#F7F1F1" });
  });
});
