import { BlurMask, Group, Path } from "@shopify/react-native-skia";

import { FORMATION_MATERIALS } from "@/theme";
import { PLAQUE_PATH } from "../logic/formation-glyphs";
import type { IdealObject } from "../logic/formation-ideal";
import { RELIEF_LIGHT } from "../logic/formation-relief";
import { withAlpha } from "./ideal-paint";

/**
 * The plaque in its colour map, read off its reference (in shares of the
 * dome's radius): a thin, soft darkening on the dome just past the edges
 * that turn from the light, where it sits on the dome (`contact`: how far
 * it's thrown, how soft, how dark); and its own face smoother than the
 * dome's sandy grain (`smooth`: how much of the grain it lays its own
 * colour back over).
 */
const PLAQUE = { contact: { reach: 0.025, soft: 0.02, dark: 0.35 }, smooth: 0.6 };

export type PlaqueAlbedoProps = { object: IdealObject; centre: number; r: number };

/** Where the plaque meets the dome, and its smoother face: laid over the dome's colour and grain. */
export function PlaqueAlbedo({ object, centre, r }: PlaqueAlbedoProps) {
  const material = FORMATION_MATERIALS[object.finish];
  const flat = Math.hypot(RELIEF_LIGHT.x, RELIEF_LIGHT.y) || 1;
  const away = { x: -RELIEF_LIGHT.x / flat, y: -RELIEF_LIGHT.y / flat };
  const { contact } = PLAQUE;
  return (
    <Group transform={[{ translateX: centre }, { translateY: centre }, { scale: r }]}>
      {/* On the dome only, never on the plaque's own face. */}
      <Group clip={PLAQUE_PATH} invertClip>
        <Group
          transform={[
            { translateX: away.x * contact.reach },
            { translateY: away.y * contact.reach },
          ]}
        >
          <Path
            path={PLAQUE_PATH}
            color={withAlpha(material.deep, contact.dark)}
            blendMode="srcATop"
          >
            <BlurMask blur={contact.soft} style="normal" />
          </Path>
        </Group>
      </Group>
      <Path
        path={PLAQUE_PATH}
        color={withAlpha(material.body, PLAQUE.smooth)}
        blendMode="srcATop"
      />
    </Group>
  );
}
