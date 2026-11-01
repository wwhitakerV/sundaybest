import { Group, type SkImage } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { IDEAL_OBJECTS } from "../logic/formation-ideal";
import type { TrackPlace } from "../logic/formation-track";
import { IdealObject } from "./IdealObject";

export type TrackObjectProps = {
  index: number;
  places: SharedValue<TrackPlace[]>;
  width: number;
  /** Its artwork (`useFacultyArt`). */
  image: SkImage | null;
};

/**
 * One of vIdeal 2's objects — its faculty's artwork, the art's own light
 * held still — carried along the track.
 * (Its shadow is drawn beneath every object, alive as it moves: `TrackShadow`.)
 */
export function TrackObject({ index, places, width, image }: TrackObjectProps) {
  const object = IDEAL_OBJECTS[index]!;
  const transform = useDerivedValue(() => {
    const place = places.value[index]!;
    return [{ translateX: place.dx }, { translateY: place.dy }];
  });
  const presence = useDerivedValue(() => places.value[index]!.presence);
  return (
    <Group transform={transform} opacity={presence}>
      <IdealObject
        cx={object.x * width}
        cy={object.y * width}
        diameter={object.d * width}
        image={image}
      />
    </Group>
  );
}
