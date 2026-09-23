import { AccessibilityInfo } from "react-native";
import { act, renderHook, waitFor } from "@testing-library/react-native";

import { useReduceMotion } from "@/core/accessibility/use-reduce-motion";

type ReduceMotionListener = (enabled: boolean) => void;

let listener: ReduceMotionListener | undefined;
const remove = jest.fn();

beforeEach(() => {
  listener = undefined;
  remove.mockClear();
  jest.spyOn(AccessibilityInfo, "addEventListener").mockImplementation((_event, handler) => {
    listener = handler as unknown as ReduceMotionListener;
    return { remove } as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useReduceMotion", () => {
  it("reports the setting once the OS answers", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);

    const { result } = renderHook(() => useReduceMotion());

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("assumes motion is fine until the OS answers", () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useReduceMotion());

    expect(result.current).toBe(false);
  });

  it("follows the setting when it changes while open", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
    const { result } = renderHook(() => useReduceMotion());
    await waitFor(() => expect(listener).toBeDefined());

    act(() => listener?.(true));

    expect(result.current).toBe(true);
  });

  it("stops listening on unmount", async () => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(false);
    const { unmount } = renderHook(() => useReduceMotion());
    await waitFor(() => expect(listener).toBeDefined());

    unmount();

    expect(remove).toHaveBeenCalledTimes(1);
  });
});
