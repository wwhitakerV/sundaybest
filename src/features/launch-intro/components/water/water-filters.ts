import { Skia, TileMode, type SkImageFilter, type SkRect } from "@shopify/react-native-skia";

import { letterToPixels, pointsToPixels } from "../../logic/water/pixels";
import type { WaterScene } from "../../logic/water/scene";
import {
  gleamAt,
  letterLight,
  letterTiles,
  poolLight,
  poolTiles,
} from "../../logic/water/textures";
import { GLASS, glassParts, runtimeFilter, textureParts, tileUniform } from "./glass-filters";
import type { WaterAssets } from "./water-assets";

/**
 * The pool's water at `t`: everything drawn into it merged like liquid, then
 * made glass with its living body — red at first, clearing as the drips land.
 * In the screen's pixels (`pr` to a point); its textures only within `wet`.
 */
export function poolFilter(
  scene: WaterScene,
  assets: WaterAssets,
  t: number,
  pr: number,
  wet: SkRect,
): SkImageFilter {
  "worklet";
  const shape = assets.liquid;
  const glass = glassParts(GLASS.pool, shape, scene.settings.poolEdgeColor, pr);
  // Beyond the screen counts as water, so the deep bands never trace its edges.
  const deepBlur = (sigma: number) =>
    Skia.ImageFilter.MakeBlur(sigma * pr, sigma * pr, TileMode.Clamp, shape);
  const tiles = poolTiles(scene, t);
  const light = poolLight(scene, t);
  const px = {
    causticA: pointsToPixels(tiles.causticA, pr),
    causticB: pointsToPixels(tiles.causticB, pr),
    field: pointsToPixels(tiles.field, pr),
    tint: pointsToPixels(tiles.tint, pr),
  };
  return runtimeFilter({
    effect: assets.effects.pool,
    radius: glass.radius,
    uniforms: {
      ...glass.uniforms,
      clearAmt: [light.clear],
      bodyAmt: [light.body],
      causticKA: [light.causticA],
      causticKB: [light.causticB],
      glintK: [light.glints],
      warpTile: tileUniform(pointsToPixels(tiles.warp, pr)),
      red: assets.red,
    },
    children: {
      ...glass.children,
      nearDepth: deepBlur(7),
      depthMap: deepBlur(18),
      thickMap: deepBlur(30),
      inward: deepBlur(3),
      ...textureParts(assets.textures, px, wet),
    },
  });
}

/** The drips' water: the glass alone, the same every frame, in the screen's pixels. */
export function dropsFilter(scene: WaterScene, assets: WaterAssets, pr: number): SkImageFilter {
  "worklet";
  const glass = glassParts(GLASS.drops, null, scene.settings.dripEdgeColor, pr);
  return runtimeFilter({ effect: assets.effects.drops, ...glass });
}

/**
 * The letters' water at `t`, all of them in one layer: glass with the pool's
 * living water inside it, laid across the whole word, and the gleam sweeping by
 * — worked out in the screen's pixels within `box`, on the letters as drawn,
 * each already melted if it's falling.
 */
export function letterFilter(
  scene: WaterScene,
  assets: WaterAssets,
  t: number,
  pr: number,
  box: SkRect,
): SkImageFilter {
  "worklet";
  const unit = scene.world.ws * pr;
  const glass = glassParts(GLASS.letters, null, 1, unit);
  const blur = (sigma: number) =>
    Skia.ImageFilter.MakeBlur(sigma * unit, sigma * unit, TileMode.Decal, null);
  const word = assets.word;
  const tiles = letterTiles(0, t, word);
  const inPixels = (tile: (typeof tiles)["warp"]) => letterToPixels(scene, tile, 0, pr);
  const light = letterLight(scene.settings);
  const gleam = gleamAt(t, scene.settings.textWaterGleam);
  const sweep = inPixels({ x: gleam.centre - 1.5, y: word.y, w: 3, h: word.height });
  return runtimeFilter({
    effect: assets.effects.letter,
    radius: glass.radius,
    uniforms: {
      ...glass.uniforms,
      deepK: [light.deep],
      causticKA: [light.causticA],
      causticKB: [light.causticB],
      tintK: [light.tint],
      bandsK: [light.bands],
      sheenK: [light.sheen],
      sparkK: [light.spark],
      gleamK: [gleam.strength],
      warpTile: tileUniform(inPixels(tiles.warp)),
      gleamBox: tileUniform(sweep),
    },
    children: {
      ...glass.children,
      lwInward: blur(0.08),
      lwDepth: blur(0.2),
      ridge: blur(0.13),
      ...textureParts(
        assets.textures,
        {
          causticA: inPixels(tiles.causticA),
          causticB: inPixels(tiles.causticB),
          field: inPixels(tiles.field),
          tint: inPixels(tiles.tint),
        },
        box,
      ),
    },
  });
}
