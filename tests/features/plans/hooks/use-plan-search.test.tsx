import { Keyboard } from "react-native";
import { act, renderHook } from "@tests/helpers/render";
import { useRouter } from "expo-router";
import type * as ExpoRouter from "expo-router";

import { placePlanHref } from "@/entities/tabs";
import { usePlanSearch } from "@/features/plans/hooks/use-plan-search";

jest.mock("expo-router", () => ({
  ...jest.requireActual<typeof ExpoRouter>("expo-router"),
  useRouter: jest.fn(),
}));

const mockPush = jest.fn<void, [ExpoRouter.Href]>();
const mockBack = jest.fn<void, []>();

beforeEach(() => {
  jest
    .mocked(useRouter)
    .mockReturnValue({ push: mockPush, back: mockBack } as unknown as ReturnType<typeof useRouter>);
});

describe("usePlanSearch", () => {
  it("opens a plan found on top of the search, in one movement: Back returns to the results", () => {
    const { result } = renderHook(() => usePlanSearch());

    act(() => result.current.open("plan-1"));

    expect(mockPush).toHaveBeenCalledWith(placePlanHref("plan-search", "plan-1"));
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("puts the keyboard away as the plan opens", () => {
    const dismiss = jest.spyOn(Keyboard, "dismiss");
    const { result } = renderHook(() => usePlanSearch());

    act(() => result.current.open("plan-1"));

    expect(dismiss).toHaveBeenCalled();
  });

  it("closes, back to Plans", () => {
    const { result } = renderHook(() => usePlanSearch());

    act(() => result.current.close());

    expect(mockBack).toHaveBeenCalled();
  });
});
