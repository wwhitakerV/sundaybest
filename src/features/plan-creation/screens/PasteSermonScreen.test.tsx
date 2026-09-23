import { render, screen, fireEvent } from "@test/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { PasteSermonScreen } from "./PasteSermonScreen";

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

describe("PasteSermonScreen", () => {
  it("is addressable as paste-sermon-screen", () => {
    render(<PasteSermonScreen />);

    expect(screen.getByTestId("paste-sermon-screen")).toBeVisible();
  });

  it("shows the title and step context", () => {
    render(<PasteSermonScreen />);

    expect(screen.getByText("New plan")).toBeVisible();
    expect(screen.getByText("1 of 2")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    render(<PasteSermonScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("dismisses the flow when Close is pressed", () => {
    render(<PasteSermonScreen />);

    fireEvent.press(screen.getByTestId("paste-sermon-close-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("navigates to New Plan — Link Preview when Continue is pressed", () => {
    render(<PasteSermonScreen />);

    fireEvent.press(screen.getByTestId("paste-sermon-continue-button"));

    expect(mockPush).toHaveBeenCalledWith("/(plan-creation)/link-preview");
  });
});
