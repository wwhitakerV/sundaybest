import { useMemo } from "react";
import { LinearGradient, Path, Skia, vec } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import type { SketchLine } from "../logic/formation-sketch";
import { drawnInAt, linesLeftAt, smooth } from "../logic/formation-track";
import { addSmooth } from "./track-path";

/**
 * How a line fades as its station empties: all of it at once, its far end
 * a little ahead of its near end (`lead`, of the fade), so it thins along
 * its length rather than cutting out.
 */
const FADE = { lead: 0.5, over: 1.5 };

type Point = { x: number; y: number };

export type TrackSketchLineProps = {
  line: SketchLine;
  shown: SharedValue<number>;
  drawIn: SharedValue<number>;
  colour: Float32Array;
};

/**
 * One of vIdeal's lines, where vIdeal draws it, never moving. Once the last
 * object has left its station it fades, its far end first, along a
 * gradient, never cut off.
 */
export function TrackSketchLine({ line, shown, drawIn, colour }: TrackSketchLineProps) {
  const count = line.points.length / 2;
  const first = { x: line.points[0]!, y: line.points[1]! };
  const last = { x: line.points[count * 2 - 2]!, y: line.points[count * 2 - 1]! };
  const path = useMemo(() => {
    const points: Point[] = [];
    for (let i = 0; i < count; i += 1) {
      points.push({ x: line.points[i * 2]!, y: line.points[i * 2 + 1]! });
    }
    const builder = Skia.PathBuilder.Make();
    addSmooth(builder, points);
    return builder.build();
  }, [count, line.points]);
  const colours = useDerivedValue(() => {
    const here = linesLeftAt(line.station, shown.value) * FADE.over;
    const near = smooth(here) * line.opacity;
    const far = smooth(here - FADE.lead) * line.opacity;
    return [
      Float32Array.of(colour[0]!, colour[1]!, colour[2]!, near),
      Float32Array.of(colour[0]!, colour[1]!, colour[2]!, far),
    ];
  });
  const end = useDerivedValue(() => drawnInAt(drawIn.value, line.restY));
  return (
    <Path path={path} start={0} end={end} style="stroke" strokeWidth={line.width} strokeCap="round">
      <LinearGradient start={vec(first.x, first.y)} end={vec(last.x, last.y)} colors={colours} />
    </Path>
  );
}
