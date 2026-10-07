import { http, HttpResponse } from "msw";
import { act, renderHook, waitFor } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL, aReminder, someSettings } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import { useSettingsView } from "@/features/settings/hooks/use-settings-view";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.0" } },
}));

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();

/** Settings' view, once the reader's settings and reminder have come from the server. */
async function renderLoaded() {
  const view = renderHook(() => useSettingsView());
  await waitFor(() => expect(view.result.current.sections).not.toBeNull());
  return view;
}

/** Every row in every section, once loaded. */
function rowsOf(result: { current: ReturnType<typeof useSettingsView> }) {
  return (result.current.sections ?? []).flatMap(({ rows }) => rows);
}

beforeEach(() => {
  server.use(
    http.get(`${API_URL}/v1/me/reminders`, () => HttpResponse.json({ reminders: [aReminder()] })),
  );
  mockPush.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("useSettingsView", () => {
  it("shows the reminder's time on its row when it's on", async () => {
    const { result } = await renderLoaded();

    const reminder = rowsOf(result).find(({ testID }) => testID === "settings-daily-reminder-row");
    expect(reminder?.value).toBe("6:30 AM");
  });

  it("shows the chosen Bible translation on its row", async () => {
    const { result } = await renderLoaded();

    const row = rowsOf(result).find(({ testID }) => testID === "settings-bible-translation-row");
    expect(row?.value).toBe(someSettings().bibleTranslation);
  });

  it("groups its rows under Your routine, About, and For churches", async () => {
    const { result } = await renderLoaded();

    expect((result.current.sections ?? []).map(({ title }) => title)).toEqual([
      "Your routine",
      "About",
      "For churches",
    ]);
  });

  it("says the app's version, shortened", () => {
    const { result } = renderHook(() => useSettingsView());

    expect(result.current.version).toBe("1.0");
  });

  it("pushes a row's href on open", () => {
    const { result } = renderHook(() => useSettingsView());

    act(() => result.current.open("/(tabs)/settings/text-size"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/text-size");
  });

  it("is waiting, with no sections, until the settings arrive", () => {
    const { result } = renderHook(() => useSettingsView());

    expect(result.current.sections).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it("leaves the reminder's row without a time while it's off", async () => {
    server.use(
      http.get(`${API_URL}/v1/me/reminders`, () =>
        HttpResponse.json({ reminders: [aReminder({ enabled: false })] }),
      ),
    );
    const { result } = await renderLoaded();

    const reminder = rowsOf(result).find(({ testID }) => testID === "settings-daily-reminder-row");
    expect(reminder?.value).not.toBe("6:30 AM");
  });

  it("says it failed, and tries again, when the settings can't be reached", async () => {
    server.use(
      http.get(`${API_URL}/v1/me/settings`, () =>
        HttpResponse.json({ error: { code: "INTERNAL", message: "Down" } }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useSettingsView());

    await waitFor(() => expect(result.current.failed).toBe(true), { timeout: 10000 });
  });
});
