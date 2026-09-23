import { renderHook } from "@testing-library/react-native";

import { useActivationCount } from "@/ui/tab-bar/use-activation-count";

describe("useActivationCount", () => {
  it("does not count being active on mount", () => {
    const { result } = renderHook(() => useActivationCount(true));

    expect(result.current).toBe(0);
  });

  it("counts each flip from inactive to active", () => {
    const { result, rerender } = renderHook(({ active }) => useActivationCount(active), {
      initialProps: { active: false },
    });

    rerender({ active: true });
    rerender({ active: false });
    rerender({ active: true });

    expect(result.current).toBe(2);
  });

  it("does not count becoming inactive", () => {
    const { result, rerender } = renderHook(({ active }) => useActivationCount(active), {
      initialProps: { active: true },
    });

    rerender({ active: false });

    expect(result.current).toBe(0);
  });
});
