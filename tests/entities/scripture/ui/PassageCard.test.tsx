import { render, screen } from "@tests/helpers/render";

import { PASSAGE_CARD_RADIUS, PassageCard } from "@/entities/scripture/ui/PassageCard";

describe("PassageCard", () => {
  it("renders the passage inside the element with its testID", () => {
    render(<PassageCard testID="passage">For by grace you have been saved.</PassageCard>);

    expect(screen.getByTestId("passage")).toHaveTextContent("For by grace you have been saved.");
  });

  it("pads the passage 22 across and 18 down", () => {
    render(<PassageCard testID="passage">Grace</PassageCard>);

    const card = screen.getByTestId("passage-card");
    expect(card).toHaveStyle({ paddingHorizontal: 22, paddingVertical: 18 });
  });

  it("rounds its corners at 24", () => {
    render(<PassageCard testID="passage">Grace</PassageCard>);

    expect(PASSAGE_CARD_RADIUS).toBe(24);
    expect(screen.getByTestId("passage-card")).toHaveStyle({ borderRadius: PASSAGE_CARD_RADIUS });
  });
});
