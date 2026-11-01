import { Skia } from "@shopify/react-native-skia";

/**
 * The surface shader: an object's colour (`albedo`) lit by the one light
 * from the slope of its height map (`height`, white highest) — its normal
 * read from the height either side of each point — with a little light
 * reaching its turned-away faces, warmed by the page, and a soft sheen
 * where it faces the light most. A face square to the page shows its own
 * colour, as under a large soft light. Where its height map's green
 * stands above its red, it's polished (`gloss`): a satin sheen of its own
 * (`glossSheen`, `glossTight`), on flat faces too, taking it toward pure
 * white, never a brighter shade of its own colour. Nothing is drawn at its outline:
 * its edge is lit by its own shape — on its shaded side, darkest a little
 * in from its outline, then glowing warm out to it with the light the page
 * throws back onto its underside — so as the light moves, all of it moves
 * with it. Outside its outline, nothing.
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
uniform float glossSheen;
uniform float glossTight;
uniform float glow;
uniform float glowReach;
uniform float3 glowWarm;
uniform float core;
uniform float coreAt;
uniform float coreWidth;
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
  half4 mapped = height.eval(p);
  float here = mapped.r;
  // Polish, from the map's green over its red (GLOSS_SCALE, 5: a gloss of 1 is 0.2 of green).
  float gloss = clamp((mapped.g - mapped.r) * 5.0, 0.0, 1.0);
  // Sheen only where the surface turns, a rim catching the light, never a flat top; where it's
  // polished, its own satin sheen everywhere instead, as white light off a glaze.
  float turned = clamp((1.0 - n.z) * 4.0, 0.0, 1.0);
  float spec = pow(max(dot(n, half_way), 0.0), mix(tight, glossTight, gloss));
  float shine = spec * sheen * turned * (1.0 - gloss);
  float glaze = clamp(spec * glossSheen * gloss, 0.0, 1.0);
  half3 colour = base.rgb / base.a;
  // A pale object under a white light: where it's lit it shows its own colour, true; only its shade
  // takes the warmth of the light the page throws back (neutral: 1 for pale objects, 0 for red).
  half3 full = mix(half3(1.0), ambient * half3(bounce) + (1.0 - ambient), half(neutral));
  half3 lit = colour * (ambient * half3(bounce) + (1.0 - ambient) * diffuse) / full + half3(shine);

  // Its shaded side, as a ball's is: darkest in a soft band a little in from its outline (core, at
  // coreAt in its map), then brightening steadily out to its outline in the warm light the page throws
  // back up onto its underside (glow, over the last glowReach of its map) — only on the side turned
  // away from the light, so as the light moves, both move with it.
  float band = (here - coreAt) / coreWidth;
  lit *= half(1.0 - exp(-band * band) * core * (1.0 - 0.85 * diffuse));
  float turnedAway = length(n.xy) > 0.001 ? clamp(-dot(normalize(n.xy), normalize(light.xy)), 0.0, 1.0) : 0.0;
  float edge = 1.0 - clamp(here / glowReach, 0.0, 1.0);
  lit += colour * half3(glowWarm) * half(edge * edge * turnedAway * glow);

  // Its hollows and ridges: how much lower (or higher) this point lies than the points either side
  // of it, at two reaches — fine for creases and pits, wide for folds and clefts — only where both
  // sides are on it, so its outline never reads as a hollow. Hollows stain warm grey-brown; ridges,
  // worn clean, go a touch whiter.
  if (stain > 0.0 || stainWide > 0.0) {
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
  // The glaze's sheen last, over its shade and stain: the colour taken toward pure white.
  lit = mix(clamp(lit, 0.0, 1.0), half3(1.0), half(glaze));
  return half4(clamp(lit, 0.0, 1.0) * base.a, base.a);
}
`;

export const LIT_EFFECT = Skia.RuntimeEffect.Make(SOURCE);
