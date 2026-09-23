import { render, screen, fireEvent } from "@test/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { PlanCompleteScreen } from "./PlanCompleteScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-one-day" });
});

describe("PlanCompleteScreen", () => {
  it("is addressable as plan-complete-screen", () => {
    render(<PlanCompleteScreen />);

    expect(screen.getByTestId("plan-complete-screen")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    render(<PlanCompleteScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("navigates to Plans when the Plans action is pressed", () => {
    render(<PlanCompleteScreen />);

    fireEvent.press(screen.getByTestId("plan-complete-plans-button"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/plans");
  });

  it("navigates to New Plan — Paste Sermon when the add-sermon action is pressed", () => {
    render(<PlanCompleteScreen />);

    fireEvent.press(screen.getByTestId("plan-complete-add-sermon-button"));

    expect(mockPush).toHaveBeenCalledWith("/(plan-creation)/paste-sermon");
  });

  it("navigates to Home when the Home action is pressed", () => {
    render(<PlanCompleteScreen />);

    fireEvent.press(screen.getByTestId("plan-complete-home-button"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/home");
  });

  it("shows a mocked share action", () => {
    render(<PlanCompleteScreen />);

    expect(screen.getByTestId("plan-complete-share-button")).toBeVisible();
  });
});
