import { render, screen } from "@tests/helpers/render";

import { WelcomeSteps } from "@/features/welcome/components/WelcomeSteps";

describe("WelcomeSteps", () => {
  it("lists every step", () => {
    render(<WelcomeSteps />);

    expect(screen.getByText("Paste any sermon link")).toBeVisible();
    expect(screen.getByText("Get a plan for 1 to 7 days")).toBeVisible();
    expect(screen.getByText("Read, reflect, pray, and quiz")).toBeVisible();
  });
});
