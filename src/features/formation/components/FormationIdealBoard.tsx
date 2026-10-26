import { Canvas, Group } from "@shopify/react-native-skia";

import { IDEAL_HEIGHT, IDEAL_OBJECTS } from "../logic/formation-ideal";
import { IdealLinework } from "./IdealLinework";
import { IdealObject } from "./IdealObject";
import { IdealShadow } from "./IdealShadow";

export type FormationIdealBoardProps = {
  width: number;
  /** The red its threads, dots and red line art are drawn in. */
  accent: string;
  testID?: string;
};

/**
 * vIdeal's board, its reference redrawn whole, as the paper sees it from
 * the bottom up: the pencil, threads, dots and line art laid on it; every
 * object's colour, shadow and contact shadow falling over them, each from
 * its own fitted shadow (`SHADOW_FITS`); then the objects themselves.
 * Its height follows its width (`IDEAL_HEIGHT`), so it keeps its shape on
 * every iPhone.
 */
export function FormationIdealBoard({ width, accent, testID }: FormationIdealBoardProps) {
  const placed = IDEAL_OBJECTS.map((object) => {
    const diameter = object.d * width;
    return {
      object,
      cx: object.x * width,
      cy: object.y * width,
      diameter,
    };
  });
  return (
    <Canvas testID={testID} style={{ width, height: width * IDEAL_HEIGHT }} pointerEvents="none">
      <IdealLinework width={width} accent={accent} />
      <Group>
        {placed.map((one) => (
          <IdealShadow key={`shadow-${one.object.id}`} {...one} />
        ))}
      </Group>
      {placed.map((one) => (
        <IdealObject key={one.object.id} {...one} />
      ))}
    </Canvas>
  );
}
