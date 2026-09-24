import { render, screen } from "@tests/helpers/render";

import { ProgressLine } from "@/ui/ProgressLine";

describe("ProgressLine", () => {
  it("forwards testID to the outermost view", () => {
    render(<ProgressLine testID="a-progress" durationMs={1000} />);

    expect(screen.getByTestId("a-progress")).toBeVisible();
  });

  it("fills in the accent colour over a divider-coloured track", () => {
    render(<ProgressLine testID="a-progress" durationMs={1000} />);

    expect(screen.getByTestId("a-progress-fill")).toHaveStyle({ backgroundColor: "#D62626" });
  });
});
