import { useMemo } from "react";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { IDEAL_OBJECTS } from "../logic/formation-ideal";
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
};

/** One part of a moving object's shadow — its cast shadow or its contact shadow — reshaped every frame. */
function SoftCopy({ index, part, places, width }: SoftCopyProps) {
  const object = IDEAL_OBJECTS[index]!;
  const r = (object.d * width) / 2;
  const share = object.d / 2;
  // Its tint worked out once, here: only its strength changes as it moves, set on the UI thread.
  const tint = useMemo(() => withAlpha(TINTS[object.finish], 1), [object.finish]);
  const now = useDerivedValue(() => {
    const place = places.value[index]!;
    const fit = shadowAt(place.u, share);
    return { place, angle: fit.angle, it: fit[part] };
  });
  const transform = useDerivedValue(() =>
    shadowTransform(now.value.place.x, now.value.place.y, r, now.value.angle, now.value.it),
  );
  const blur = useDerivedValue(() => now.value.it.blur / now.value.it.s);
  const colour = useDerivedValue(() =>
    Float32Array.of(
      tint[0] ?? 0,
      tint[1] ?? 0,
      tint[2] ?? 0,
      now.value.it.a * now.value.place.presence,
    ),
  );
  return (
    <ShadowCopy heart={object.form === "heart"} transform={transform} blur={blur} colour={colour} />
  );
}

export type TrackShadowProps = {
  index: number;
  places: SharedValue<TrackPlace[]>;
  width: number;
};

/**
 * A moving object's shadow, alive: at the height of where it is — the
 * station in hand highest, each one down lower, rising on above it — and
 * in that place's light (`shadowAt`), fading as the object does under the
 * heading.
 */
export function TrackShadow(props: TrackShadowProps) {
  return (
    <>
      <SoftCopy part="cast" {...props} />
      <SoftCopy part="contact" {...props} />
    </>
  );
}
