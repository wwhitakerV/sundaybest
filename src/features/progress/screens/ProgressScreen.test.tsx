import { render, screen, fireEvent } from "@test/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { ProgressScreen } from "./ProgressScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("ProgressScreen", () => {
  it("is addressable as progress-screen", () => {
    render(<ProgressScreen />);

    expect(screen.getByTestId("progress-screen")).toBeVisible();
  });

  it("shows the title", () => {
    render(<ProgressScreen />);

    expect(screen.getByText("Progress")).toBeVisible();
  });

  it("shows the notifications icon", () => {
    render(<ProgressScreen />);

    expect(screen.getByTestId("progress-notifications-button")).toBeVisible();
  });

  it("shows the account icon", () => {
    render(<ProgressScreen />);

    expect(screen.getByTestId("progress-account-button")).toBeVisible();
  });

  it("navigates to Settings when the account icon is pressed", () => {
    render(<ProgressScreen />);

    fireEvent.press(screen.getByTestId("progress-account-button"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings");
  });

  it("shows placeholder body text", () => {
    render(<ProgressScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("shows at least one mocked plan item", () => {
    render(<ProgressScreen />);

    expect(screen.getAllByTestId(/^progress-item-/).length).toBeGreaterThan(0);
  });

  it("navigates to Plan Overview when a plan item is pressed", () => {
    render(<ProgressScreen />);

    const [firstItem] = screen.getAllByTestId(/^progress-item-/);
    if (!firstItem) throw new Error("expected at least one mocked plan item");
    fireEvent.press(firstItem);

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/(tabs)/plans/[planId]" }),
    );
  });
});
