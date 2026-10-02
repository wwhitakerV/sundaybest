import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { AppStoreProvider, INITIAL_STATE } from "@/core/store";
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

function wrapper({ children }: { children: ReactNode }) {
  return <AppStoreProvider>{children}</AppStoreProvider>;
}

beforeEach(() => {
  mockPush.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush } as unknown as ReturnType<typeof useRouter>);
});

describe("useSettingsView", () => {
  it("shows the reminder's time on its row when it's on", () => {
    const { result } = renderHook(() => useSettingsView(), { wrapper });

    const reminder = result.current.sections
      .flatMap(({ rows }) => rows)
      .find(({ testID }) => testID === "settings-daily-reminder-row");
    expect(reminder?.value).toBe("6:30 AM");
  });

  it("shows the chosen Bible translation on its row", () => {
    const { result } = renderHook(() => useSettingsView(), { wrapper });

    const row = result.current.sections
      .flatMap(({ rows }) => rows)
      .find(({ testID }) => testID === "settings-bible-translation-row");
    expect(row?.value).toBe(INITIAL_STATE.settings.bibleTranslation);
  });

  it("groups its rows under Your routine, About, and For churches", () => {
    const { result } = renderHook(() => useSettingsView(), { wrapper });

    expect(result.current.sections.map(({ title }) => title)).toEqual([
      "Your routine",
      "About",
      "For churches",
    ]);
  });

  it("says the app's version, shortened", () => {
    const { result } = renderHook(() => useSettingsView(), { wrapper });

    expect(result.current.version).toBe("1.0");
  });

  it("pushes a row's href on open", () => {
    const { result } = renderHook(() => useSettingsView(), { wrapper });

    act(() => result.current.open("/(tabs)/settings/text-size"));

    expect(mockPush).toHaveBeenCalledWith("/(tabs)/settings/text-size");
  });
});
