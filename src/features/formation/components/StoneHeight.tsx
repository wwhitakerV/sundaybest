import { BlurMask, Circle, Group, LinearGradient, Path, vec } from "@shopify/react-native-skia";

import { STONE } from "../logic/formation-stone";
import { greyOf } from "./ideal-paint";
import { StoneForm } from "./StoneForm";
import { polyline } from "./stone-paths";
import type { StoneWear } from "./stone-wear";

/** Lower by `share` of the height there. */
const down = (share: number) => greyOf(0, share);

/** A hairline along `line`: a thin dark split, and a pale ledge beside it where one side stands a hair higher. */
function Crack({ line }: { line: string }) {
  const { width, depth, ledge } = STONE.crack;
  return (
    <>
      <Group transform={[{ translateY: -ledge.offset }]}>
        <Path
          path={line}
          style="stroke"
          strokeWidth={ledge.width}
          strokeJoin="round"
          strokeCap="round"
          color={greyOf(1, ledge.rise)}
          blendMode="plus"
        >
          <BlurMask blur={ledge.width * 0.4} style="normal" />
        </Path>
      </Group>
      <Path
        path={line}
        style="stroke"
        strokeWidth={width}
        strokeJoin="round"
        strokeCap="round"
        color={down(depth)}
      />
    </>
  );
}

/** Its small cuts, as nicks in its height, and the tiny wedges chipped out along them. */
function Cuts({ wear }: { wear: StoneWear }) {
  const { cuts, wedges } = STONE;
  return (
    <>
      {wear.cuts.map((cut, i) => (
        <Path
          key={`cut-${i}`}
          path={polyline(cut)}
          style="stroke"
          strokeWidth={cuts.width}
          strokeJoin="miter"
          strokeCap="round"
          color={down(cuts.depth)}
        />
      ))}
      {wear.wedges.map((wedge, i) => (
        <Path key={`wedge-${i}`} path={polyline(wedge, true)} color={down(wedges.depth)} />
      ))}
    </>
  );
}

/** Its gouge: sunk soft inside, a raised rim round it. */
function Gouge({ points }: { points: string }) {
  const { gouge } = STONE;
  return (
    <>
      <Path
        path={points}
        style="stroke"
        strokeWidth={gouge.rim.width}
        strokeJoin="round"
        color={greyOf(1, gouge.rim.rise)}
        blendMode="plus"
      >
        <BlurMask blur={gouge.rim.width * 0.5} style="normal" />
      </Path>
      <Path path={points} color={down(gouge.depth)}>
        <BlurMask blur={gouge.width * 0.25} style="normal" />
      </Path>
    </>
  );
}

/** Its wear in its height: a dent, chips' sloping broken faces, its gouge, its crack, cuts and hairline creases. */
function Wear({ wear }: { wear: StoneWear }) {
  const { dents, chips, creases } = STONE;
  return (
    <>
      {wear.dents.map((d, i) => (
        <Circle key={`dent-${i}`} cx={d.x} cy={d.y} r={d.r} color={down(dents.depth)}>
          <BlurMask blur={d.r * 0.6} style="normal" />
        </Circle>
      ))}
      {wear.chips.map((chip, i) => (
        <Path key={`chip-${i}`} path={polyline(chip.points, true)}>
          <LinearGradient
            start={vec(chip.outer.x, chip.outer.y)}
            end={vec(chip.inner.x, chip.inner.y)}
            colors={[down(chips.depth), down(0)]}
          />
          <BlurMask blur={chips.soft} style="normal" />
        </Path>
      ))}
      {wear.gouges.map((g, i) => (
        <Gouge key={`gouge-${i}`} points={polyline(g, true)} />
      ))}
      {wear.cracks.map((crack, i) => (
        <Crack key={`crack-${i}`} line={polyline(crack)} />
      ))}
      <Cuts wear={wear} />
      {wear.creases.map((crease, i) => (
        <Path
          key={`crease-${i}`}
          path={polyline(crease)}
          style="stroke"
          strokeWidth={creases.width}
          strokeJoin="round"
          strokeCap="round"
          color={down(creases.depth)}
        />
      ))}
    </>
  );
}

export type StoneHeightProps = {
  wear: StoneWear;
  centre: number;
  /** The sculpt's half-width (points): its outline's unit. */
  r: number;
  /** The icon's strokes carved into it, when the icon didn't become its outline. */
  carving?: string | null;
};

/** The icon's strokes cut into it. */
function Carving({ carving }: { carving: string }) {
  const { width, depth, soft } = STONE.carve;
  return (
    <Path
      path={carving}
      style="stroke"
      strokeWidth={width}
      strokeCap="round"
      strokeJoin="round"
      color={down(depth)}
    >
      <BlurMask blur={soft} style="normal" />
    </Path>
  );
}

/**
 * A stone sculpt's height map, for any outline: its form (`StoneForm` —
 * swelled, carved into planes, folded where its outline turns in, its
 * surface woven and pocked), its wear, and the icon carved into it.
 */
export function StoneHeight({ wear, centre, r, carving }: StoneHeightProps) {
  return (
    <Group transform={[{ translateX: centre }, { translateY: centre }, { scale: r }]}>
      <Group clip={wear.outline}>
        <StoneForm wear={wear} />
        <Wear wear={wear} />
        {carving && <Carving carving={carving} />}
      </Group>
    </Group>
  );
}
