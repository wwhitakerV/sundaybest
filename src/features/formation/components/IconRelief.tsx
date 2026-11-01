import {
  Blur,
  BlurMask,
  Circle,
  Group,
  Paint,
  Path,
  RadialGradient,
  vec,
} from "@shopify/react-native-skia";

import { BODY_TOP } from "../logic/formation-relief";
import { ICON_RELIEF } from "../logic/formation-sculpted-ball";
import type { Point } from "../logic/stone-cells";
import { lengthOf, type Fold, type IconFolds } from "./icon-folds";
import { greyOf } from "./ideal-paint";
import { polyline } from "./stone-paths";

/** A layer whose drawing is added to the height below it, softened by `blur`. */
const added = (blur: number) => (
  <Paint blendMode="plus">
    <Blur blur={blur} />
  </Paint>
);

const line = { style: "stroke", strokeCap: "round", strokeJoin: "round" } as const;

/** The icon's body: its silhouette eaten back and softened at each depth, each adding its rise — the first crisp. */
function Mass({ outline }: { outline: string }) {
  return ICON_RELIEF.mass.map((layer, i) => (
    <Group key={`mass-${i}`} layer={added(layer.soft)}>
      <Path path={outline} color={greyOf(layer.height * BODY_TOP, 1)} />
      {layer.erode > 0 && (
        <Path
          path={outline}
          {...line}
          strokeWidth={layer.erode * 2}
          color={greyOf(0, 1)}
          blendMode="dstOut"
        />
      )}
    </Group>
  ));
}

/** The soft swell either side of a fold, as the clay's pushed up beside it — fading at its ends as the fold does. */
function Lip({ fold }: { fold: Fold }) {
  const { lip, grooves } = ICON_RELIEF;
  const width = lip.width * (fold.width / grooves.width);
  return (
    <Group layer={added(0)}>
      <Path
        path={polyline(fold.points)}
        {...line}
        strokeWidth={width}
        color={greyOf(1, lip.rise * (fold.depth / grooves.depth))}
      >
        <BlurMask blur={lip.soft} style="normal" />
      </Path>
      <Ends points={fold.points} reach={reachOf(fold, width)} />
    </Group>
  );
}

/** Each end of a line, faded out over `reach`: a fold that thins away rather than stopping dead. A dimple keeps its ends. */
function Ends({ points, reach }: { points: Point[]; reach: number }) {
  if (lengthOf(points) < reach * 2) return null;
  return [points[0], points[points.length - 1]].map((end, i) =>
    end ? (
      <Circle key={`end-${i}`} cx={end.x} cy={end.y} r={reach} blendMode="dstOut">
        <RadialGradient c={vec(end.x, end.y)} r={reach} colors={[greyOf(0, 1), greyOf(0, 0)]} />
      </Circle>
    ) : null,
  );
}

/** How far in from each end a fold fades. */
const reachOf = (fold: Fold, width: number) =>
  Math.max(width, Math.min(ICON_RELIEF.grooves.taper, lengthOf(fold.points) * 0.3));

/** One cut of a fold: `width` wide, lowering the height under it by `depth`, faded at its ends. */
function Cut({ fold, width, depth }: { fold: Fold; width: number; depth: number }) {
  const reach = reachOf(fold, width);
  return (
    <Group layer={<Paint opacity={depth} />}>
      <Path path={polyline(fold.points)} {...line} strokeWidth={width} color={greyOf(0, 1)}>
        <BlurMask blur={width * 0.35} style="normal" />
      </Path>
      <Ends points={fold.points} reach={reach} />
    </Group>
  );
}

export type IconReliefProps = { outline: string; folds: IconFolds };

/**
 * An icon modelled up off a ball, in the icon's own units: its body, the
 * crease round its foot, the swell beside each of its own lines, then every
 * fold cut in — a wide,
 * soft channel and a narrow, deeper core.
 */
export function IconRelief({ outline, folds }: IconReliefProps) {
  const all = [...folds.grooves, ...folds.fine];
  const { crease } = ICON_RELIEF;
  return (
    <>
      <Mass outline={outline} />
      <Path path={outline} {...line} strokeWidth={crease.width} color={greyOf(0, crease.depth)}>
        <BlurMask blur={crease.soft} style="normal" />
      </Path>
      {all.map((fold, i) => (fold.lip ? <Lip key={`lip-${i}`} fold={fold} /> : null))}
      {all.map((fold, i) => (
        <Cut key={`cut-${i}`} fold={fold} width={fold.width} depth={fold.depth} />
      ))}
      {all.map((fold, i) => (
        <Cut key={`core-${i}`} fold={fold} width={fold.core} depth={fold.coreDepth} />
      ))}
    </>
  );
}
