import { LAUNCH_WATER } from "@/theme/launch-water";
import { sksl } from "./glass-sksl";

/** Tileable textures for the water's living body, each drawn once into a square `size` pixels wide. */
const WRAPPED = `
uniform float size;
float wrapped(float a, float b) { float d = abs(a - b); return min(d, 1.0 - d); }
float bumpAt(float2 uv, float4 b) {
  float dx = wrapped(uv.x, b.x);
  float dy = wrapped(uv.y, b.y);
  return b.w * exp(-(dx * dx + dy * dy) / (b.z * b.z));
}
`;

/**
 * The caustic web: bright where light focuses through the moving surface — its
 * space bent by a random field first, so its cells vary in size and its lines
 * wander. White, as much as shows in its alpha.
 */
export const CAUSTIC_SKSL = `${WRAPPED}
uniform float4 bendU[9];
uniform float4 bendV[9];
half4 main(float2 xy) {
  float2 uv0 = (xy - 0.5) / size;
  float bu = 0.0;
  float bv = 0.0;
  for (int i = 0; i < 9; i++) {
    bu += bumpAt(uv0, bendU[i]);
    bv += bumpAt(uv0, bendV[i]);
  }
  float2 pp = (uv0 + 0.05 * (float2(bu, bv) - 1.0)) * 6.2831853 - 250.0;
  float2 it = pp;
  float c = 1.0;
  for (int n = 0; n < 5; n++) {
    float t = 7.3 * (1.0 - 3.5 / float(n + 1));
    it = float2(pp.x + cos(t - it.x) + sin(t + it.y), pp.y + sin(t - it.y) + cos(t + it.x));
    c += 1.0 / length(float2(pp.x / (sin(it.x + t) / 0.005), pp.y / (cos(it.y + t) / 0.005)));
  }
  c = 1.17 - pow(c / 5.0, 1.4);
  float a = min(1.0, pow(abs(c), 8.0));
  return half4(a);
}
`;

/** Where the light is calm and where it's bright: a slow, uneven field. */
export const FIELD_SKSL = `${WRAPPED}
uniform float4 calm[7];
half4 main(float2 xy) {
  float2 uv = (xy - 0.5) / size;
  float total = 0.0;
  for (int i = 0; i < 7; i++) total += bumpAt(uv, calm[i]);
  return half4(min(1.0, 0.25 + 0.6 * total));
}
`;

/**
 * Soft patches of refracted colour: blobs of random size and place, each its
 * colour — warm, lilac, aqua or pale gold — melting into each other and the
 * clear water.
 */
export const TINT_SKSL = `${WRAPPED}
uniform float4 patches[16];
uniform float patchColour[16];
float3 colourOf(float k) {
  if (k < 0.5) return ${sksl(LAUNCH_WATER.patches[0])};
  if (k < 1.5) return ${sksl(LAUNCH_WATER.patches[1])};
  if (k < 2.5) return ${sksl(LAUNCH_WATER.patches[2])};
  return ${sksl(LAUNCH_WATER.patches[3])};
}
half4 main(float2 xy) {
  float2 uv = (xy - 0.5) / size;
  float3 sum = float3(0.0);
  float weight = 0.0;
  float most = 0.0;
  for (int i = 0; i < 16; i++) {
    float k = bumpAt(uv, patches[i]);
    sum += colourOf(patchColour[i]) * k;
    weight += k;
    most = max(most, k);
  }
  float3 colour = weight > 0.0 ? sum / weight : float3(1.0);
  float a = 0.55 * min(1.0, most * 1.2);
  return half4(colour * a, a);
}
`;
