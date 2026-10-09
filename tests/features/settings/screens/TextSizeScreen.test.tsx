import { http, HttpResponse } from "msw";
import { StyleSheet, type StyleProp, type TextStyle } from "react-native";
import { render, screen, fireEvent, waitFor, within } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL, someSettings } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import { TextSizeScreen } from "@/features/settings/screens/TextSizeScreen";
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

describe("TextSizeScreen", () => {
  it("is addressable as text-size-screen", () => {
    render(<TextSizeScreen />);

    expect(screen.getByTestId("text-size-screen")).toBeVisible();
  });

  it("shows the title", () => {
    render(<TextSizeScreen />);

    expect(screen.getByText("Text size")).toBeVisible();
  });

  it("previews Scripture as the Daily Study sets it: its reference, translation, and verse", async () => {
    render(<TextSizeScreen />);

    const preview = within(await screen.findByTestId("text-size-preview"));
    expect(preview.getByText("Philippians 4:6")).toBeVisible();
    await waitFor(() => expect(preview.getByText("BSB")).toBeVisible());
    expect(screen.getByTestId("text-size-preview-verse")).toHaveTextContent(
      "6 Be anxious for nothing, but in everything, by prayer and petition, with thanksgiving, present your requests to God.",
    );
    expect(screen.getByTestId("text-size-preview-verse")).toHaveStyle({
      fontFamily: lightTheme.typography.scripture.fontFamily,
      lineHeight: lightTheme.typography.scripture.lineHeight,
    });
  });

  it("previews the verse in the reader's own translation", async () => {
    server.use(
      http.get(`${API_URL}/v1/me/settings`, () =>
        HttpResponse.json({ settings: someSettings({ bibleTranslation: "KJV" }) }),
      ),
    );
    render(<TextSizeScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("text-size-preview-verse")).toHaveTextContent(
        /Be careful for nothing; but in every thing by prayer and supplication/,
      ),
    );
    expect(within(screen.getByTestId("text-size-preview")).getByText("KJV")).toBeVisible();
  });

  it("grows the preview the moment a larger size is picked, before the server answers", async () => {
    server.use(http.patch(`${API_URL}/v1/me/settings`, () => new Promise<never>(() => undefined)));
    render(<TextSizeScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("text-size-options-default")).toHaveProp("accessibilityState", {
        checked: true,
        disabled: false,
      }),
    );
    const before = StyleSheet.flatten(
      screen.getByTestId("text-size-preview-verse").props.style as StyleProp<TextStyle>,
    ).fontSize;

    fireEvent.press(screen.getByTestId("text-size-options-extraLarge"));

    await waitFor(() =>
      expect(
        StyleSheet.flatten(
          screen.getByTestId("text-size-preview-verse").props.style as StyleProp<TextStyle>,
        ).fontSize,
      ).toBeGreaterThan(before ?? 0),
    );
  });

  it("sets its explanatory note as a centred footnote, in the darker supporting grey", () => {
    render(<TextSizeScreen />);

    expect(screen.getByText(/This changes text throughout SundayBest/)).toHaveStyle({
      color: lightTheme.colors.textSupporting,
      textAlign: "center",
    });
  });

  it("marks the size the reader chose", async () => {
    render(<TextSizeScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("text-size-options-default")).toHaveProp("accessibilityState", {
        checked: true,
        disabled: false,
      }),
    );
  });

  it("saves another size when it's picked", async () => {
    const sent: unknown[] = [];
    server.use(
      http.patch(`${API_URL}/v1/me/settings`, async ({ request }) => {
        sent.push(await request.json());
        return HttpResponse.json({ settings: someSettings({ textSize: "large" }) });
      }),
    );
    render(<TextSizeScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("text-size-options-large")).toHaveProp("accessibilityState", {
        checked: false,
        disabled: false,
      }),
    );

    fireEvent.press(screen.getByTestId("text-size-options-large"));

    await waitFor(() => expect(sent).toEqual([{ textSize: "large" }]));
  });

  it("goes back to Settings when Back is pressed", () => {
    render(<TextSizeScreen />);

    fireEvent.press(screen.getByTestId("text-size-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
