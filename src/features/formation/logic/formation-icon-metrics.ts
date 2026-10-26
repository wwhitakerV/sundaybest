/** A colour as fractions, 0–1: red, green, blue. */
export type Rgb = readonly [number, number, number];

/**
 * What an icon is, read from its own pixels: its disc's centre (shares of the
 * art's width and height) and radius (a share of its width), and its colour —
 * the average of its solid pixels — with how light and how vivid that is.
 */
export type IconMetrics = {
  cx: number;
  cy: number;
  r: number;
  colour: Rgb;
  lum: number;
  sat: number;
};

/** Pixels this solid are the icon's (0–255 alpha); the rest its transparent room. */
const SOLID = 128;
/** Pixels sampled across the art's width: enough to measure, quick to read. */
const ACROSS = 160;

/**
 * An icon's metrics from its pixels (RGBA, unpremultiplied, row by row): the
 * box its solid pixels fill, and their average colour — so everything drawn
 * round it (its shadow, its shading, the line's colour) follows the icon
 * itself, whatever icon it is.
 */
export function iconMetricsOf(
  pixels: ArrayLike<number>,
  width: number,
  height: number,
): IconMetrics {
  const step = Math.max(1, Math.floor(width / ACROSS));
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      if ((pixels[i + 3] ?? 0) < SOLID) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      red += pixels[i] ?? 0;
      green += pixels[i + 1] ?? 0;
      blue += pixels[i + 2] ?? 0;
      count += 1;
    }
  }
  if (count === 0) return { cx: 0.5, cy: 0.5, r: 0.5, colour: [0.5, 0.5, 0.5], lum: 0.5, sat: 0 };
  const colour: Rgb = [red / count / 255, green / count / 255, blue / count / 255];
  const lum = 0.2126 * colour[0] + 0.7152 * colour[1] + 0.0722 * colour[2];
  return {
    cx: (minX + maxX) / 2 / width,
    cy: (minY + maxY) / 2 / height,
    r: Math.max(maxX - minX, maxY - minY) / 2 / width,
    colour,
    lum,
    sat: Math.max(...colour) - Math.min(...colour),
  };
}
