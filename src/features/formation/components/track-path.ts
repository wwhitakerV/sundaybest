import type { SkPathBuilder } from "@shopify/react-native-skia";

type Point = { x: number; y: number };

/** One more smooth line through `points` (a Catmull-Rom curve) added to `builder`, as its own stroke, on the UI thread. */
export function addSmooth(builder: SkPathBuilder, points: readonly Point[]): void {
  "worklet";
  const n = points.length;
  if (n === 0) return;
  const p = (i: number) => points[Math.max(0, Math.min(n - 1, i))]!;
  builder.moveTo(p(0).x, p(0).y);
  for (let i = 0; i < n - 1; i += 1) {
    const [a, b, c, d] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    builder.cubicTo(
      b.x + (c.x - a.x) / 6,
      b.y + (c.y - a.y) / 6,
      c.x - (d.x - b.x) / 6,
      c.y - (d.y - b.y) / 6,
      c.x,
      c.y,
    );
  }
}
