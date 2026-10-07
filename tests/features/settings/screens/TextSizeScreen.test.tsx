import { http, HttpResponse } from "msw";
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL, someSettings } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import { TextSizeScreen } from "@/features/settings/screens/TextSizeScreen";

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

  it("previews reading text", () => {
    render(<TextSizeScreen />);

    expect(screen.getByTestId("text-size-preview")).toHaveTextContent(
      /Your word is a lamp for my feet/,
    );
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
