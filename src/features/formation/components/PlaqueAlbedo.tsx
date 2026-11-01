import { BlurMask, Group, Path } from "@shopify/react-native-skia";

import { FORMATION_INLAY, FORMATION_MATERIALS } from "@/theme";
import { PLAQUE_PATH } from "../logic/formation-plaque";
import type { IdealObject } from "../logic/formation-ideal";
import { RELIEF_LIGHT } from "../logic/formation-relief";
import { withAlpha } from "./ideal-paint";

/**
 * The plaque in its colour map, read off its reference (in shares of the
 * dome's radius): where it sits on the dome, past the edges that turn from
 * the light, a crisp warm-brown line at its foot (`foot`) inside a thin,
 * soft darkening (`contact`) — each how far it's thrown, how soft, how
 * dark; and its own face its own warm cream (`FORMATION_INLAY.plaque`),
 * laid over the dome's grain (`smooth`: how much of the grain it covers).
 */
const PLAQUE = {
  contact: { reach: 0.025, soft: 0.02, dark: 0.35 },
  foot: { reach: 0.009, soft: 0.004, dark: 0.6 },
  smooth: 0.8,
};

export type PlaqueAlbedoProps = { object: IdealObject; centre: number; r: number };

/** Where the plaque meets the dome, and its smoother face: laid over the dome's colour and grain. */
export function PlaqueAlbedo({ object, centre, r }: PlaqueAlbedoProps) {
  const material = FORMATION_MATERIALS[object.finish];
  const flat = Math.hypot(RELIEF_LIGHT.x, RELIEF_LIGHT.y) || 1;
  const away = { x: -RELIEF_LIGHT.x / flat, y: -RELIEF_LIGHT.y / flat };
  return (
    <Group transform={[{ translateX: centre }, { translateY: centre }, { scale: r }]}>
      {/* On the dome only, never on the plaque's own face. */}
      <Group clip={PLAQUE_PATH} invertClip>
        {[PLAQUE.contact, PLAQUE.foot].map((shadow) => (
          <Group
            key={shadow.reach}
            transform={[
              { translateX: away.x * shadow.reach },
              { translateY: away.y * shadow.reach },
            ]}
          >
            <Path
              path={PLAQUE_PATH}
              color={withAlpha(material.deep, shadow.dark)}
              blendMode="srcATop"
            >
              <BlurMask blur={shadow.soft} style="normal" />
            </Path>
          </Group>
        ))}
      </Group>
      <Path
        path={PLAQUE_PATH}
        color={withAlpha(FORMATION_INLAY.plaque, PLAQUE.smooth)}
        blendMode="srcATop"
      />
    </Group>
  );
}
