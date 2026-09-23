import { render, screen, fireEvent } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { DailyReminderScreen } from "@/features/settings/screens/DailyReminderScreen";

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

describe("DailyReminderScreen", () => {
  it("is addressable as daily-reminder-screen", () => {
    render(<DailyReminderScreen />);

    expect(screen.getByTestId("daily-reminder-screen")).toBeVisible();
  });

  it("shows the title", () => {
    render(<DailyReminderScreen />);

    expect(screen.getByText("Daily reminder")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    render(<DailyReminderScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("goes back to Settings when Back is pressed", () => {
    render(<DailyReminderScreen />);

    fireEvent.press(screen.getByTestId("daily-reminder-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
