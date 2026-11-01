import { BlurMask, Circle, Path } from "@shopify/react-native-skia";

import { FORMATION_INLAY } from "@/theme";
import { STONE } from "../logic/formation-stone";
import { withAlpha } from "./ideal-paint";
import { polyline } from "./stone-paths";
import type { StoneWear } from "./stone-wear";

/** A soft smear of grime along `path`, `width` wide. */
function Smear({ path, width, strength }: { path: string; width: number; strength: number }) {
  return (
    <Path
      path={path}
      style="stroke"
      strokeWidth={width}
      strokeJoin="round"
      strokeCap="round"
      color={withAlpha(FORMATION_INLAY.stoneGrime, strength)}
      blendMode="srcATop"
    >
      <BlurMask blur={width / 2} style="normal" />
    </Path>
  );
}

/**
 * The grime it's gathered: round its edge, along its valleys' seams, a
 * fine line of it along its crack and cuts and in its wedges, and in its
 * creases, folds, chips and gouge — with the tiny specks over it.
 */
export function StoneGrime({ wear }: { wear: StoneWear }) {
  const { edge, edgeStrength, line, lineStrength, seamStrength } = STONE.grime;
  const lines = [...wear.creases, ...wear.folds].map((l) => polyline(l));
  return (
    <>
      <Smear path={wear.outline} width={edge * 2} strength={edgeStrength} />
      {wear.seams
        .filter((seam) => !seam.ridge)
        .map((seam, i) => (
          <Smear
            key={`seam-${i}`}
            path={polyline(seam.ends)}
            width={line * 2}
            strength={seamStrength}
          />
        ))}
      {wear.cracks.map((crack, i) => (
        <Smear
          key={`crack-${i}`}
          path={polyline(crack)}
          width={STONE.crack.grime.width}
          strength={STONE.crack.grime.strength}
        />
      ))}
      {wear.cuts.map((cut, i) => (
        <Smear
          key={`cut-${i}`}
          path={polyline(cut)}
          width={STONE.cuts.width * 1.6}
          strength={STONE.cuts.grime}
        />
      ))}
      {wear.wedges.map((wedge, i) => (
        <Path
          key={`wedge-${i}`}
          path={polyline(wedge, true)}
          color={withAlpha(FORMATION_INLAY.stoneGrime, STONE.wedges.grime)}
          blendMode="srcATop"
        />
      ))}
      {lines.map((path, i) => (
        <Smear key={`line-${i}`} path={path} width={line} strength={lineStrength} />
      ))}
      {wear.chips.map((chip, i) => (
        <Smear
          key={`chip-${i}`}
          path={polyline(chip.points, true)}
          width={line}
          strength={lineStrength}
        />
      ))}
      {wear.gouges.map((g, i) => (
        <Path
          key={`gouge-${i}`}
          path={polyline(g, true)}
          color={withAlpha(FORMATION_INLAY.stoneGrime, STONE.gouge.grime)}
          blendMode="srcATop"
        >
          <BlurMask blur={line / 3} style="normal" />
        </Path>
      ))}
      {wear.pocks.map((p, i) => (
        <Circle
          key={`pock-${i}`}
          cx={p.x}
          cy={p.y}
          r={p.r}
          color={withAlpha(FORMATION_INLAY.stoneGrime, STONE.pocks.grime)}
          blendMode="srcATop"
        />
      ))}
    </>
  );
}
