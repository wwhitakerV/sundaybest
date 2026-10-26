import type { ShadowPart } from "../logic/formation-shadow";

/**
 * Where a shadow's unit outline (radius 1, centred) is laid: moved to its
 * place, then stretched `e` along the way the light falls and narrowed
 * across it — a low light drawing a round object's shadow out long — then
 * sized. On the UI thread as an object moves; once, for a still one.
 */
export function shadowTransform(
  cx: number,
  cy: number,
  r: number,
  angle: number,
  part: ShadowPart,
) {
  "worklet";
  const way = (angle * Math.PI) / 180;
  const half = part.s * r;
  return [
    { translateX: cx + Math.cos(way) * part.d * r },
    { translateY: cy + Math.sin(way) * part.d * r },
    { rotate: way },
    { scaleX: half * part.e },
    { scaleY: half / Math.sqrt(part.e) },
    { rotate: -way },
  ];
}
