import { render, screen, fireEvent } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { HowPlansAreMadeScreen } from "@/features/settings/screens/HowPlansAreMadeScreen";

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

describe("HowPlansAreMadeScreen", () => {
  it("is addressable as how-plans-are-made-screen", () => {
    render(<HowPlansAreMadeScreen />);

    expect(screen.getByTestId("how-plans-are-made-screen")).toBeVisible();
  });

  it("shows the title", () => {
    render(<HowPlansAreMadeScreen />);

    expect(screen.getByText("How plans are made")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    render(<HowPlansAreMadeScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("goes back to Settings when Back is pressed", () => {
    render(<HowPlansAreMadeScreen />);

    fireEvent.press(screen.getByTestId("how-plans-are-made-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
