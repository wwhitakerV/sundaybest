import { render, screen, fireEvent } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { PlansScreen } from "@/features/plans/screens/PlansScreen";

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

describe("PlansScreen", () => {
  it("is addressable as plans-screen", () => {
    render(<PlansScreen />);

    expect(screen.getByTestId("plans-screen")).toBeVisible();
  });

  it("shows the title", () => {
    render(<PlansScreen />);

    expect(screen.getByText("Plans")).toBeVisible();
  });

  it("shows the account icon", () => {
    render(<PlansScreen />);

    expect(screen.getByTestId("plans-account-button")).toBeVisible();
  });

  it("navigates to Settings when the account icon is pressed", () => {
    render(<PlansScreen />);

    fireEvent.press(screen.getByTestId("plans-account-button"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings");
  });

  it("shows the filter tabs", () => {
    render(<PlansScreen />);

    expect(screen.getByTestId("plans-filter-tabs")).toBeVisible();
    expect(screen.getByText("All")).toBeVisible();
    expect(screen.getByText("In progress")).toBeVisible();
    expect(screen.getByText("Done")).toBeVisible();
    expect(screen.getByText("Saved")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    render(<PlansScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("shows at least one mocked plan item", () => {
    render(<PlansScreen />);

    expect(screen.getAllByTestId(/^plans-item-/).length).toBeGreaterThan(0);
  });

  it("navigates to Plan Overview when a plan item is pressed", () => {
    render(<PlansScreen />);

    const [firstItem] = screen.getAllByTestId(/^plans-item-/);
    if (!firstItem) throw new Error("expected at least one mocked plan item");
    fireEvent.press(firstItem);

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/(tabs)/plans/[planId]" }),
    );
  });
});
