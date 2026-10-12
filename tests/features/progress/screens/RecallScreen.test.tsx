import { http, HttpResponse } from "msw";
import { fireEvent, render, screen } from "@tests/helpers/render";
import { useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import { RecallScreen } from "@/features/progress/screens/RecallScreen";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
}));

const mockBack = jest.fn();

beforeEach(() => {
  mockBack.mockClear();
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: mockBack, push: jest.fn() } as unknown as ReturnType<
      typeof useRouter
    >);
  jest.mocked(useNavigation).mockReturnValue({ setOptions: jest.fn() });
});

describe("RecallScreen", () => {
  it("says it couldn't load your Quick Checks, with Back beside Try again", async () => {
    server.use(
      http.get(`${API_URL}/v1/me/quick-checks`, () =>
        HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 }),
      ),
    );
    render(<RecallScreen />);

    expect(
      await screen.findByRole(
        "header",
        { name: "Couldn't load your Quick Checks" },
        { timeout: 10000 },
      ),
    ).toBeVisible();
    fireEvent.press(screen.getByRole("button", { name: "Back" }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
