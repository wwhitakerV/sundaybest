import * as Localization from "expo-localization";
import { http, HttpResponse } from "msw";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { act, render, screen, fireEvent, waitFor, within } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL, aReminder } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import { lightTheme } from "@/theme/tokens";
import { DailyReminderScreen } from "@/features/settings/screens/DailyReminderScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockBack = jest.fn<void, []>();

/**
 * The reader's reminders as the server has them, changed by what the screen
 * sends — so a refetch after a change sees it. Returns what was sent.
 */
function serveReminders(initial = aReminder(), { held }: { held?: Promise<void> } = {}) {
  const sent: unknown[] = [];
  let reminder = initial;
  server.use(
    http.get(`${API_URL}/v1/me/reminders`, () => HttpResponse.json({ reminders: [reminder] })),
    http.put(`${API_URL}/v1/me/reminders/dailyStudy`, async ({ request }) => {
      const input = (await request.json()) as Record<string, unknown>;
      sent.push(input);
      await held;
      reminder = { ...reminder, ...input };
      return HttpResponse.json({ reminder });
    }),
  );
  return sent;
}

/** The page, once the reminder has arrived. */
async function showReminder(...args: Parameters<typeof serveReminders>) {
  const sent = serveReminders(...args);
  render(<DailyReminderScreen />);
  await waitFor(() =>
    expect(screen.getByTestId("daily-reminder-enabled")).toHaveProp("accessibilityState", {
      checked: args[0]?.enabled ?? true,
      disabled: false,
    }),
  );
  return sent;
}

/** Opens the time's popover from its pill. */
async function openTime() {
  fireEvent.press(screen.getByTestId("daily-reminder-time"));
  return screen.findByTestId("daily-reminder-time-popover");
}

/** Spins the wheel to a time of day. */
function spinTo(hours: number, minutes: number) {
  const at = new Date();
  at.setHours(hours, minutes, 0, 0);
  fireEvent(screen.getByTestId("daily-reminder-time-picker"), "change", {
    nativeEvent: { timestamp: at.getTime(), utcOffset: 0 },
  });
}

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

beforeEach(() => {
  mockBack.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: mockBack } as unknown as ReturnType<typeof useRouter>);
});

