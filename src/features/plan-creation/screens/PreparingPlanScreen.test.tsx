import { render, screen, fireEvent } from "@test/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { PreparingPlanScreen } from "./PreparingPlanScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockBack = jest.fn<void, []>();

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({
    push: mockPush,
    back: mockBack,
  } as unknown as ReturnType<typeof useRouter>);
});

describe("PreparingPlanScreen", () => {
  it("is addressable as preparing-plan-screen", () => {
    render(<PreparingPlanScreen />);

    expect(screen.getByTestId("preparing-plan-screen")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    render(<PreparingPlanScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("dismisses the flow when Close is pressed", () => {
    render(<PreparingPlanScreen />);

    fireEvent.press(screen.getByTestId("preparing-plan-close-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("navigates to Plan Ready when Continue is pressed", () => {
    render(<PreparingPlanScreen />);

    fireEvent.press(screen.getByTestId("preparing-plan-continue-button"));

    expect(mockPush).toHaveBeenCalledWith("/(plan-creation)/ready");
  });
});
