import { render, screen, fireEvent } from "@test/render";

import { SettingsSubpageHeader } from "./SettingsSubpageHeader";

describe("SettingsSubpageHeader", () => {
  it("shows the given title", () => {
    render(
      <SettingsSubpageHeader testID="a-header" title="Daily reminder" onBack={() => undefined} />,
    );

    expect(screen.getByText("Daily reminder")).toBeVisible();
  });

  it("calls onBack when the back button is pressed", () => {
    const onBack = jest.fn();
    render(<SettingsSubpageHeader testID="a-header" title="Daily reminder" onBack={onBack} />);

    fireEvent.press(screen.getByTestId("a-header-back-button"));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
