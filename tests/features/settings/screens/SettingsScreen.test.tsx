import { http, HttpResponse } from "msw";
import { render, screen, fireEvent } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL, aReminder, someSettings } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import { SettingsScreen } from "@/features/settings/screens/SettingsScreen";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.0" } },
}));

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

beforeEach(() => {
  mockPush.mockClear();
  server.use(
    http.get(`${API_URL}/v1/me/reminders`, () => HttpResponse.json({ reminders: [aReminder()] })),
  );
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

  it("groups its rows under Your routine, About, and For churches", async () => {
    render(<SettingsScreen />);

    for (const title of ["Your routine", "About", "For churches"]) {
      expect(await screen.findByText(title)).toBeVisible();
    }
  });

  it("says each routine setting's value beside it", async () => {
    render(<SettingsScreen />);

    expect(await screen.findByTestId("settings-bible-translation-row")).toHaveTextContent(
      someSettings().bibleTranslation,
      { exact: false },
    );
    expect(screen.getByTestId("settings-daily-reminder-row")).toHaveTextContent(/6:30 AM/);
    expect(screen.getByTestId("settings-text-size-row")).toHaveTextContent(/Text size/);
  });

  it("offers churches a way to ask for a sermon's removal", async () => {
    render(<SettingsScreen />);

    expect(await screen.findByTestId("settings-sermon-removal-row")).toHaveTextContent(
      "Request sermon removal",
    );
  });

  it("says which version of SundayBest this is, at its foot", () => {
    render(<SettingsScreen />);

    expect(screen.getByTestId("settings-version")).toHaveTextContent("SundayBest 1.0");
  });

  it("navigates to Daily Reminder when pressed", async () => {
    render(<SettingsScreen />);

    fireEvent.press(await screen.findByTestId("settings-daily-reminder-row"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/daily-reminder");
  });

  it("navigates to Bible Translation when pressed", async () => {
    render(<SettingsScreen />);

    fireEvent.press(await screen.findByTestId("settings-bible-translation-row"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/bible-translation");
  });

  it("navigates to Text Size when pressed", async () => {
    render(<SettingsScreen />);

    fireEvent.press(await screen.findByTestId("settings-text-size-row"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/text-size");
  });

  it("navigates to How Plans Are Made when pressed", async () => {
    render(<SettingsScreen />);

    fireEvent.press(await screen.findByTestId("settings-how-plans-are-made-row"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/how-plans-are-made");
  });

  it("navigates to Privacy Policy when pressed", async () => {
    render(<SettingsScreen />);

    fireEvent.press(await screen.findByTestId("settings-privacy-policy-row"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/privacy-policy");
  });

  it("shows a mocked contact support action", async () => {
    render(<SettingsScreen />);

    expect(await screen.findByTestId("settings-contact-support-row")).toBeVisible();
  });

  it("shows its rows' shape while the settings are on their way", () => {
    render(<SettingsScreen />);

    expect(screen.getByTestId("settings-loading")).toBeOnTheScreen();
  });

  it("says so, with a way to try again, when the settings can't be reached", async () => {
    server.use(
      http.get(`${API_URL}/v1/me/settings`, () =>
        HttpResponse.json({ error: { code: "NOT_FOUND", message: "Gone" } }, { status: 404 }),
      ),
    );
    render(<SettingsScreen />);

    expect(await screen.findByText("Couldn’t load your preferences.")).toBeVisible();
    expect(screen.getByTestId("settings-retry")).toBeVisible();
  });
});
