import { render, screen, fireEvent } from "@test/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { BibleTranslationScreen } from "./BibleTranslationScreen";

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

describe("BibleTranslationScreen", () => {
  it("is addressable as bible-translation-screen", () => {
    render(<BibleTranslationScreen />);

    expect(screen.getByTestId("bible-translation-screen")).toBeVisible();
  });

  it("shows the title", () => {
    render(<BibleTranslationScreen />);

    expect(screen.getByText("Bible translation")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    render(<BibleTranslationScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("goes back to Settings when Back is pressed", () => {
    render(<BibleTranslationScreen />);

    fireEvent.press(screen.getByTestId("bible-translation-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
