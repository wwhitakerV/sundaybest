import { useMemo } from "react";
import { Canvas, Group } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { FORMATION_PAPER } from "@/theme";
import { IDEAL_OBJECTS } from "../logic/formation-ideal";
import { sketchOf } from "../logic/formation-sketch";
import { placesAt, type HeadingBand } from "../logic/formation-track";
import { withAlpha } from "./ideal-paint";
import { TrackObject } from "./TrackObject";
import { TrackShadow } from "./TrackShadow";
import { TrackSketchLine } from "./TrackSketchLine";
import { TrackSketchMark } from "./TrackSketchMark";

export type FormationTrackBoardProps = {
  width: number;
  height: number;
  /** Where the board's top sits in the canvas: the canvas runs up under the header. */
  top: number;
  /** The heading over the board, on the board: what a passed object fades out under. */
  heading: HeadingBand;
  shown: SharedValue<number>;
  drawIn: SharedValue<number>;
  accent: string;
  testID?: string;
};

/**
 * vIdeal 2's track, in one canvas that runs from under the header to the
 * screen's foot: vIdeal's drawing where vIdeal draws it, never moving —
 * pencil, threads, dots and line art — fading where the objects have left;
 * over it, every object's shadow, alive as it moves (`TrackShadow`), then the
 * objects, riding the track (`placesAt`).
 */
export function FormationTrackBoard({
  width,
  height,
  top,
  heading,
  shown,
  drawIn,
  accent,
  testID,
}: FormationTrackBoardProps) {
  const sketch = useMemo(() => sketchOf(width), [width]);
  const places = useDerivedValue(() => placesAt(shown.value, width, heading));
  const colours = useMemo(
    () => ({
      graphite: withAlpha(FORMATION_PAPER.graphite, 1),
      quiet: withAlpha(FORMATION_PAPER.graphite, 0.75),
      red: withAlpha(accent, 1),
      thread: withAlpha(FORMATION_PAPER.connector, 1),
    }),
    [accent],
  );
  const motion = { shown, drawIn };
  return (
    <Canvas testID={testID} style={{ width, height }} pointerEvents="none">
      <Group transform={[{ translateY: top }]}>
        {sketch.lines.map((line, i) => (
          <TrackSketchLine
            key={`line-${i}`}
            line={line}
            colour={line.red ? colours.thread : colours.graphite}
            {...motion}
          />
        ))}
        {sketch.marks.map((mark, i) => (
          <TrackSketchMark
            key={`mark-${i}`}
            mark={mark}
            colour={mark.kind === "dot" || mark.red ? colours.red : colours.quiet}
            {...motion}
          />
        ))}
        {IDEAL_OBJECTS.map((object, i) => (
          <TrackShadow key={`shadow-${object.id}`} index={i} places={places} width={width} />
        ))}
        {IDEAL_OBJECTS.map((object, i) => (
          <TrackObject key={object.id} index={i} places={places} width={width} />
        ))}
      </Group>
    </Canvas>
  );
}
