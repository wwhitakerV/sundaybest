import { useMemo } from "react";
import { Skia, useFont } from "@shopify/react-native-skia";

import { useTheme } from "@/theme";
import { FONT_ASSETS, fonts } from "@/theme/fonts";
import type { Rgb } from "./balloon-shader";
import type { Look } from "./draw-balloon";

/** The answers' face, at the size set for a balloon 140 wide (`drawBalloon` scales it). */
const ANSWER_SIZE = 19;

/** A theme colour as the balloon shader takes it. */
function rgbOf(color: string): Rgb {
  const [red = 0, green = 0, blue = 0] = Skia.Color(color);
  return [red, green, blue];
}

/**
 * How the board is drawn, from the theme: the balloons' red and saved
 * green, the paint's white, the page, the black ink, the torn latex, and
 * the answers' face — the same for the board on screen and its poster.
 */
export function useRiseLook(): Look {
  const { colors } = useTheme();
  const font = useFont(FONT_ASSETS[fonts.uiSemibold], ANSWER_SIZE);
  return useMemo(
    () => ({
      red: rgbOf(colors.accent),
      green: rgbOf(colors.balloonSaved),
      paint: rgbOf(colors.onAccent),
      paper: colors.background,
      ink: colors.text,
      glass: colors.onAccent,
      scrap: colors.balloonScrap,
      words: colors.text,
      gain: colors.balloonSaved,
      font,
      blur: 0,
    }),
    [colors, font],
  );
}
