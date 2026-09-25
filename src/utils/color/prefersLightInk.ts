/** A hex colour's channels, 0–1 — or null for one that isn't `#RGB` or `#RRGGBB`. */
function channels(hex: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  const digits = match?.[1];
  if (!digits) return null;
  const full = digits.length === 3 ? [...digits].map((digit) => digit + digit).join("") : digits;
  const value = (at: number) => parseInt(full.slice(at, at + 2), 16) / 255;
  return [value(0), value(2), value(4)];
}

/** WCAG relative luminance of one sRGB channel. */
function linear(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

/**
 * Whether white type reads better than black on this background colour —
 * whichever has the higher WCAG contrast against it. A colour it can't read
 * gets white, as the colours it's given are mostly dark.
 */
export function prefersLightInk(background: string): boolean {
  const rgb = channels(background);
  if (!rgb) return true;
  const [red, green, blue] = rgb.map(linear) as [number, number, number];
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  const onWhite = 1.05 / (luminance + 0.05);
  const onBlack = (luminance + 0.05) / 0.05;
  return onWhite >= onBlack;
}
