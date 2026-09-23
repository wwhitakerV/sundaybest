import { renderHook } from "@testing-library/react-native";
import { useFonts } from "expo-font";

import { useAppFonts } from "@/core/fonts/use-app-fonts";
import { FONT_ASSETS } from "@/theme/fonts";

jest.mock("expo-font", () => ({
  useFonts: jest.fn(),
}));

const mockUseFonts = jest.mocked(useFonts);

describe("useAppFonts", () => {
  it("loads every font this app declares", () => {
    mockUseFonts.mockReturnValue([true, null]);

    renderHook(() => {
      useAppFonts();
    });

    expect(mockUseFonts).toHaveBeenCalledWith(FONT_ASSETS);
  });

  it("reports loaded once expo-font resolves", () => {
    mockUseFonts.mockReturnValue([true, null]);

    const { result } = renderHook(() => useAppFonts());

    expect(result.current).toEqual({ loaded: true, error: null });
  });

  it("reports not loaded while expo-font is still working", () => {
    mockUseFonts.mockReturnValue([false, null]);

    const { result } = renderHook(() => useAppFonts());

    expect(result.current).toEqual({ loaded: false, error: null });
  });

  it("surfaces a load error without throwing", () => {
    const error = new Error("font file missing");
    mockUseFonts.mockReturnValue([false, error]);

    const { result } = renderHook(() => useAppFonts());

    expect(result.current).toEqual({ loaded: false, error });
  });
});
