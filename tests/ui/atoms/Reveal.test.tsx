import { render, screen } from "@tests/helpers/render";

import { Reveal } from "@/ui/atoms/Reveal";
import { SFProBody } from "@/ui/typography/SFProBody";

describe("Reveal", () => {
  it("shows what it holds", () => {
    render(
      <Reveal order={0} testID="a-reveal">
        <SFProBody>Remind me at</SFProBody>
      </Reveal>,
    );

    expect(screen.getByTestId("a-reveal")).toBeOnTheScreen();
    expect(screen.getByText("Remind me at")).toBeVisible();
  });

  it("animates in and out, as it mounts and unmounts", () => {
    render(
      <Reveal order={1} testID="a-reveal">
        <SFProBody>Days</SFProBody>
      </Reveal>,
    );

    const view = screen.getByTestId("a-reveal");
    expect(view.props.entering).toBeDefined();
    expect(view.props.exiting).toBeDefined();
  });
});
