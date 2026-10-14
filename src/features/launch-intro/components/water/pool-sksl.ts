import { LAUNCH_WATER } from "@/theme/launch-water";
import { GLASS_CORE, sksl } from "./glass-sksl";

/**
 * The pool, the eruption and the drain: the glass, with a living body inside it
 * — kept a few points in from the edge, which keeps its own look — as the
 * prototype's pool filter has it: drifting patches of colour, bands of bent
 * light at set depths (bent again by a moving field), two caustic webs uneven
 * across it, glints where they cross, and fine bands close in. It starts as the
 * launch's red and turns clear as the drips bring the water in (`clearAmt`).
 * `depthMap` and `thickMap` count beyond the screen as water, so no frame of
 * bands traces the screen's own edges.
 */
export const POOL_SKSL = `${GLASS_CORE}
uniform shader nearDepth;
uniform shader depthMap;
uniform shader thickMap;
uniform shader inward;
uniform shader causticA;
uniform shader causticB;
uniform shader field;
uniform shader tint;
uniform float clearAmt;
uniform float bodyAmt;
uniform float causticKA;
uniform float causticKB;
uniform float glintK;
uniform float4 warpTile;
layout(color) uniform half4 red;

float insideAt(float2 p) {
  float x = inward.eval(p).a * 10.0;
  return 0.5 * hat(x - 9.0) + hat(x - 10.0);
}

float4 deepBands(float2 q) {
  float d = depthMap.eval(q).a * 40.0;
  float th = thickMap.eval(q).a * 40.0;
  float4 b = float4(0.0);
  b = over(b, ${sksl(LAUNCH_WATER.thick)}, 0.056 * hat(th - 34.0) + 0.194 * hat(th - 35.0) +
    0.333 * hat(th - 36.0) + 0.472 * hat(th - 37.0) + 0.389 * hat(th - 38.0) +
    0.25 * hat(th - 39.0) + 0.111 * hat(th - 40.0));
  b = over(b, ${sksl(LAUNCH_WATER.peach)}, 0.142 * hat(d - 30.0) + 0.496 * hat(d - 31.0) +
    0.85 * hat(d - 32.0) + 0.496 * hat(d - 33.0) + 0.142 * hat(d - 34.0));
  b = over(b, ${sksl(LAUNCH_WATER.lilac)}, 0.356 * hat(d - 35.0) + 0.8 * hat(d - 36.0) +
    0.356 * hat(d - 37.0));
  b = over(b, ${sksl(LAUNCH_WATER.aqua)}, 0.35 * hat(d - 38.0) + 0.467 * hat(d - 39.0));
  return b;
}

half4 main(float2 p) {
  float s = S(p);
  if (s <= 0.0) return half4(0.0);
  float inside = insideAt(p);
  float4 acc = over(float4(0.0), ${sksl(LAUNCH_WATER.poolBody)}, s);
  float4 tinted = tint.eval(p);
  if (tinted.a > 0.0) acc = over(acc, tinted.rgb / tinted.a, saturate(tinted.a * bodyAmt) * inside);
  float4 bands = deepBands(p + 22.0 * unit * warpAt(p, warpTile));
  if (bands.a > 0.0) acc = over(acc, bands.rgb / bands.a, saturate(bands.a * clearAmt) * inside);
  float cA = causticA.eval(p).a;
  float cB = causticB.eval(p).a;
  float f = field.eval(p).a;
  float light = saturate(causticKA * cA + causticKB * cB);
  acc = over(acc, ${sksl(LAUNCH_WATER.light)}, saturate(1.7 * light * f) * inside);
  float glint = saturate(glintK * cA * cB);
  acc = over(acc, ${sksl(LAUNCH_WATER.light)}, saturate(1.5 * glint * f) * inside);
  float n = nearDepth.eval(p).a * 40.0;
  acc = over(acc, ${sksl(LAUNCH_WATER.finePeach)}, 0.225 * hat(n - 33.0) + 0.6 * hat(n - 34.0) +
    0.525 * hat(n - 35.0) + 0.15 * hat(n - 36.0));
  acc = over(acc, ${sksl(LAUNCH_WATER.fineAqua)}, 0.186 * hat(n - 37.0) + 0.65 * hat(n - 38.0) +
    0.186 * hat(n - 39.0));
  acc = glassRest(acc, p);
  float4 redWater = float4(red.rgb * red.a, red.a);
  return half4((clearAmt * acc + (1.0 - clearAmt) * redWater) * s);
}
`;
