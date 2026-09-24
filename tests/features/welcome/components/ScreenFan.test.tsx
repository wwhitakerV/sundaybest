import { render, screen } from "@tests/helpers/render";

import { ScreenFan } from "@/features/welcome/components/ScreenFan";
import type { StoryPhase } from "@/features/welcome/logic/story";

// Leaving: every turn played, so every screen shows finished.
const LEAVE: StoryPhase = { kind: "leave" };
const HIDDEN = { includeHiddenElements: true } as const;

describe("ScreenFan", () => {
  it("fans two small phones on each side of the big one", () => {
    render(<ScreenFan testID="a-fan" phase={LEAVE} />);

    expect(screen.getAllByTestId(/^a-fan-side-/, HIDDEN)).toHaveLength(4);
    expect(screen.getByTestId("a-fan-phone", HIDDEN)).toBeTruthy();
  });

  it("builds the screens from real components, not images", () => {
    render(<ScreenFan testID="a-fan" phase={{ kind: "arrive" }} />);

    expect(screen.getAllByText("Paste a sermon link", HIDDEN).length).toBeGreaterThan(0);
  });

  it("arrives on New Plan, the link field still empty", () => {
    render(<ScreenFan testID="a-fan" phase={{ kind: "arrive" }} />);

    expect(screen.getAllByText("Sermon link", HIDDEN).length).toBeGreaterThan(0);
  });

  it("shows how to copy a link under the field", () => {
    render(<ScreenFan testID="a-fan" phase={{ kind: "arrive" }} />);

    expect(screen.getAllByText("Tap Share, then Copy link", HIDDEN).length).toBeGreaterThan(0);
  });

  it("shows the sermon the plan is built from, as in the design", () => {
    render(<ScreenFan testID="a-fan" phase={{ kind: "focus", card: "plan" }} />);

    expect(screen.getAllByText("VOUS Church", HIDDEN).length).toBeGreaterThan(0);
  });

  it("ends on the Quick Check question", () => {
    render(<ScreenFan testID="a-fan" phase={LEAVE} />);

    expect(
      screen.getAllByText("In Joshua 24, what does Joshua ask the people to do?", HIDDEN).length,
    ).toBeGreaterThan(0);
  });

  it("captions the screen on the phone with the step it shows", () => {
    render(<ScreenFan testID="a-fan" phase={{ kind: "focus", card: "plan" }} />);

    expect(screen.getByText("Get a plan for 1 to 7 days", HIDDEN)).toBeTruthy();
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
