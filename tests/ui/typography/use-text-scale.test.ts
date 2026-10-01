import { renderHook } from "@testing-library/react-native";

import { useTextScale } from "@/ui/typography/use-text-scale";

describe("useTextScale", () => {
  it("returns 1 while there is no text-size setting", () => {
    const { result } = renderHook(() => useTextScale());

    expect(result.current).toBe(1);
  });
});
