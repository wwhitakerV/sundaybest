import { render, screen, fireEvent } from "@tests/helpers/render";
import { useLocalSearchParams, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { QuickCheckScreen } from "@/features/plans/screens/QuickCheckScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn<{ planId: string; day: string }, []>(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockDismissTo = jest.fn<void, [ExpoRouter.Href]>();

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush, dismissTo: mockDismissTo } as unknown as ReturnType<
      typeof useRouter
    >);
  jest.mocked(useLocalSearchParams).mockReturnValue({ planId: "plan-three-day", day: "1" });
});

function dayCompleteRoute(): unknown {
  return expect.objectContaining({
    pathname: "/study/[planId]/day-complete",
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining()'s own type is `any` in this Jest version; the assertion itself is fully type-checked at the call site.
    params: expect.objectContaining({ planId: "plan-three-day", day: "1" }),
  });
}

describe("QuickCheckScreen", () => {
  it("is addressable as quick-check-screen", () => {
    render(<QuickCheckScreen />);

    expect(screen.getByTestId("quick-check-screen")).toBeVisible();
  });

  it("opens on the first question with its step context", () => {
    render(<QuickCheckScreen />);

    expect(screen.getByText("Quick check")).toBeVisible();
    expect(screen.getByText("1 of 2")).toBeVisible();
    expect(screen.getByTestId("quick-check-question-body")).toBeVisible();
  });

  it("shows placeholder answer options on the question", () => {
    render(<QuickCheckScreen />);

    expect(screen.getAllByTestId(/^quick-check-question-option-/).length).toBeGreaterThan(0);
  });

  it("advances in place rather than navigating when Check answer is pressed", async () => {
    render(<QuickCheckScreen />);

    fireEvent.press(screen.getByTestId("quick-check-question-check-answer-button"));

    expect(await screen.findByTestId("quick-check-answer-body")).toBeVisible();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("moves the counter to 2 of 2 on the finish-the-verse question", async () => {
    render(<QuickCheckScreen />);

    fireEvent.press(screen.getByTestId("quick-check-question-check-answer-button"));
    fireEvent.press(await screen.findByTestId("quick-check-answer-next-question-button"));

    expect(await screen.findByTestId("quick-check-finish-verse-body")).toBeVisible();
    expect(screen.getByText("2 of 2")).toBeVisible();
  });

  it("returns to Day Complete when Done is pressed on the score", async () => {
    render(<QuickCheckScreen />);

    fireEvent.press(screen.getByTestId("quick-check-question-check-answer-button"));
    fireEvent.press(await screen.findByTestId("quick-check-answer-next-question-button"));
    fireEvent.press(await screen.findByTestId("quick-check-finish-verse-check-answer-button"));
    await screen.findByTestId("quick-check-score-body");
    fireEvent.press(screen.getByTestId("quick-check-score-done-button"));

    expect(mockDismissTo).toHaveBeenCalledWith(dayCompleteRoute());
  });

  it("returns to Day Complete when Close is pressed", () => {
    render(<QuickCheckScreen />);

    fireEvent.press(screen.getByTestId("quick-check-close-button"));

    expect(mockDismissTo).toHaveBeenCalledWith(dayCompleteRoute());
  });
});
