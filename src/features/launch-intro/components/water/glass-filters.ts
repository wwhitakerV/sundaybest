import {
  Skia,
  TileMode,
  type SkImageFilter,
  type SkRect,
  type SkRuntimeEffect,
} from "@shopify/react-native-skia";

import type { Tile } from "../../logic/water/textures";
import { tiled, type WaterTextures } from "./water-textures";

/**
 * How one water's glass sits on its shape: how much it blurs the shape for its
 * depth (`height`), its inner bands (`deep`) and its catchlight (`lip`), and how
 * far from the edge each part of the light sits. The pool's are the largest, the
 * letters' (in their own units) the smallest.
 */
export type Glass = {
  height: number;
  deep: number;
  lip: number;
  light: number;
  far: [number, number];
  near: [number, number];
  mid: [number, number];
  from: [number, number];
  inner: [number, number];
  lipShift: number;
  /** Tiled for the pool, whose water runs off the screen's edges; clear of the edge otherwise. */
  tile: TileMode;
  /**
   * How far from a point the glass reads its shape, in the water's own units: its
   * farthest offset, and for the pool the warp that bends its bands. Skia works out
   * that much around everything drawn, so it's kept to what's needed.
   */
  radius: number;
};

/** The prototype's glass for each water. */
export const GLASS = {
  pool: {
    height: 2.2,
    deep: 5,
    lip: 0.45,
    light: 1.4,
    far: [1.5, 1.2],
    near: [0.75, 0.6],
    mid: [0.2, 0.15],
    from: [0.802, 0.648],
    inner: [1.6, 1.3],
    lipShift: 0.5,
    tile: TileMode.Clamp,
    radius: 12,
  },
  drops: {
    height: 0.9,
    deep: 2,
    lip: 0.3,
    light: 0.6,
    far: [0.8, 0.64],
    near: [0.4, 0.32],
    mid: [0.1, 0.08],
    from: [0.428, 0.346],
    inner: [0.7, 0.55],
    lipShift: 0.3,
    tile: TileMode.Decal,
    radius: 2,
  },
  letters: {
    height: 0.088,
    deep: 0.194,
    lip: 0.026,
    light: 0.07,
    far: [0.079, 0.063],
    near: [0.04, 0.032],
    mid: [0.011, 0.009],
    from: [0.042, 0.034],
    inner: [0.07, 0.056],
    lipShift: 0.031,
    tile: TileMode.Decal,
    radius: 0.3,
  },
} satisfies Record<string, Glass>;

/** A runtime filter built fresh for one frame, its uniforms set and its children named. */
export type FilterParts = {
  effect: SkRuntimeEffect;
  radius: number;
  uniforms: Record<string, number[]>;
  children: Record<string, SkImageFilter | null>;
};

/** One frame's filter: a new builder each time, so no frame's settings reach another's. */
export function runtimeFilter({ effect, radius, uniforms, children }: FilterParts): SkImageFilter {
  "worklet";
  const builder = Skia.RuntimeShaderBuilder(effect);
  for (const name of Object.keys(uniforms)) builder.setUniform(name, uniforms[name] ?? []);
  const names = Object.keys(children);
  return Skia.ImageFilter.MakeRuntimeShaderWithChildren(
    builder,
    radius,
    names,
    names.map((name) => children[name] ?? null),
  );
}

/**
 * The glass every water shares: its shape, that shape blurred, and where its
 * light sits — in the screen's pixels, `unit` of them to one of the water's own
 * units (a point for the pool and the drips, a wordmark unit for a letter).
 */
export function glassParts(
  glass: Glass,
  shape: SkImageFilter | null,
  edgeColor: number,
  unit: number,
) {
  "worklet";
  const blur = (sigma: number) =>
    Skia.ImageFilter.MakeBlur(sigma * unit, sigma * unit, glass.tile, shape);
  const at = ([x, y]: [number, number]) => [x * unit, y * unit];
  return {
    radius: glass.radius * unit,
    children: {
      shape,
      height: blur(glass.height),
      deep: blur(glass.deep),
      lip: blur(glass.lip),
    },
    uniforms: {
      oLight: at([glass.light, glass.light]),
      oFar: at(glass.far),
      oNear: at(glass.near),
      oMid: at(glass.mid),
      oFrom: at(glass.from),
      oDeep: at(glass.inner),
      oLip: at([glass.lipShift, glass.lipShift]),
      edgeColor: [edgeColor],
      unit: [unit],
    },
  };
}

/**
 * The living body's textures where they lie this frame, as filter inputs, cut to
 * `crop`: a texture has no edges of its own, and uncut it would have its filter
 * worked out across the whole screen.
 */
export function textureParts(
  textures: WaterTextures,
  tiles: { causticA: Tile; causticB: Tile; field: Tile; tint: Tile },
  crop: SkRect,
) {
  "worklet";
  const layer = (shader: ReturnType<typeof tiled>) =>
    Skia.ImageFilter.MakeShader(shader, false, crop);
  return {
    causticA: layer(tiled(textures.caustic, tiles.causticA)),
    causticB: layer(tiled(textures.caustic, tiles.causticB)),
    field: layer(tiled(textures.field, tiles.field)),
    tint: layer(tiled(textures.tint, tiles.tint)),
  };
}

/** A tile as an SkSL `float4`: where it starts and how big it is. */
export function tileUniform(tile: Tile): number[] {
  "worklet";
  return [tile.x, tile.y, tile.w, tile.h];
}
