import { ImageFormat, Skia, useFont } from "@shopify/react-native-skia";

import { FONT_ASSETS, fonts } from "@/theme/fonts";
import type { RiseGame } from "../logic/rise-rules";
import { POSTER, drawPoster, type PosterFormat } from "./draw-poster";
import { useRiseLook } from "./use-rise-look";

/** The score in Canela, and the day in the tracked label face, at the poster's pixels. */
const SCORE_SIZE = 132;
const LABEL_SIZE = 34;
/** The time, opposite the score: Canela, smaller. */
const TIME_SIZE = 84;
/** Full quality: crisp edges on the paint and the type. */
const PNG_QUALITY = 100;

/**
 * Makes a poster of a board as it stands (`drawPoster`), as a base64 PNG —
 * or null, when it can't be drawn. Drawn on the phone, in memory: it goes
 * nowhere until it's shared.
 */
export function useRisePoster() {
  const look = useRiseLook();
  const score = useFont(FONT_ASSETS[fonts.display], SCORE_SIZE);
  const label = useFont(FONT_ASSETS[fonts.metaLabel], LABEL_SIZE);
  const time = useFont(FONT_ASSETS[fonts.display], TIME_SIZE);

  return (
    game: RiseGame,
    format: PosterFormat,
    words: { score: string; time: string; label: string[] },
  ): string | null => {
    const { width, height } = POSTER[format];
    const surface = Skia.Surface.Make(width, height);
    if (!surface) return null;
    drawPoster(surface.getCanvas(), game, look, { score, time, label }, format, words);
    surface.flush();
    return surface.makeImageSnapshot().encodeToBase64(ImageFormat.PNG, PNG_QUALITY);
  };
}
