import { render, screen, fireEvent } from "@test/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { LinkPreviewScreen } from "./LinkPreviewScreen";

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

describe("LinkPreviewScreen", () => {
  it("is addressable as link-preview-screen", () => {
    render(<LinkPreviewScreen />);

    expect(screen.getByTestId("link-preview-screen")).toBeVisible();
  });

  it("shows the title and step context", () => {
    render(<LinkPreviewScreen />);

    expect(screen.getByText("New plan")).toBeVisible();
    expect(screen.getByText("2 of 2")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    render(<LinkPreviewScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("goes back to New Plan — Paste Sermon when Back is pressed", () => {
    render(<LinkPreviewScreen />);

    fireEvent.press(screen.getByTestId("link-preview-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("navigates to Preparing Plan when Create my plan is pressed", () => {
    render(<LinkPreviewScreen />);

    fireEvent.press(screen.getByTestId("link-preview-create-plan-button"));

    expect(mockPush).toHaveBeenCalledWith("/(plan-creation)/preparing");
  });
});
