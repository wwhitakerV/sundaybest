import { render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { QuickCheckQuestionScreen } from "@/features/plans/screens/QuickCheckQuestionScreen";

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

describe("QuickCheckQuestionScreen", () => {
  it("is addressable as quick-check-question-screen", () => {
    render(<QuickCheckQuestionScreen />);

    expect(screen.getByTestId("quick-check-question-screen")).toBeVisible();
  });

  it("shows the title and step context", () => {
    render(<QuickCheckQuestionScreen />);

    expect(screen.getByText("Quick check")).toBeVisible();
    expect(screen.getByText("1 of 2")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    render(<QuickCheckQuestionScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("shows placeholder answer options", () => {
    render(<QuickCheckQuestionScreen />);

    expect(screen.getAllByTestId(/^quick-check-question-option-/).length).toBeGreaterThan(0);
  });

  it("navigates to Quick Check — Answer when Check answer is pressed", () => {
    render(<QuickCheckQuestionScreen />);

    fireEvent.press(screen.getByTestId("quick-check-question-check-answer-button"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(tabs)/plans/[planId]/quick-check/answer",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
        params: expect.objectContaining({ planId: "plan-three-day", day: "1" }),
      }),
    );
  });

  it("navigates to Day Complete when Close is pressed", () => {
    render(<QuickCheckQuestionScreen />);

    fireEvent.press(screen.getByTestId("quick-check-question-close-button"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(tabs)/plans/[planId]/day-complete",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
        params: expect.objectContaining({ planId: "plan-three-day", day: "1" }),
      }),
    );
  });
});
