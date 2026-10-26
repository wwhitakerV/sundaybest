import {
  Blur,
  BlurMask,
  Circle,
  ColorMatrix,
  FractalNoise,
  Group,
  LinearGradient,
  Paint,
  Path,
  Rect,
  vec,
} from "@shopify/react-native-skia";

import { BODY_TOP } from "../logic/formation-relief";
import { STONE } from "../logic/formation-stone";
import { greyNoise, greyOf } from "./ideal-paint";
import { polyline } from "./stone-paths";
import type { StoneWear } from "./stone-wear";

/** A layer whose drawing is added to the height below it, softened by `blur`. */
const added = (blur: number) => (
  <Paint blendMode="plus">
    <Blur blur={blur} />
  </Paint>
);

/** The swell: the outline eaten back and softened at each depth, each adding its rise. */
function Swell({ outline }: { outline: string }) {
  return STONE.inflate.map((layer, i) => (
    <Group key={`swell-${i}`} layer={added(layer.soft)}>
      <Path path={outline} color={greyOf(layer.height * BODY_TOP, 1)} />
      <Path
        path={outline}
        style="stroke"
        strokeWidth={layer.erode * 2}
        color={greyOf(0, 1)}
        blendMode="dstOut"
      />
    </Group>
  ));
}

/** Its carved planes, each tipped its own way, and the soft ridges and valleys where they meet. */
function Facets({ wear }: { wear: StoneWear }) {
  const { soft, seam } = STONE.facets;
  return (
    <>
      <Group layer={added(soft)}>
        {wear.facets.map((facet, i) => (
          <Path key={`facet-${i}`} path={polyline(facet.cell, true)}>
            <LinearGradient
              start={vec(facet.from.x, facet.from.y)}
              end={vec(facet.to.x, facet.to.y)}
              colors={[greyOf(0, 1), greyOf(facet.tip, 1)]}
            />
          </Path>
        ))}
      </Group>
      {wear.seams.map((s, i) => (
        <Path
          key={`seam-${i}`}
          path={polyline(s.ends)}
          style="stroke"
          strokeWidth={seam}
          strokeCap="round"
          color={greyOf(s.ridge ? 1 : 0, STONE.facets.tip * 0.6)}
          blendMode={s.ridge ? "plus" : "srcOver"}
        >
          <BlurMask blur={seam} style="normal" />
        </Path>
      ))}
    </>
  );
}

/** A soft valley in from each inward turn of its outline. */
function Folds({ folds }: { folds: StoneWear["folds"] }) {
  const { width, depth } = STONE.folds;
  return folds.map((fold, i) => (
    <Path
      key={`fold-${i}`}
      path={polyline(fold)}
      style="stroke"
      strokeWidth={width}
      strokeCap="round"
      color={greyOf(0, depth)}
    >
      <BlurMask blur={width * 0.8} style="normal" />
    </Path>
  ));
}

/** Its surface: a faint unevenness, the crossed weave of linen pressed into it, and tiny pocks. */
function Surface({ wear }: { wear: StoneWear }) {
  const { undulation, weave, pocks } = STONE;
  return (
    <>
      <Rect x={-1.5} y={-1.5} width={3} height={3} blendMode="plus">
        <FractalNoise freqX={undulation.fine} freqY={undulation.fine} octaves={2} />
        <ColorMatrix matrix={greyNoise(undulation.depth)} />
      </Rect>
      {[wear.weave, wear.weave + Math.PI / 2].map((angle) => (
        <Group key={`weave-${angle}`} transform={[{ rotate: angle }]}>
          <Rect x={-2} y={-2} width={4} height={4} blendMode="plus">
            <FractalNoise freqX={weave.fine} freqY={weave.fine / weave.dash} octaves={2} />
            <ColorMatrix matrix={greyNoise(weave.depth)} />
          </Rect>
        </Group>
      ))}
      {wear.pocks.map((p, i) => (
        <Circle key={`pock-${i}`} cx={p.x} cy={p.y} r={p.r} color={greyOf(0, pocks.depth)} />
      ))}
    </>
  );
}

export type StoneFormProps = { wear: StoneWear };

/**
 * A stone sculpt's form, in its outline's units, inside its outline: the
 * swell, its carved planes, the folds in from its outline, and its surface.
 */
export function StoneForm({ wear }: StoneFormProps) {
  return (
    <>
      <Swell outline={wear.outline} />
      <Facets wear={wear} />
      <Folds folds={wear.folds} />
      <Surface wear={wear} />
    </>
  );
}
