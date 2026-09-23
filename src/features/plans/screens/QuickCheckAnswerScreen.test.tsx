import { render, screen, fireEvent } from "@test/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { QuickCheckAnswerScreen } from "./QuickCheckAnswerScreen";

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

describe("QuickCheckAnswerScreen", () => {
  it("is addressable as quick-check-answer-screen", () => {
    render(<QuickCheckAnswerScreen />);

    expect(screen.getByTestId("quick-check-answer-screen")).toBeVisible();
  });

  it("shows the title and step context", () => {
    render(<QuickCheckAnswerScreen />);

    expect(screen.getByText("Quick check")).toBeVisible();
    expect(screen.getByText("1 of 2")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    render(<QuickCheckAnswerScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("navigates to Quick Check — Finish Verse when Next question is pressed", () => {
    render(<QuickCheckAnswerScreen />);

    fireEvent.press(screen.getByTestId("quick-check-answer-next-question-button"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(tabs)/plans/[planId]/quick-check/finish-verse",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
        params: expect.objectContaining({ planId: "plan-three-day", day: "1" }),
      }),
    );
  });

  it("navigates to Day Complete when Close is pressed", () => {
    render(<QuickCheckAnswerScreen />);

    fireEvent.press(screen.getByTestId("quick-check-answer-close-button"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(tabs)/plans/[planId]/day-complete",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
        params: expect.objectContaining({ planId: "plan-three-day", day: "1" }),
      }),
    );
  });
});
