/** One colour stop in a gradient: where it sits (0–1) and its colour. */
export type BackdropStop = { offset: number; color: string };

/**
 * A featured backdrop's gradient from content's colours, strongest first
 * (main, accent, anchor): it sweeps from the accent — lighting one corner —
 * through the main colour, into the deep anchor. Two colours sweep from the
 * accent into the main one; one holds flat; none holds `fallback` flat.
 */
export function getBackdropStops(colors: readonly string[], fallback: string): BackdropStop[] {
  const [main = fallback, accent, anchor] = colors;
  if (accent && anchor) {
    return [
      { offset: 0, color: accent },
      { offset: 0.5, color: main },
      { offset: 1, color: anchor },
    ];
  }
  if (accent) {
    return [
      { offset: 0, color: accent },
      { offset: 1, color: main },
    ];
  }
  return [
    { offset: 0, color: main },
    { offset: 1, color: main },
  ];
}
