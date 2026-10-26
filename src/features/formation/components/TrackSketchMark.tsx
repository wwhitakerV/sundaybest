import { BlurMask, Circle, Group, rect } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import type { SketchMark } from "../logic/formation-sketch";
import { drawnInAt, linesLeftAt, smooth } from "../logic/formation-track";
import { AccentArt } from "./AccentArt";

/** A red dot's soft halo: this much wider than the dot, this strong. */
const HALO = { scale: 1.7, opacity: 0.16 };
/** How tall the wipe that draws line art on is (points either side of its line). */
const WIPE_HALF = 8;

export type TrackSketchMarkProps = {
  mark: SketchMark;
  shown: SharedValue<number>;
  drawIn: SharedValue<number>;
  colour: Float32Array;
};

/**
 * One of vIdeal's dots or pieces of line art, where vIdeal draws it, never
 * moving: faded once its station has emptied; drawn in on first open — a
 * dot growing, line art wiped on.
 */
export function TrackSketchMark({ mark, shown, drawIn, colour }: TrackSketchMarkProps) {
  const at = mark.at;
  const drawn = useDerivedValue(() => drawnInAt(drawIn.value, mark.restY));
  const opacity = useDerivedValue(() => smooth(linesLeftAt(mark.station, shown.value)));
  const radius = useDerivedValue(() => mark.size * drawn.value);
  const halo = useDerivedValue(() => mark.size * HALO.scale * drawn.value);
  const transform = [{ translateX: at.x }, { translateY: at.y }];
  const wipe = useDerivedValue(() =>
    rect(-WIPE_HALF, -WIPE_HALF, mark.size * drawn.value + WIPE_HALF, WIPE_HALF * 2),
  );

  if (mark.kind === "dot") {
    return (
      <Group opacity={opacity}>
        <Circle cx={at.x} cy={at.y} r={halo} color={colour} opacity={HALO.opacity}>
          <BlurMask blur={mark.size} style="normal" />
        </Circle>
        <Circle cx={at.x} cy={at.y} r={radius} color={colour} />
      </Group>
    );
  }
  return (
    <Group transform={transform} clip={wipe} opacity={opacity}>
      <AccentArt x={0} y={0} width={mark.size} colour={colour} seed={mark.seed} lead={mark.lead} />
    </Group>
  );
}
