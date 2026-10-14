import { LAUNCH_WATER } from "@/theme/launch-water";

/** A theme colour as an SkSL `float3`, 0–1 a channel. */
export function sksl(hex: string): string {
  const channel = (i: number) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(4);
  return `float3(${channel(1)}, ${channel(3)}, ${channel(5)})`;
}

/**
 * Clear water, as glass: what every water in the intro shares — the pool, the
 * drips and the letters. Opaque at every pixel, its look made only from shading:
 * a near-white body, deeper where it bends the light away, a rim where it
 * thins, the spectrum glass splits light into at its edges, a sheen, a glow and
 * a highlight. A port of the prototype's SVG filter, step for step: `shape` is
 * the water's shape and `height`, `deep` and `lip` that shape blurred; the
 * offsets set how far each part sits from the edge (larger for the pool). It works
 * in the screen's pixels; `unit` is how many make one of the water's own units.
 */
export const GLASS_CORE = `
uniform shader shape;
uniform shader height;
uniform shader deep;
uniform shader lip;
uniform float2 oLight;
uniform float2 oFar;
uniform float2 oNear;
uniform float2 oMid;
uniform float2 oFrom;
uniform float2 oDeep;
uniform float2 oLip;
uniform float edgeColor;
uniform float unit;

const float TAU = 6.2831853;

float hat(float x) { return max(0.0, 1.0 - abs(x)); }
float S(float2 p) { return shape.eval(p).a; }
float Ht(float2 p) { return height.eval(p).a; }
float edgeAt(float2 p) { return saturate(2.4 * saturate(S(p) - Ht(p))); }
float lowSideAt(float2 p) { return saturate(1.6 * (Ht(p) - Ht(p + oLight))); }
float deepThinAt(float2 p) { return saturate(S(p) - deep.eval(p).a); }
float deepEdgeAt(float2 p) {
  float x = deepThinAt(p) * 3.0;
  return 0.9 * hat(x - 1.0) + 0.4 * hat(x - 2.0);
}
float4 over(float4 acc, float3 c, float a) {
  float k = saturate(a);
  return float4(c * k, k) + acc * (1.0 - k);
}
float2 warpAt(float2 p, float4 tile) {
  float2 uv = (p - tile.xy) / tile.zw;
  float a = sin(TAU * (uv.x + uv.y) + 0.4) + sin(TAU * (2.0 * uv.x - uv.y) + 2.2);
  float b = sin(TAU * (2.0 * uv.y - uv.x) + 1.3) + sin(TAU * (uv.x - 2.0 * uv.y) + 3.7);
  return float2(a, b) * (63.5 / 255.0);
}

float4 glassRest(float4 acc, float2 p) {
  // Deep inside the water none of the edge's light reaches: every part below comes to
  // nothing there, so it's skipped. Once the water fills the screen, that's nearly all of it.
  if (deep.eval(p).a > 0.995 && Ht(p) > 0.995) return acc;
  float lit = saturate(2.4 * (Ht(p) - Ht(p - oLight)));
  float lipSide = saturate(2.2 * (lip.eval(p).a - lip.eval(p - oLip).a));
  acc = over(acc, ${sksl(LAUNCH_WATER.sheen)}, 1.1 * deepThinAt(p));
  acc = over(acc, ${sksl(LAUNCH_WATER.shade)}, lowSideAt(p));
  acc = over(acc, ${sksl(LAUNCH_WATER.rim)}, edgeAt(p));
  acc = over(acc, ${sksl(LAUNCH_WATER.light)}, 0.85 * pow(lipSide, 1.8));
  acc = over(acc, ${sksl(LAUNCH_WATER.innerCyan)}, 0.28 * edgeColor * deepEdgeAt(p - oDeep));
  acc = over(acc, ${sksl(LAUNCH_WATER.innerRose)}, 0.22 * edgeColor * deepEdgeAt(p + oDeep));
  acc = over(acc, ${sksl(LAUNCH_WATER.violet)}, 0.3 * edgeColor * edgeAt(p));
  acc = over(acc, ${sksl(LAUNCH_WATER.blue)}, 0.45 * edgeColor * edgeAt(p + oFar));
  acc = over(acc, ${sksl(LAUNCH_WATER.cyan)}, 0.65 * edgeColor * edgeAt(p + oNear));
  acc = over(acc, ${sksl(LAUNCH_WATER.green)}, 0.22 * edgeColor * edgeAt(p - oMid));
  acc = over(acc, ${sksl(LAUNCH_WATER.pink)}, 0.6 * edgeColor * edgeAt(p - oFrom));
  acc = over(acc, ${sksl(LAUNCH_WATER.amber)}, 0.5 * edgeColor * edgeAt(p - oFar));
  acc = over(acc, ${sksl(LAUNCH_WATER.glow)}, 0.5 * lowSideAt(p + oLight));
  acc = over(acc, ${sksl(LAUNCH_WATER.light)}, 1.3 * pow(lit, 2.2));
  return acc;
}
`;

/** The drips: the glass alone, kept exactly to their shape. */
export const DROPS_SKSL = `${GLASS_CORE}
half4 main(float2 p) {
  float s = S(p);
  if (s <= 0.0) return half4(0.0);
  float4 acc = over(float4(0.0), ${sksl(LAUNCH_WATER.dropBody)}, s);
  acc = glassRest(acc, p);
  return half4(acc * s * s);
}
`;
