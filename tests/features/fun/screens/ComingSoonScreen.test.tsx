import { render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { ComingSoonScreen } from "@/features/fun/screens/ComingSoonScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockBack = jest.fn<void, []>();

function renderFor(destination: unknown) {
  jest.mocked(useLocalSearchParams).mockReturnValue({ destination } as never);
  return render(<ComingSoonScreen />);
}

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: mockBack } as unknown as ReturnType<typeof useRouter>);
});

describe("ComingSoonScreen", () => {
  it("is addressable as fun-coming-soon-screen", () => {
    renderFor("duel");

    expect(screen.getByTestId("fun-coming-soon-screen")).toBeVisible();
  });

  it("names the game it's standing in for, and says it's coming soon", () => {
    renderFor("daily-trivia");

    expect(screen.getByRole("header", { name: "Daily Trivia" })).toBeVisible();
    expect(screen.getByText("Coming soon")).toBeVisible();
  });

  it("goes back to Fun", () => {
    renderFor("heads-up");

    fireEvent.press(screen.getByTestId("fun-coming-soon-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("says plainly that a destination it doesn't know isn't here", () => {
    renderFor("plans");

    expect(screen.getByText("This isn't here")).toBeVisible();
    expect(screen.queryByText("Coming soon")).toBeNull();
  });
});
