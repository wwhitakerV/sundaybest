import { Skia } from "@shopify/react-native-skia";

/**
 * The surface shader: an object's colour (`albedo`) lit by the one light
 * from the slope of its height map (`height`, white highest) — its normal
 * read from the height either side of each point — with a little light
 * reaching its turned-away faces, warmed by the page, and a soft sheen
 * where it faces the light most. A face square to the page shows its own
 * colour, as under a large soft light. At its outline, a pale object's two
 * rims: crisp and near white where the edge turns to the light, warm and soft
 * where it turns away and the page throws light back up under it. Outside
 * its outline, nothing.
 */
const SOURCE = `
uniform shader height;
uniform shader albedo;
uniform float texel;
uniform float depth;
uniform float3 light;
uniform float ambient;
uniform float3 bounce;
uniform float wrap;
uniform float sheen;
uniform float tight;
uniform float rimReach;
uniform float rimLit;
uniform float rimBounce;
uniform float3 rimWarm;
uniform float neutral;
uniform float stainReach;
uniform float stainWideReach;
uniform float stain;
uniform float stainWide;
uniform float polish;
uniform float3 stainTint;

half4 main(float2 p) {
  half4 base = albedo.eval(p);
  if (base.a < 0.002) { return half4(0); }
  // The slope read across three map pixels either side: wide enough that the map's steps never show.
  float span = texel * 3.0;
  float l = height.eval(p - float2(span, 0)).r;
  float r = height.eval(p + float2(span, 0)).r;
  float u = height.eval(p - float2(0, span)).r;
  float d = height.eval(p + float2(0, span)).r;
  float3 n = normalize(float3((l - r) * depth / (2.0 * span), (u - d) * depth / (2.0 * span), 1.0));
  float facing = dot(n, light);
  // A large soft light: a face square to the page is already fully lit, so turning further toward it adds only sheen.
  float diffuse = clamp((facing + wrap) / (light.z + wrap), 0.0, 1.0);
  float3 half_way = normalize(light + float3(0.0, 0.0, 1.0));
  // Sheen only where the surface turns: a rim catching the light, never a flat top.
  float shine = pow(max(dot(n, half_way), 0.0), tight) * sheen * clamp((1.0 - n.z) * 4.0, 0.0, 1.0);
  half3 colour = base.rgb / base.a;
  // A pale object under a white light: where it's lit it shows its own colour, true; only its shade
  // takes the warmth of the light the page throws back (neutral: 1 for pale objects, 0 for red).
  half3 full = mix(half3(1.0), ambient * half3(bounce) + (1.0 - ambient), half(neutral));
  half3 lit = colour * (ambient * half3(bounce) + (1.0 - ambient) * diffuse) / full + half3(shine);

  // Its rims. How near the outline this point is (0 well inside, 1 at the edge) and which way is out,
  // from how much of its outline lies within reach round it.
  float inside = 0.0;
  float2 away = float2(0.0);
  for (int i = 0; i < 8; i++) {
    float turn = float(i) * 0.7853982;
    float2 way = float2(cos(turn), sin(turn));
    float there = albedo.eval(p + way * rimReach).a;
    inside += there;
    away += way * (1.0 - there);
  }
  float edge = clamp((1.0 - inside / 8.0) * 2.0, 0.0, 1.0);
  float toward = length(away) > 0.001 ? dot(normalize(away), normalize(light.xy)) : 0.0;
  // Where the edge turns to the light it catches it: a crisp rim, near white, brighter than its face.
  float caught = edge * edge * smoothstep(0.0, 0.6, toward) * rimLit;
  // Where it turns away, light thrown back off the page warms its underside: a softer rim, lifting the shade.
  float thrown = edge * smoothstep(0.0, 0.7, -toward) * rimBounce;
  lit = mix(lit, half3(1.0), caught) + colour * half3(rimWarm) * thrown;

  // Its hollows and ridges: how much lower (or higher) this point lies than the points either side
  // of it, at two reaches — fine for creases and pits, wide for folds and clefts — only where both
  // sides are on it, so its outline never reads as a hollow. Hollows stain warm grey-brown; ridges,
  // worn clean, go a touch whiter.
  if (stain > 0.0) {
    float here = height.eval(p).r;
    float fine = 0.0;
    float fineOn = 0.0;
    float broad = 0.0;
    float broadOn = 0.0;
    for (int i = 0; i < 4; i++) {
      float turn = float(i) * 0.7853982;
      float2 way = float2(cos(turn), sin(turn));
      float on = albedo.eval(p + way * stainReach).a * albedo.eval(p - way * stainReach).a;
      fine += ((height.eval(p + way * stainReach).r + height.eval(p - way * stainReach).r) * 0.5 - here) * on;
      fineOn += on;
      on = albedo.eval(p + way * stainWideReach).a * albedo.eval(p - way * stainWideReach).a;
      broad += ((height.eval(p + way * stainWideReach).r + height.eval(p - way * stainWideReach).r) * 0.5 - here) * on;
      broadOn += on;
    }
    fine = fineOn > 0.5 ? fine / fineOn : 0.0;
    broad = broadOn > 0.5 ? broad / broadOn : 0.0;
    float hollow = clamp(max(fine * stain, broad * stainWide), 0.0, 1.0);
    lit *= mix(half3(1.0), half3(stainTint), half(hollow));
    lit = mix(lit, half3(1.0), half(clamp(-fine * polish, 0.0, 0.3)));
  }
  return half4(clamp(lit, 0.0, 1.0) * base.a, base.a);
}
`;

export const LIT_EFFECT = Skia.RuntimeEffect.Make(SOURCE);
