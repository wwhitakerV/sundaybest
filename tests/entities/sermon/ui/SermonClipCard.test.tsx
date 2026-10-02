import { render, screen } from "@tests/helpers/render";

import { SERMON_CLIP_RADIUS, SermonClipCard } from "@/entities/sermon/ui/SermonClipCard";

describe("SermonClipCard", () => {
  it("says where the part starts when it is not playing", () => {
    render(<SermonClipCard playing={false} clock="12:34" testID="clip" />);

    expect(screen.getByText("Starts at 12:34")).toBeVisible();
  });

  it("shows the running clock while playing", () => {
    render(<SermonClipCard playing clock="12:35" testID="clip" />);

    expect(screen.getByText("Playing · 12:35")).toBeVisible();
  });

  it("shows its title", () => {
    render(<SermonClipCard playing={false} clock="12:34" testID="clip" />);

    expect(screen.getByText("Hear this part of the sermon")).toBeVisible();
  });

  it("rounds its corners at 36", () => {
    render(<SermonClipCard playing={false} clock="12:34" testID="clip" />);

    expect(SERMON_CLIP_RADIUS).toBe(36);
    expect(screen.getByTestId("clip")).toHaveStyle({ borderRadius: SERMON_CLIP_RADIUS });
  });

  it("animates its play disc with the style it's given, as Welcome's tour presses it", () => {
    render(
      <SermonClipCard playing={false} clock="12:34" discStyle={{ opacity: 0.5 }} testID="clip" />,
    );

    expect(screen.getByTestId("clip-disc")).toHaveStyle({ opacity: 0.5 });
  });

  it("forwards its testID to the card", () => {
    render(<SermonClipCard playing={false} clock="12:34" testID="clip" />);

    expect(screen.getByTestId("clip")).toBeVisible();
  });
});
