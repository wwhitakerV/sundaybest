import { http, HttpResponse } from "msw";
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL, someSettings } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import { BibleTranslationScreen } from "@/features/settings/screens/BibleTranslationScreen";
import { lightTheme } from "@/theme/tokens";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockBack = jest.fn<void, []>();

beforeEach(() => {
  mockBack.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: mockBack } as unknown as ReturnType<typeof useRouter>);
});

describe("BibleTranslationScreen", () => {
  it("is addressable as bible-translation-screen", () => {
    render(<BibleTranslationScreen />);

    expect(screen.getByTestId("bible-translation-screen")).toBeVisible();
  });

  it("shows the title", () => {
    render(<BibleTranslationScreen />);

    expect(screen.getByText("Bible translation")).toBeVisible();
  });

  it("says what the choice changes", () => {
    render(<BibleTranslationScreen />);

    expect(
      screen.getByText(
        "Scripture in your plans will use this translation whenever that text is available.",
      ),
    ).toBeVisible();
  });

  it("sets what the choice changes in the darker supporting grey", () => {
    render(<BibleTranslationScreen />);

    expect(screen.getByText(/Scripture in your plans will use this translation/)).toHaveStyle({
      color: lightTheme.colors.textSupporting,
    });
  });

  it("marks the translation the reader chose", async () => {
    render(<BibleTranslationScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("bible-translation-options-BSB")).toHaveProp("accessibilityState", {
        checked: true,
        disabled: false,
      }),
    );
  });

  it("saves another translation when it's picked", async () => {
    const sent: unknown[] = [];
    server.use(
      http.patch(`${API_URL}/v1/me/settings`, async ({ request }) => {
        sent.push(await request.json());
        return HttpResponse.json({ settings: someSettings({ bibleTranslation: "KJV" }) });
      }),
    );
    render(<BibleTranslationScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("bible-translation-options-KJV")).toHaveProp("accessibilityState", {
        checked: false,
        disabled: false,
      }),
    );

    fireEvent.press(screen.getByTestId("bible-translation-options-KJV"));

    await waitFor(() => expect(sent).toEqual([{ bibleTranslation: "KJV" }]));
  });

  it("goes back to Settings when Back is pressed", () => {
    render(<BibleTranslationScreen />);

    fireEvent.press(screen.getByTestId("bible-translation-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
