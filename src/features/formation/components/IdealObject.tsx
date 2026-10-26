import type { SharedValue } from "react-native-reanimated";

import { useObjectMaps, MAP_BOX } from "../hooks/use-object-maps";
import type { IdealObject as IdealObjectData } from "../logic/formation-ideal";
import { LitObject } from "./LitObject";

export type IdealObjectProps = {
  object: IdealObjectData;
  cx: number;
  cy: number;
  diameter: number;
  /** Toward the light where it is now, as it moves (`lightAt`); still, its own station's. */
  light?: SharedValue<number[]>;
};

/**
 * One of vIdeal's objects — a cream ceramic dome, a red puck, the red ball,
 * the stone heart — drawn as the one light falls on its shape and the
 * symbol set into it (`LitObject`), from maps made once for its size.
 */
export function IdealObject({ object, cx, cy, diameter, light }: IdealObjectProps) {
  const r = diameter / 2;
  const maps = useObjectMaps(object, r);
  if (!maps) return null;
  return (
    <LitObject
      object={object}
      cx={cx}
      cy={cy}
      r={r}
      box={r * MAP_BOX * 2}
      maps={maps}
      {...(light && { light })}
    />
  );
}
