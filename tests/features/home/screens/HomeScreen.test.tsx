import { render, screen, fireEvent } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { HomeScreen } from "@/features/home/screens/HomeScreen";

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

describe("HomeScreen", () => {
  it("is addressable as home-tab-screen", () => {
    render(<HomeScreen />);

    expect(screen.getByTestId("home-tab-screen")).toBeVisible();
  });

  it("shows the wordmark", () => {
    render(<HomeScreen />);

    expect(screen.getByText("SUNDAYBEST")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    render(<HomeScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("shows the account icon", () => {
    render(<HomeScreen />);

    expect(screen.getByTestId("home-tab-account-button")).toBeVisible();
  });

  it("navigates to Settings when the account icon is pressed", () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByTestId("home-tab-account-button"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings");
  });

  describe("with no active plan", () => {
    it("shows Add a sermon instead of a plan", () => {
      render(<HomeScreen mockHasActivePlan={false} />);

      expect(screen.getByTestId("home-tab-add-sermon-button")).toBeVisible();
      expect(screen.queryByTestId("home-tab-active-plan")).toBeNull();
    });

    it("navigates to New Plan — Paste Sermon when Add a sermon is pressed", () => {
      render(<HomeScreen mockHasActivePlan={false} />);

      fireEvent.press(screen.getByTestId("home-tab-add-sermon-button"));

      expect(mockPush).toHaveBeenCalledWith("/(plan-creation)/paste-sermon");
    });
  });

  describe("with an active plan", () => {
    it("shows the active plan instead of Add a sermon", () => {
      render(<HomeScreen mockHasActivePlan />);

      expect(screen.getByTestId("home-tab-active-plan")).toBeVisible();
      expect(screen.queryByTestId("home-tab-add-sermon-button")).toBeNull();
    });

    it("navigates to Plan Overview when the active plan is pressed", () => {
      render(<HomeScreen mockHasActivePlan />);

      fireEvent.press(screen.getByTestId("home-tab-active-plan"));

      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: "/(tabs)/plans/[planId]" }),
      );
    });
  });
});
