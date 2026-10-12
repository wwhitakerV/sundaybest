import { render, screen } from "@tests/helpers/render";

import { Wordmark } from "@/ui/atoms/Wordmark";

describe("Wordmark", () => {
  it("is the SundayBest mark, named for VoiceOver", () => {
    render(<Wordmark />);

    expect(screen.getByLabelText("SundayBest")).toBeOnTheScreen();
  });

  it("forwards its testID", () => {
    render(<Wordmark testID="mark" />);

    expect(screen.getByTestId("mark")).toBeOnTheScreen();
  });
});
