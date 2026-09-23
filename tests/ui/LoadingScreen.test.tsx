import { render, screen } from "@tests/helpers/render";

import { LoadingScreen } from "@/ui/LoadingScreen";

describe("LoadingScreen", () => {
  it("renders the outermost screen with its testID", () => {
    render(<LoadingScreen />);

    expect(screen.getByTestId("loading-screen")).toBeVisible();
  });

  it("renders the masthead wordmark", () => {
    render(<LoadingScreen />);

    expect(screen.getByText("SUNDAYBEST")).toBeVisible();
  });

  it("renders the spinner", () => {
    render(<LoadingScreen />);

    expect(screen.getByTestId("loading-spinner")).toBeVisible();
  });

  it("applies the themed background colour", () => {
    render(<LoadingScreen />);

    // Light theme background; useColorScheme returns null under test.
    expect(screen.getByTestId("loading-screen")).toHaveStyle({ backgroundColor: "#FFFFFF" });
  });
});
