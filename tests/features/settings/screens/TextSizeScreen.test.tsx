import { render, screen, fireEvent } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { TextSizeScreen } from "@/features/settings/screens/TextSizeScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockBack = jest.fn<void, []>();

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: mockBack } as unknown as ReturnType<typeof useRouter>);
});

describe("TextSizeScreen", () => {
  it("is addressable as text-size-screen", () => {
    render(<TextSizeScreen />);

    expect(screen.getByTestId("text-size-screen")).toBeVisible();
  });

  it("shows the title", () => {
    render(<TextSizeScreen />);

    expect(screen.getByText("Text size")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    render(<TextSizeScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("goes back to Settings when Back is pressed", () => {
    render(<TextSizeScreen />);

    fireEvent.press(screen.getByTestId("text-size-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
