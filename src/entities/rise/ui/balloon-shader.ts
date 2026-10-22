import { Skia, type SkShader } from "@shopify/react-native-skia";

/**
 * A balloon's skin, lit: shaded as a sphere in its own points, the light
 * fixed up and to the left of the world however it rocks — soft diffuse
 * light, darker toward its edges, light bouncing up from below, and a sharp
 * shine with a broad sheen round it. Its colour is `ink` below the
 * atmosphere's line and `saved` above it, so a balloon crossing turns green
 * from its top down, its shading kept. Paint on it takes the same light,
 * duller (`gloss`) and flatter (`matte`: how much of its own colour it keeps
 * against the shading — paint stays white, only shaded at the edges).
 */
const SOURCE = `
uniform float2 body;
uniform float3 ink;
uniform float3 saved;
uniform float lineY;
uniform float centerY;
uniform float turn;
uniform float scale;
uniform float gloss;
uniform float matte;

half4 main(float2 p) {
  float2 q = p / body;
  float z = sqrt(max(0.0, 1.0 - min(dot(q, q), 1.0)));
  float3 n = normalize(float3(q.x, q.y, z * 1.15 + 0.05));
  float c = cos(-turn);
  float s = sin(-turn);
  float3 l0 = normalize(float3(-0.5, -0.75, 0.8));
  float3 l = float3(c * l0.x - s * l0.y, s * l0.x + c * l0.y, l0.z);
  float diffuse = max(dot(n, l), 0.0);
  float nh = max(dot(n, normalize(l + float3(0.0, 0.0, 1.0))), 0.0);
  float shine = pow(nh, 120.0) * 0.75 + pow(nh, 12.0) * 0.1;
  float rim = pow(1.0 - z, 2.4);
  float worldY = centerY + scale * (sin(turn) * p.x + cos(turn) * p.y);
  float above = 1.0 - smoothstep(lineY - 4.0, lineY + 4.0, worldY);
  float3 base = mix(ink, saved, above);
  float3 color = base * (0.38 + 0.72 * diffuse);
  color *= 1.0 - 0.5 * rim;
  color += base * 0.18 * smoothstep(0.25, 1.0, q.y) * rim;
  color = mix(color, base, matte);
  color += float3(shine * gloss);
  return half4(half3(color), 1.0);
}
`;

const effect = Skia.RuntimeEffect.Make(SOURCE);

/** A colour as the shader takes it: red, green and blue, 0 to 1. */
export type Rgb = [number, number, number];

/** What one balloon's skin needs: its size and colours, the line, and where it is and how it's turned. */
export type Skin = {
  halfW: number;
  halfH: number;
  ink: Rgb;
  saved: Rgb;
  lineY: number;
  centerY: number;
  turn: number;
  scale: number;
  gloss: number;
  matte: number;
};

/** The shader for one balloon's skin, or its paint — or none, if the shader couldn't be built. */
export function skinShader(skin: Skin): SkShader | null {
  "worklet";
  if (!effect) return null;
  return effect.makeShader([
    skin.halfW,
    skin.halfH,
    ...skin.ink,
    ...skin.saved,
    skin.lineY,
    skin.centerY,
    skin.turn,
    skin.scale,
    skin.gloss,
    skin.matte,
  ]);
}
