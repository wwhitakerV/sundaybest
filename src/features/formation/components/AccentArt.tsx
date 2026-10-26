import type { ComponentProps } from "react";
import { Circle, Group, Line, vec } from "@shopify/react-native-skia";

import { accentMarksOf } from "../logic/formation-accents";

/** The weight of its lines (points). */
const WEIGHT = 0.7;

export type AccentArtProps = {
  /** Its start, at its middle line, in points. */
  x: number;
  y: number;
  width: number;
  /** Its colour: fixed, or one that changes as it moves (vIdeal 2's, taking the red). */
  colour: NonNullable<ComponentProps<typeof Line>["color"]>;
  seed: number;
  /** A dash leading in, as the label it stands for had. */
  lead?: boolean;
};

/** The line art standing where a label stood: drawn into a Skia canvas, from `accentMarksOf`. */
export function AccentArt({ x, y, width, colour, seed, lead = false }: AccentArtProps) {
  const marks = accentMarksOf(width, seed, lead);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      {marks.map((mark) =>
        mark.kind === "ring" ? (
          <Circle
            key={`r${mark.x}`}
            cx={mark.x}
            cy={mark.y}
            r={mark.r}
            style="stroke"
            strokeWidth={WEIGHT}
            color={colour}
          />
        ) : (
          <Line
            key={`l${mark.x1}-${mark.y1}`}
            p1={vec(mark.x1, mark.y1)}
            p2={vec(mark.x2, mark.y2)}
            style="stroke"
            strokeWidth={WEIGHT}
            strokeCap="round"
            color={colour}
          />
        ),
      )}
    </Group>
  );
}
