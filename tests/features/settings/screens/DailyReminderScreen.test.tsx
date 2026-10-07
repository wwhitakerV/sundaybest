import { http, HttpResponse } from "msw";
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL, aReminder } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import { DailyReminderScreen } from "@/features/settings/screens/DailyReminderScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockBack = jest.fn<void, []>();

/** The reader's reminders as the server has them; what the screen sends, recorded. */
function serveReminders(reminder = aReminder()) {
  const sent: unknown[] = [];
  server.use(
    http.get(`${API_URL}/v1/me/reminders`, () => HttpResponse.json({ reminders: [reminder] })),
    http.put(`${API_URL}/v1/me/reminders/dailyStudy`, async ({ request }) => {
      const input = (await request.json()) as Record<string, unknown>;
      sent.push(input);
      return HttpResponse.json({ reminder: { ...reminder, ...input } });
    }),
  );
  return sent;
}

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

  it("shows the reminder on, at its time", async () => {
    serveReminders();
    render(<DailyReminderScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("daily-reminder-enabled")).toHaveProp("value", true),
    );
    expect(screen.getByText("6:30 AM")).toBeVisible();
  });

  it("turns the reminder off", async () => {
    const sent = serveReminders();
    render(<DailyReminderScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("daily-reminder-enabled")).toHaveProp("value", true),
    );

    fireEvent(screen.getByTestId("daily-reminder-enabled"), "valueChange", false);

    await waitFor(() => expect(sent).toEqual([{ enabled: false }]));
  });

  it("takes a day out of the reminder's days", async () => {
    const sent = serveReminders();
    render(<DailyReminderScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("daily-reminder-day-sat")).toHaveProp("accessibilityState", {
        checked: true,
        disabled: false,
      }),
    );

    fireEvent.press(screen.getByTestId("daily-reminder-day-sat"));

    await waitFor(() =>
      expect(sent).toEqual([{ days: ["sun", "mon", "tue", "wed", "thu", "fri"] }]),
    );
  });

  it("goes back to Settings when Back is pressed", () => {
    serveReminders();
    render(<DailyReminderScreen />);

    fireEvent.press(screen.getByTestId("daily-reminder-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
