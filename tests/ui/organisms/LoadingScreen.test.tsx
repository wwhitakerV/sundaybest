import { render, screen } from "@tests/helpers/render";

import { LoadingScreen } from "@/ui/organisms/LoadingScreen";

describe("LoadingScreen", () => {
  it("renders the outermost screen with its testID", () => {
    render(<LoadingScreen />);

    expect(screen.getByTestId("loading-screen")).toBeVisible();
  });

  it("renders the splash wordmark, named for VoiceOver", () => {
    render(<LoadingScreen />);

    expect(screen.getByLabelText("SundayBest")).toBeVisible();
  });

  it("never shows a spinner", () => {
    render(<LoadingScreen />);

    expect(screen.queryByTestId("loading-spinner")).toBeNull();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("applies the themed background colour", () => {
    render(<LoadingScreen />);

    // Light theme background; useColorScheme returns null under test.
    expect(screen.getByTestId("loading-screen")).toHaveStyle({ backgroundColor: "#FFFFFF" });
  });
});
