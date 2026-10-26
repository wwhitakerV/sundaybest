import { Group } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { IDEAL_OBJECTS } from "../logic/formation-ideal";
import { lightAt } from "../logic/formation-shadow";
import type { TrackPlace } from "../logic/formation-track";
import { IdealObject } from "./IdealObject";

export type TrackObjectProps = {
  index: number;
  places: SharedValue<TrackPlace[]>;
  width: number;
};

/**
 * One of vIdeal 2's objects, exactly as vIdeal draws it, carried along the
 * track, its lit side turning with the light of wherever it is (`lightAt`).
 * (Its shadow is drawn beneath every object, alive as it moves: `TrackShadow`.)
 */
export function TrackObject({ index, places, width }: TrackObjectProps) {
  const object = IDEAL_OBJECTS[index]!;
  const shared = {
    object,
    cx: object.x * width,
    cy: object.y * width,
    diameter: object.d * width,
  };
  const transform = useDerivedValue(() => {
    const place = places.value[index]!;
    return [{ translateX: place.dx }, { translateY: place.dy }];
  });
  const presence = useDerivedValue(() => places.value[index]!.presence);
  const light = useDerivedValue(() => lightAt(places.value[index]!.u));
  return (
    <Group transform={transform} opacity={presence}>
      <IdealObject {...shared} light={light} />
    </Group>
  );
}
