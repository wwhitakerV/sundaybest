import { render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { QuickCheckFinishVerseScreen } from "@/features/plans/screens/QuickCheckFinishVerseScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn<{ planId: string; day: string }, []>(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-three-day", day: "1" });
});

describe("QuickCheckFinishVerseScreen", () => {
  it("is addressable as quick-check-finish-verse-screen", () => {
    render(<QuickCheckFinishVerseScreen />);

    expect(screen.getByTestId("quick-check-finish-verse-screen")).toBeVisible();
  });

  it("shows the title and step context", () => {
    render(<QuickCheckFinishVerseScreen />);

    expect(screen.getByText("Quick check")).toBeVisible();
    expect(screen.getByText("2 of 2")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    render(<QuickCheckFinishVerseScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("shows placeholder answer options", () => {
    render(<QuickCheckFinishVerseScreen />);

    expect(screen.getAllByTestId(/^quick-check-finish-verse-option-/).length).toBeGreaterThan(0);
  });

  it("navigates to Quick Check — Score when Check answer is pressed", () => {
    render(<QuickCheckFinishVerseScreen />);

    fireEvent.press(screen.getByTestId("quick-check-finish-verse-check-answer-button"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(tabs)/plans/[planId]/quick-check/score",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
        params: expect.objectContaining({ planId: "plan-three-day", day: "1" }),
      }),
    );
  });

  it("navigates to Day Complete when Close is pressed", () => {
    render(<QuickCheckFinishVerseScreen />);

    fireEvent.press(screen.getByTestId("quick-check-finish-verse-close-button"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(tabs)/plans/[planId]/day-complete",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
        params: expect.objectContaining({ planId: "plan-three-day", day: "1" }),
      }),
    );
  });
});
