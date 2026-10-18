import {
  FilterMode,
  MipmapMode,
  Skia,
  type SkCanvas,
  type SkImage,
} from "@shopify/react-native-skia";

import type { coverFit, Stage } from "../../logic/movie/movie";

/** One frame of the movie, whole, filling the screen (`fit`): it covers everything. */
export function drawWholeFrame(
  canvas: SkCanvas,
  image: SkImage,
  stage: Stage,
  fit: ReturnType<typeof coverFit>,
): void {
  "worklet";
  const src = Skia.XYWHRect(0, 0, image.width(), image.height());
  const dst = Skia.XYWHRect(0, 0, stage.width, stage.height);
  canvas.save();
  canvas.translate(fit.dx, fit.dy);
  canvas.scale(fit.scale, fit.scale);
  canvas.drawImageRectOptions(image, src, dst, FilterMode.Linear, MipmapMode.None);
  canvas.restore();
}
