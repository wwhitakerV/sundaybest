import { BlurMask, Group, Paint, Path, Skia } from "@shopify/react-native-skia";
import type { ReactNode } from "react";

import { FORMATION_INLAY, FORMATION_MATERIALS } from "@/theme";
import type { IdealObject } from "../logic/formation-ideal";
import { PLAQUE_PATH } from "../logic/formation-plaque";
import { seededRandom } from "../logic/formation-pencil";
import { seedOf } from "../logic/formation-stone";
import { greyOf, withAlpha } from "./ideal-paint";
import { IconCut } from "./IconCut";
import { WeaveHeight, WeaveThreads } from "./StoneWeave";

/**
 * The stone's linen on a round face: its threads at the stone's own scale
 * (its radius standing for the stone's half-width), filled faintly with its
 * material's darkest tone or a neutral grey (`stain`), all of it at the
 * object's own strength — and kept off its plaque and out of its icon,
 * the edge softened (`plaqueSoft`, a share of its radius; `soft`, in the
 * icon's own units).
 */
const LINEN = { stain: 0.14, soft: 0.06, plaqueSoft: 0.012 };

const UNIT_CIRCLE = Skia.Path.Circle(0, 0, 1);

export type LinenFaceProps = { object: IdealObject; centre: number; r: number };

/** Which way its threads run (radians): seeded, so the same object always lies the same way. */
const angleOf = (object: IdealObject) => seededRandom(seedOf(object.id))() * Math.PI;

const cut = { color: greyOf(0, 1), blendMode: "dstOut" } as const;

/** Its threads at the stone's scale, inside its face, off its plaque and icon. */
function Threads({ object, centre, r, children }: LinenFaceProps & { children: ReactNode }) {
  return (
    <Group layer={<Paint />}>
      <Group transform={[{ translateX: centre }, { translateY: centre }, { scale: r }]}>
        <Group clip={UNIT_CIRCLE}>{children}</Group>
        {object.plaque && (
          <Path path={PLAQUE_PATH} {...cut}>
            <BlurMask blur={LINEN.plaqueSoft} style="normal" />
          </Path>
        )}
      </Group>
      <IconCut object={object} centre={centre} r={r} soft={LINEN.soft} />
    </Group>
  );
}

/** The linen in its height: the threads standing up a hair, catching the light. */
export function LinenHeight(props: LinenFaceProps) {
  const { linen } = props.object;
  if (!linen) return null;
  return (
    <Group layer={<Paint blendMode="plus" opacity={linen.strength} />}>
      <Threads {...props}>
        <WeaveHeight angle={angleOf(props.object)} />
      </Threads>
    </Group>
  );
}

/** The linen in its colour: the threads a shade darker than its body. */
export function LinenColour(props: LinenFaceProps) {
  const { linen, finish } = props.object;
  if (!linen) return null;
  const ink =
    linen.ink === "warm" ? FORMATION_MATERIALS[finish].deep : FORMATION_INLAY.linenNeutral;
  return (
    <Group layer={<Paint blendMode="srcATop" opacity={linen.strength} />}>
      <Threads {...props}>
        <WeaveThreads
          angle={angleOf(props.object)}
          colour={(a) => withAlpha(ink, a)}
          alpha={LINEN.stain}
        />
      </Threads>
    </Group>
  );
}
