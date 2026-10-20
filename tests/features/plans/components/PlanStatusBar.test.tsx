import { render, screen } from "@tests/helpers/render";

import { PlanStatusBar } from "@/features/plans/components/PlanStatusBar";
import { StatusBarTone } from "@/ui/organisms/status-bar/tone";

describe("PlanStatusBar", () => {
  it("asks for the light status bar over a dark sermon colour", () => {
    render(<PlanStatusBar overPage={false} light />);

    expect(screen.UNSAFE_getByType(StatusBarTone).props).toEqual({ light: true });
  });

  it("asks for the dark one over a light sermon colour", () => {
    render(<PlanStatusBar overPage={false} light={false} />);

    expect(screen.UNSAFE_getByType(StatusBarTone).props).toEqual({ light: false });
  });

  it("asks for the dark one once the page is under it", () => {
    render(<PlanStatusBar overPage light />);

    expect(screen.UNSAFE_getByType(StatusBarTone).props).toEqual({ light: false });
  });
});
