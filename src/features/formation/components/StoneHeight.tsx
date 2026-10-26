import { BlurMask, Circle, Group, LinearGradient, Path, vec } from "@shopify/react-native-skia";

import { STONE } from "../logic/formation-stone";
import { greyOf } from "./ideal-paint";
import { StoneForm } from "./StoneForm";
import { polyline } from "./stone-paths";
import type { StoneWear } from "./stone-wear";

/** Lower by `share` of the height there. */
const down = (share: number) => greyOf(0, share);

/** A fine split along `line`, in a soft shallow valley, one side settled a touch lower. */
function Crack({ line }: { line: string }) {
  const { width, depth, valley, step } = STONE.cracks;
  return (
    <>
      <Path
        path={line}
        style="stroke"
        strokeWidth={valley.width}
        strokeJoin="round"
        strokeCap="round"
        color={down(valley.depth)}
      >
        <BlurMask blur={valley.width / 2} style="normal" />
      </Path>
      <Path
        path={line}
        style="stroke"
        strokeWidth={width}
        strokeJoin="round"
        strokeCap="round"
        color={down(depth)}
      />
      <Group transform={[{ translateY: step }]}>
        <Path
          path={line}
          style="stroke"
          strokeWidth={step * 2}
          strokeJoin="round"
          color={down(depth * 0.2)}
        >
          <BlurMask blur={step} style="normal" />
        </Path>
      </Group>
    </>
  );
}

/** Its wear in its height: dents, chips' sloping broken faces, pits, cracks and hairline creases. */
function Wear({ wear }: { wear: StoneWear }) {
  const { dents, chips, pits, creases } = STONE;
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
      {wear.pits.map((pit, i) => (
        <Path key={`pit-${i}`} path={polyline(pit, true)} color={down(pits.depth)}>
          <BlurMask blur={pits.r[0] * 0.4} style="normal" />
        </Path>
      ))}
      {wear.cracks.map((crack, i) => (
        <Crack key={`crack-${i}`} line={polyline(crack)} />
      ))}
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
};

/**
 * A stone sculpt's height map, for any outline: its form (`StoneForm` —
 * swelled, carved into planes, folded where its outline turns in, its
 * surface woven and pocked) and its wear.
 */
export function StoneHeight({ wear, centre, r }: StoneHeightProps) {
  return (
    <Group transform={[{ translateX: centre }, { translateY: centre }, { scale: r }]}>
      <Group clip={wear.outline}>
        <StoneForm wear={wear} />
        <Wear wear={wear} />
      </Group>
    </Group>
  );
}
