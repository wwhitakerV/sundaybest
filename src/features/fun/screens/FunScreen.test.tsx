import { render, screen, fireEvent } from "@test/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { FunScreen } from "./FunScreen";

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

describe("FunScreen", () => {
  it("is addressable as fun-screen", () => {
    render(<FunScreen />);

    expect(screen.getByTestId("fun-screen")).toBeVisible();
  });

  it("shows the title", () => {
    render(<FunScreen />);

    expect(screen.getByText("Fun")).toBeVisible();
  });

  it("shows the account icon", () => {
    render(<FunScreen />);

    expect(screen.getByTestId("fun-account-button")).toBeVisible();
  });

  it("navigates to Settings when the account icon is pressed", () => {
    render(<FunScreen />);

    fireEvent.press(screen.getByTestId("fun-account-button"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings");
  });

  it("shows placeholder body text", () => {
    render(<FunScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });
});
