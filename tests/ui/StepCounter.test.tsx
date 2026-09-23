import { render, screen } from "@tests/helpers/render";

import { StepCounter } from "@/ui/StepCounter";

describe("StepCounter", () => {
  it("shows its label in the step-counter role", () => {
    render(<StepCounter label="1 of 2" />);

    expect(screen.getByText("1 of 2")).toHaveStyle({ fontSize: 14, color: "#8A8A92" });
  });
});
