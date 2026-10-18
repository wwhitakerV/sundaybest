import { LAUNCH_WATER } from "@/theme/launch-water";
import { GLASS_CORE, sksl } from "./glass-sksl";

/**
 * A written letter: the glass, with the pool's living water laid over it, drawn
 * finer for a letter's strokes and kept about a point inside its edges, which
 * keep their own look — a deeper tone for the light to show against, drifting
 * colour, bands of bent light, caustic webs (TextWaterLikeness, and
 * TextWaterColor for the colour), a sheen along each stroke's crest and glints
 * (TextWaterShine), and the gleam that sweeps across the word (TextWaterGleam).
 * In the letter's own units.
 */
export const LETTER_SKSL = `${GLASS_CORE}
uniform shader lwInward;
uniform shader lwDepth;
uniform shader ridge;
uniform shader causticA;
uniform shader causticB;
uniform shader field;
uniform shader tint;
uniform float deepK;
uniform float causticKA;
uniform float causticKB;
uniform float tintK;
uniform float bandsK;
uniform float sheenK;
uniform float sparkK;
uniform float gleamK;
uniform float4 warpTile;
uniform float4 gleamBox;

float lwInsideAt(float2 p) {
  float x = lwInward.eval(p).a * 10.0;
  return 0.5 * hat(x - 9.0) + hat(x - 10.0);
}
float tri(float d, float centre) { return max(0.0, 1.0 - abs(d - centre) / 0.06); }
float3 saturated(float3 c) {
  float s = 2.6;
  return saturate(float3(
    (0.213 + 0.787 * s) * c.r + (0.715 - 0.715 * s) * c.g + (0.072 - 0.072 * s) * c.b,
    (0.213 - 0.213 * s) * c.r + (0.715 + 0.285 * s) * c.g + (0.072 - 0.072 * s) * c.b,
    (0.213 - 0.213 * s) * c.r + (0.715 - 0.715 * s) * c.g + (0.072 + 0.928 * s) * c.b));
}

half4 main(float2 p) {
  float s = S(p);
  if (s <= 0.0) return half4(0.0);
  float4 acc = over(float4(0.0), ${sksl(LAUNCH_WATER.dropBody)}, s);
  acc = glassRest(acc, p);
  float inside = lwInsideAt(p);
  acc = over(acc, ${sksl(LAUNCH_WATER.letterDeep)}, saturate(deepK * inside));
  float4 tinted = tint.eval(p);
  if (tinted.a > 0.0) {
    acc = over(acc, saturated(tinted.rgb / tinted.a), saturate(tinted.a * tintK) * inside);
  }
  float d = lwDepth.eval(p + 0.07 * unit * warpAt(p, warpTile)).a;
  float4 bands = over(over(over(float4(0.0), ${sksl(LAUNCH_WATER.letterPeach)}, tri(d, 0.46)),
    ${sksl(LAUNCH_WATER.letterLilac)}, tri(d, 0.6)), ${sksl(LAUNCH_WATER.letterAqua)}, tri(d, 0.74));
  if (bands.a > 0.0) acc = over(acc, bands.rgb / bands.a, saturate(bands.a * bandsK) * inside);
  float cA = causticA.eval(p).a;
  float cB = causticB.eval(p).a;
  float light = saturate(causticKA * cA + causticKB * cB);
  acc = over(acc, ${sksl(LAUNCH_WATER.light)}, saturate(1.7 * light * field.eval(p).a) * inside);
  float r = ridge.eval(p + float2(0.03 * unit)).a * 10.0;
  acc = over(acc, ${sksl(LAUNCH_WATER.light)}, saturate((0.35 * hat(r - 9.0) + hat(r - 10.0)) * sheenK) * inside);
  acc = over(acc, ${sksl(LAUNCH_WATER.light)}, saturate(sparkK * cA * cB) * inside);
  float2 g = (p - gleamBox.xy) / gleamBox.zw;
  float across = (g.x - 0.5 - (g.y - 0.5) * 0.35) / 0.16;
  float gleam = (g.x >= 0.0 && g.x <= 1.0 && g.y >= 0.0 && g.y <= 1.0) ? exp(-across * across) : 0.0;
  acc = over(acc, ${sksl(LAUNCH_WATER.light)}, saturate(gleam * gleamK) * inside);
  return half4(acc * s * s);
}
`;
