import { http } from "msw";
import { render, screen } from "@tests/helpers/render";
import { useNavigation, useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { API_URL } from "@tests/factories/api";
import { server } from "@tests/mocks/server";
import { WordScreen } from "@/features/progress/screens/WordScreen";
import { FILTER_PILLS_HEIGHT } from "@/ui/molecules/FilterPills";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
}));

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ back: jest.fn() } as unknown as ReturnType<typeof useRouter>);
  jest
    .mocked(useNavigation)
    .mockReturnValue({ setOptions: jest.fn() });
});

describe("WordScreen", () => {
  it("keeps the books' row while The Word loads, so the passages never move down when it arrives", () => {
    server.use(http.get(`${API_URL}/v1/me/word`, () => new Promise<never>(() => {})));

    render(<WordScreen />);

    expect(screen.getByTestId("word-books-pending")).toHaveStyle({ height: FILTER_PILLS_HEIGHT });
  });
});