describe("DailyReminderScreen", () => {
  it("is addressable as daily-reminder-screen", () => {
    serveReminders();
    render(<DailyReminderScreen />);

    expect(screen.getByTestId("daily-reminder-screen")).toBeVisible();
  });

  it("shows the title", () => {
    serveReminders();
    render(<DailyReminderScreen />);

    expect(screen.getByText("Daily reminder")).toBeVisible();
  });

  it("goes back to Settings when Back is pressed", () => {
    serveReminders();
    render(<DailyReminderScreen />);

    fireEvent.press(screen.getByTestId("daily-reminder-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  describe("the switch", () => {
    it("is the app's own toggle, on, with the time in its pill", async () => {
      await showReminder();

      expect(screen.getByTestId("daily-reminder-enabled")).toHaveProp(
        "accessibilityRole",
        "switch",
      );
      expect(within(screen.getByTestId("daily-reminder-time")).getByText("6:30 AM")).toBeVisible();
    });

    it("turns the reminder off", async () => {
      const sent = await showReminder();

      fireEvent.press(screen.getByTestId("daily-reminder-enabled"));

      await waitFor(() => expect(sent).toEqual([{ enabled: false }]));
    });

    it("shows nothing below it while the reminder is off", async () => {
      await showReminder(aReminder({ enabled: false }));

      expect(screen.queryByTestId("daily-reminder-time")).toBeNull();
      expect(screen.queryByTestId("daily-reminder-days")).toBeNull();
      expect(screen.queryByText(/Reminders are scheduled on this iPhone/)).toBeNull();
    });

    it("takes the time and days away once the reminder is turned off", async () => {
      const sent = await showReminder();

      fireEvent.press(screen.getByTestId("daily-reminder-enabled"));

      await waitFor(() => expect(sent).toEqual([{ enabled: false }]));
      await waitFor(() => expect(screen.queryByTestId("daily-reminder-days")).toBeNull());
      expect(screen.queryByTestId("daily-reminder-time")).toBeNull();
    });
  });

  describe("the days", () => {
    it("sit in one row, Sunday to Saturday, a letter each", async () => {
      await showReminder();

      const row = screen.getByTestId("daily-reminder-days");
      const letters = within(row)
        .getAllByRole("checkbox")
        .map((day) => within(day).getByText(/^[SMTWF]$/).props.children as string);
      expect(letters).toEqual(DAY_LETTERS);
    });

    it("name each day in full for VoiceOver", async () => {
      await showReminder();

      expect(screen.getByTestId("daily-reminder-days-wed")).toHaveAccessibleName("Wednesday");
    });

    it("say which are picked", async () => {
      await showReminder(aReminder({ days: ["mon", "wed", "fri"] }));

      expect(screen.getByTestId("daily-reminder-days-mon")).toHaveProp("accessibilityState", {
        checked: true,
      });
      expect(screen.getByTestId("daily-reminder-days-sun")).toHaveProp("accessibilityState", {
        checked: false,
      });
    });

    it("ring every day quietly, a picked day's letter red, a day left out grey", async () => {
      await showReminder(aReminder({ days: ["mon"] }));

      for (const day of ["mon", "sun"]) {
        expect(screen.getByTestId(`daily-reminder-days-${day}`)).toHaveStyle({
          borderColor: lightTheme.colors.containerBorder,
        });
      }
      expect(within(screen.getByTestId("daily-reminder-days-mon")).getByText("M")).toHaveStyle({
        ...lightTheme.typography.dayLetter,
        color: lightTheme.colors.accent,
      });
      expect(within(screen.getByTestId("daily-reminder-days-sun")).getByText("S")).toHaveStyle({
        color: lightTheme.colors.textMuted,
      });
    });

    it("take a day out of the reminder's days", async () => {
      const sent = await showReminder();

      fireEvent.press(screen.getByTestId("daily-reminder-days-sat"));

      await waitFor(() =>
        expect(sent).toEqual([{ days: ["sun", "mon", "tue", "wed", "thu", "fri"] }]),
      );
    });

    it("keep the last day picked, so the reminder always has one", async () => {
      const sent = await showReminder(aReminder({ days: ["mon"] }));

      fireEvent.press(screen.getByTestId("daily-reminder-days-mon"));

      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
      expect(sent).toEqual([]);
    });
  });

  describe("the time", () => {
    it("opens our popover with the time's wheel from its pill", async () => {
      await showReminder();

      const popover = await openTime();

      expect(popover).toHaveAccessibleName("Reminder time");
      expect(screen.getByTestId("daily-reminder-time-picker")).toHaveProp("displayIOS", "spinner");
    });

    it("writes the time on the iPhone's 24-hour clock when it's set to one, as the wheel does", async () => {
      jest
        .spyOn(Localization, "getCalendars")
        .mockReturnValue([
          { calendar: null, timeZone: null, firstWeekday: null, uses24hourClock: true },
        ]);
      await showReminder(aReminder({ time: "15:04" }));

      expect(within(screen.getByTestId("daily-reminder-time")).getByText("15:04")).toBeVisible();
    });

    it("writes it on a 12-hour clock otherwise", async () => {
      await showReminder(aReminder({ time: "15:04" }));

      expect(within(screen.getByTestId("daily-reminder-time")).getByText("3:04 PM")).toBeVisible();
    });

    it("fits the popover to the wheel, which iOS sizes itself", async () => {
      await showReminder();

      const popover = await openTime();

      expect(StyleSheet.flatten(popover.props.style as StyleProp<ViewStyle>).width).toBeUndefined();
      expect(screen.getByTestId("daily-reminder-time-picker")).not.toHaveStyle({
        width: expect.any(Number) as number,
      });
    });

    it("saves the time picked once the popover closes", async () => {
      const sent = await showReminder();
      await openTime();

      spinTo(7, 15);
      expect(sent).toEqual([]);
      fireEvent.press(
        screen.getByTestId("daily-reminder-time-popover-scrim", { includeHiddenElements: true }),
      );

      await waitFor(() => expect(sent).toEqual([{ time: "07:15" }]));
    });

    it("sends nothing when the time is left as it was", async () => {
      const sent = await showReminder();
      await openTime();

      fireEvent.press(
        screen.getByTestId("daily-reminder-time-popover-scrim", { includeHiddenElements: true }),
      );

      await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
      expect(sent).toEqual([]);
    });
  });

  it("sets its explanatory note in the darker supporting grey, at regular weight", async () => {
    await showReminder();

    expect(screen.getByText(/Reminders are scheduled on this iPhone/)).toHaveStyle({
      color: lightTheme.colors.textSupporting,
      fontWeight: "400",
    });
  });

  it("keeps every control steady while a change is saving", async () => {
    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const sent = await showReminder(aReminder(), { held });

    fireEvent.press(screen.getByTestId("daily-reminder-days-sat"));
    await waitFor(() => expect(sent).toHaveLength(1));

    expect(screen.getByTestId("daily-reminder-enabled")).toHaveProp("accessibilityState", {
      checked: true,
      disabled: false,
    });
    expect(screen.getByTestId("daily-reminder-time")).not.toBeDisabled();
    expect(screen.getByTestId("daily-reminder-days-sun")).not.toBeDisabled();
    release();
  });
});
