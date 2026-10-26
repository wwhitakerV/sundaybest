import { Skia } from "@shopify/react-native-skia";

/** `colour` at `alpha` of its strength: a Skia colour, so the theme's tokens take any opacity. */
export function withAlpha(colour: string, alpha: number): Float32Array {
  const c = Skia.Color(colour);
  return Float32Array.of(c[0] ?? 0, c[1] ?? 0, c[2] ?? 0, (c[3] ?? 1) * alpha);
}

/** A grey `level` (0 black, 1 white) at `alpha`: a height, in a height map. */
export function greyOf(level: number, alpha: number): Float32Array {
  return Float32Array.of(level, level, level, alpha);
}

/**
 * Noise as plain grey, `depth` deep — its brightness in all three channels,
 * scaled, wholly opaque — so it adds that much height to a height map (its
 * own alpha would cancel a layer's opacity). A colour matrix.
 */
export function greyNoise(depth: number): number[] {
  const row = [0.2126 * depth, 0.7152 * depth, 0.0722 * depth, 0, 0];
  return [...row, ...row, ...row, 0, 0, 0, 0, 1];
}

/**
 * Noise as `colour`, showing only where the noise is brighter than `from`,
 * and the more the brighter, at `strength` a step: a tint laid in patches or
 * flecks over a colour map, never a grey over it. A colour matrix.
 */
export function tintNoise(colour: string, strength: number, from = 0): number[] {
  const c = Skia.Color(colour);
  const alpha = [0.2126 * strength, 0.7152 * strength, 0.0722 * strength, 0, -from * strength];
  return [
    ...[0, 0, 0, 0, c[0] ?? 0],
    ...[0, 0, 0, 0, c[1] ?? 0],
    ...[0, 0, 0, 0, c[2] ?? 0],
    ...alpha,
  ];
}
