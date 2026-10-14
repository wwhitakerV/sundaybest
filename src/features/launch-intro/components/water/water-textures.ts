import {
  FilterMode,
  MipmapMode,
  Skia,
  TileMode,
  type SkImage,
  type SkRuntimeEffect,
  type SkShader,
} from "@shopify/react-native-skia";

import { TEXTURE_BUMPS, type Bump, type Tile } from "../../logic/water/textures";
import { CAUSTIC_SKSL, FIELD_SKSL, TINT_SKSL } from "./texture-sksl";

/** The water's living body: textures drawn once, then laid over the water and moved every frame. */
export type WaterTextures = { caustic: SkImage; field: SkImage; tint: SkImage };

/** The textures' sizes, in pixels: as the prototype drew them. */
const SIZE = { caustic: 320, field: 160, tint: 256 } as const;

/** A runtime effect, or the reason it wouldn't compile. */
export function compile(sksl: string): SkRuntimeEffect {
  const effect = Skia.RuntimeEffect.Make(sksl);
  if (!effect) throw new Error("The launch intro's water shader didn't compile");
  return effect;
}

/** Bumps as SkSL `float4`s: where, how big, how high. */
const bumps = (list: readonly Bump[]) => list.flatMap((b) => [b.x, b.y, b.r, b.h]);

/**
 * A texture drawn once: on the GPU where it can be, then copied out of it so
 * the intro's own thread can draw with it.
 */
function bake(sksl: string, uniforms: number[], size: number): SkImage {
  const surface = Skia.Surface.MakeOffscreen(size, size) ?? Skia.Surface.Make(size, size);
  if (!surface) throw new Error("No surface for the launch intro's water");
  const paint = Skia.Paint();
  paint.setShader(compile(sksl).makeShader(uniforms));
  surface.getCanvas().drawPaint(paint);
  surface.flush();
  const image = surface.makeImageSnapshot();
  return image.makeNonTextureImage() ?? image;
}

/** The caustic web, the calm-and-bright field and the colour patches, drawn once. */
export function bakeWaterTextures(): WaterTextures {
  const { bendU, bendV, calm, patches } = TEXTURE_BUMPS;
  return {
    caustic: bake(CAUSTIC_SKSL, [SIZE.caustic, ...bumps(bendU), ...bumps(bendV)], SIZE.caustic),
    field: bake(FIELD_SKSL, [SIZE.field, ...bumps(calm)], SIZE.field),
    tint: bake(TINT_SKSL, [SIZE.tint, ...bumps(patches), ...patches.map((p) => p.k)], SIZE.tint),
  };
}

/** A texture repeating across the water from its tile, stretched to the tile's size. */
export function tiled(image: SkImage, tile: Tile): SkShader {
  "worklet";
  const matrix = Skia.Matrix();
  matrix.translate(tile.x, tile.y);
  matrix.scale(tile.w / image.width(), tile.h / image.height());
  return image.makeShaderOptions(
    TileMode.Repeat,
    TileMode.Repeat,
    FilterMode.Linear,
    MipmapMode.None,
    matrix,
  );
}
