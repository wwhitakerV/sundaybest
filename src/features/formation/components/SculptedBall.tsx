import {
  BlurMask,
  Circle,
  ColorMatrix,
  FractalNoise,
  Group,
  Path,
  Rect,
} from "@shopify/react-native-skia";

import { FORMATION_INLAY, FORMATION_MATERIALS } from "@/theme";
import type { FormationIcon } from "../logic/formation-icons";
import { ICON_RELIEF, RING_WEAR } from "../logic/formation-sculpted-ball";
import { IconRelief } from "./IconRelief";
import { greyNoise, greyOf, tintNoise, withAlpha } from "./ideal-paint";
import type { RingWear } from "./ring-wear";
import { sculptedBallOf } from "./sculpted-ball";
import { polyline } from "./stone-paths";

const line = { style: "stroke", strokeCap: "round", strokeJoin: "round" } as const;

/**
 * The ring's damage: each strip's shallow patch (`patch` for its depth), and
 * the marks packed along it, each drawn `widen` times its size (`mark` for
 * its depth).
 */
function WearMarks({
  wear,
  patch,
  mark,
  widen,
}: {
  wear: RingWear;
  patch: (depth: number) => Float32Array;
  mark: (depth: number) => Float32Array;
  widen: number;
}) {
  const { strips, tears, chips, specks } = RING_WEAR;
  return (
    <>
      {wear.strips.map((strip, i) => (
        <Path
          key={`strip-${i}`}
          path={polyline(strip)}
          {...line}
          strokeWidth={strips.width}
          color={patch(strips.depth)}
        >
          <BlurMask blur={strips.width * 0.5} style="normal" />
        </Path>
      ))}
      {wear.tears.map((tear, i) => (
        <Path
          key={`tear-${i}`}
          path={polyline(tear)}
          {...line}
          strokeWidth={tears.width * widen}
          color={mark(tears.depth)}
        >
          <BlurMask blur={tears.width * 0.3 * widen} style="normal" />
        </Path>
      ))}
      {wear.chips.map((chip, i) => (
        <Path key={`chip-${i}`} path={polyline(chip, true)} color={mark(chips.depth)}>
          <BlurMask blur={chips.soft * widen} style="normal" />
        </Path>
      ))}
      {wear.specks.map((p, i) => (
        <Circle key={`speck-${i}`} cx={p.x} cy={p.y} r={p.r * widen} color={mark(specks.depth)} />
      ))}
    </>
  );
}

/** The ball darkened a little just outside the icon's foot, where the icon shades it: in the icon's units. */
function Halo({ outline }: { outline: string }) {
  const { halo } = ICON_RELIEF;
  return (
    <Group layer>
      <Path
        path={outline}
        {...line}
        strokeWidth={halo.width}
        color={withAlpha(FORMATION_MATERIALS.red.deep, halo.strength)}
      >
        <BlurMask blur={halo.width * 0.3} style="normal" />
      </Path>
      <Path path={outline} color={greyOf(0, 1)} blendMode="dstOut" />
    </Group>
  );
}

/** The ball's velvet tooth, in its height. */
function Pores() {
  const { pores } = RING_WEAR;
  return (
    <Rect x={-1} y={-1} width={2} height={2} blendMode="plus">
      <FractalNoise freqX={pores.fine} freqY={pores.fine} octaves={2} />
      <ColorMatrix matrix={greyNoise(pores.depth)} />
    </Rect>
  );
}

export type SculptedBallProps = { icon: FormationIcon; centre: number; r: number };

/**
 * A sculpted ball's height, over the ball's own: the velvet tooth, the
 * icon modelled up off it, and the damage in the ring round it.
 */
export function SculptedBallHeight({ icon, centre, r }: SculptedBallProps) {
  const ball = sculptedBallOf(icon);
  if (!ball) return null;
  return (
    <Group transform={[{ translateX: centre }, { translateY: centre }, { scale: r }]}>
      <Pores />
      <Group transform={[{ scale: ICON_RELIEF.fit }]}>
        <IconRelief outline={ball.outline} folds={ball.folds} />
      </Group>
      <WearMarks
        wear={ball.wear}
        patch={(depth) => greyOf(0, depth)}
        mark={(depth) => greyOf(0, depth)}
        widen={1}
      />
    </Group>
  );
}

/**
 * A sculpted ball's colours, over its red: a faint paler speckle, the ball
 * darkened round the icon's foot, each damaged strip a little darker, and
 * the near-black grime filling its marks, spreading a little past them.
 */
export function SculptedBallColour({ icon, centre, r }: SculptedBallProps) {
  const ball = sculptedBallOf(icon);
  if (!ball) return null;
  const { pores, grime } = RING_WEAR;
  return (
    <Group transform={[{ translateX: centre }, { translateY: centre }, { scale: r }]}>
      <Rect x={-1} y={-1} width={2} height={2} blendMode="srcATop">
        <FractalNoise freqX={pores.fine} freqY={pores.fine} octaves={2} />
        <ColorMatrix matrix={tintNoise(FORMATION_MATERIALS.red.light, pores.speckle, pores.from)} />
      </Rect>
      <Group transform={[{ scale: ICON_RELIEF.fit }]}>
        <Halo outline={ball.outline} />
      </Group>
      <WearMarks
        wear={ball.wear}
        patch={() => withAlpha(FORMATION_MATERIALS.red.deep, RING_WEAR.strips.tint)}
        mark={() => withAlpha(FORMATION_INLAY.redGrime, grime.strength)}
        widen={grime.width}
      />
    </Group>
  );
}
