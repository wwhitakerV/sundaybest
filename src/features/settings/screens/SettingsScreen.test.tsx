import { render, screen, fireEvent } from "@test/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { SettingsScreen } from "./SettingsScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("SettingsScreen", () => {
  it("is addressable as settings-screen", () => {
    render(<SettingsScreen />);

    expect(screen.getByTestId("settings-screen")).toBeVisible();
  });

  it("shows the title", () => {
    render(<SettingsScreen />);

    expect(screen.getByText("Settings")).toBeVisible();
  });

  it("shows placeholder body text", () => {
    render(<SettingsScreen />);

    expect(screen.getByText("...")).toBeVisible();
  });

  it("navigates to Daily Reminder when pressed", () => {
    render(<SettingsScreen />);

    fireEvent.press(screen.getByTestId("settings-daily-reminder-row"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/daily-reminder");
  });

  it("navigates to Bible Translation when pressed", () => {
    render(<SettingsScreen />);

    fireEvent.press(screen.getByTestId("settings-bible-translation-row"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/bible-translation");
  });

  it("navigates to Text Size when pressed", () => {
    render(<SettingsScreen />);

    fireEvent.press(screen.getByTestId("settings-text-size-row"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/text-size");
  });

  it("navigates to How Plans Are Made when pressed", () => {
    render(<SettingsScreen />);

    fireEvent.press(screen.getByTestId("settings-how-plans-are-made-row"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/how-plans-are-made");
  });

  it("navigates to Privacy Policy when pressed", () => {
    render(<SettingsScreen />);

    fireEvent.press(screen.getByTestId("settings-privacy-policy-row"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/privacy-policy");
  });

  it("shows a mocked contact support action", () => {
    render(<SettingsScreen />);

    expect(screen.getByTestId("settings-contact-support-row")).toBeVisible();
  });
});
