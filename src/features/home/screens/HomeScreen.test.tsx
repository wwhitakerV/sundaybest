import { render, screen } from "@test/render";

import { HomeScreen } from "./HomeScreen";

describe("HomeScreen", () => {
  it("is addressable as home-screen", () => {
    render(<HomeScreen />);

    expect(screen.getByTestId("home-screen")).toBeVisible();
  });

  it("shows the app name", () => {
    render(<HomeScreen />);

    expect(screen.getByText("SundayBest")).toBeVisible();
  });
});
