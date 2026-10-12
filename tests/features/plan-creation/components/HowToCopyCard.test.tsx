import { render, screen } from "@tests/helpers/render";

import { HowToCopyCard } from "@/features/plan-creation/components/HowToCopyCard";

describe("HowToCopyCard", () => {
  it("sets its steps as rows on a list card: 24 corners", () => {
    render(<HowToCopyCard />);

    expect(screen.getByTestId("how-to-copy-card")).toHaveStyle({ borderRadius: 24 });
  });
});
