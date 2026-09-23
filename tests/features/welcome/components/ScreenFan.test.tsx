import { render, screen } from "@tests/helpers/render";

import { ScreenFan } from "@/features/welcome/components/ScreenFan";
import type { StoryPhase } from "@/features/welcome/logic/story";

// Leaving: every turn played, so every scene shows finished.
const LEAVE: StoryPhase = { kind: "leave" };

describe("ScreenFan", () => {
  it("deals a card for every step of the story", () => {
    render(<ScreenFan testID="a-fan" phase={LEAVE} />);

    expect(screen.getAllByTestId(/^a-fan-card-/)).toHaveLength(7);
  });

  it("builds the mocks from real screen content, not images", () => {
    render(<ScreenFan testID="a-fan" phase={LEAVE} />);

    expect(screen.getByText("Paste a sermon link", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText("A prayer for today", { includeHiddenElements: true })).toBeTruthy();
  });

  it("shows every scene finished once the last turn is over", () => {
    render(<ScreenFan testID="a-fan" phase={LEAVE} />);

    expect(
      screen.getByText("youtube.com/watch?v=Qm81xRz4", { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it("arrives with the paste field still empty", () => {
    render(<ScreenFan testID="a-fan" phase={{ kind: "arrive" }} />);

    expect(screen.getByText("Sermon link", { includeHiddenElements: true })).toBeTruthy();
  });

  it("shows the sermon the plan is built from, as in the design", () => {
    render(<ScreenFan testID="a-fan" phase={LEAVE} />);

    expect(
      screen.getAllByText("Choose Whom You Will Serve", { includeHiddenElements: true }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("42:18", { includeHiddenElements: true }).length).toBeGreaterThan(0);
  });

  it("captions the card on stage with the step it shows", () => {
    render(<ScreenFan testID="a-fan" phase={{ kind: "focus", card: "plan" }} />);

    expect(
      screen.getByText("Get a plan for 1 to 7 days", { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it("tells VoiceOver the three steps", () => {
    render(<ScreenFan testID="a-fan" phase={LEAVE} />);

    expect(screen.getByTestId("a-fan")).toHaveProp(
      "accessibilityLabel",
      "How SundayBest works: Paste any sermon link. Get a plan for 1 to 7 days. Read, reflect, pray, and quiz.",
    );
  });

  it("reads to VoiceOver as a single image", () => {
    render(<ScreenFan testID="a-fan" phase={LEAVE} />);

    expect(screen.getByTestId("a-fan")).toHaveProp("accessibilityRole", "image");
    expect(screen.getByTestId("a-fan")).toHaveProp("accessible", true);
  });

  it("never takes touches", () => {
    render(<ScreenFan testID="a-fan" phase={LEAVE} />);

    expect(screen.getByTestId("a-fan")).toHaveProp("pointerEvents", "none");
  });
});
