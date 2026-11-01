import { useMemo } from "react";
import type { SkImage } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { IDEAL_OBJECTS } from "../logic/formation-ideal";
import { lampLight } from "../logic/formation-light";
import { shadowAt } from "../logic/formation-shadow";
import type { TrackPlace } from "../logic/formation-track";
import { withAlpha } from "./ideal-paint";
import { TINTS } from "./IdealShadow";
import { shadowTransform } from "./shadow-shape";
import { ShadowCopy } from "./ShadowCopy";

type PartName = "cast" | "contact";

type SoftCopyProps = {
  index: number;
  part: PartName;
  places: SharedValue<TrackPlace[]>;
  width: number;
  image: SkImage;
};

/** One part of a moving object's shadow — its cast shadow or its contact shadow — reshaped every frame. */
function SoftCopy({ index, part, places, width, image }: SoftCopyProps) {
  const object = IDEAL_OBJECTS[index]!;
  const r = (object.d * width) / 2;
  const share = object.d / 2;
  // Its tint worked out once, here: only its strength changes as it moves, set on the UI thread.
  const tint = useMemo(() => withAlpha(TINTS[object.finish], 1), [object.finish]);
  const now = useDerivedValue(() => {
    const place = places.value[index]!;
    const fit = shadowAt(place.u, share, lampLight(place.x / width, place.y / width, place.u));
    return { place, angle: fit.angle, it: fit[part] };
  });
  const transform = useDerivedValue(() =>
    shadowTransform(now.value.place.x, now.value.place.y, r, now.value.angle, now.value.it),
  );
  const blur = useDerivedValue(() => now.value.it.blur * r);
  const strength = useDerivedValue(() => now.value.it.a * now.value.place.presence);
  return (
    <ShadowCopy image={image} transform={transform} blur={blur} tint={tint} strength={strength} />
  );
}

export type TrackShadowProps = {
  index: number;
  places: SharedValue<TrackPlace[]>;
  width: number;
  /** Its artwork, whose outline it throws; nothing until it's ready. */
  image: SkImage | null;
};

/**
 * A moving object's shadow, alive: at the height of where it is — the
 * station in hand highest, each one down lower, rising on above it — and
 * in the lamp's light there (`lampLight`, `shadowAt`) — turning, and drawn
 * out longer, the further it is from the lamp — fading as the object does under the
 * heading. Its shape is its artwork's outline.
 */
export function TrackShadow({ image, ...props }: TrackShadowProps) {
  if (!image) return null;
  return (
    <>
      <SoftCopy part="cast" image={image} {...props} />
      <SoftCopy part="contact" image={image} {...props} />
    </>
  );
}
