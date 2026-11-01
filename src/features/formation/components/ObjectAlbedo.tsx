import { Circle, FractalNoise, Group, LumaColorFilter, Rect } from "@shopify/react-native-skia";

import { FORMATION_MATERIALS } from "@/theme";
import type { IdealObject } from "../logic/formation-ideal";
import { seedOf } from "../logic/formation-stone";
import { IconFaceColour } from "./IconFaceColour";
import { LinenColour } from "./LinenFace";
import { PlaqueAlbedo } from "./PlaqueAlbedo";
import { SculptedBallColour } from "./SculptedBall";
import { StoneAlbedo } from "./StoneAlbedo";
import { sculptOutlineOf } from "./sculpt-outline";
import { stoneWearOf } from "./stone-wear";

/** A matte surface's fine grain: how fine (per point of its diameter) and how strong, by its finish. */
const GRAIN = { frequency: 26, ceramic: 0.1, red: 0.08, stone: 0.22 };

export type ObjectAlbedoProps = { object: IdealObject; centre: number; r: number };

/**
 * An object's colour map, for the surface shader: its outline filled in its
 * material's own colour, the colours its icon brings, and a fine grain —
 * or, for a sculpt, the stone (`StoneAlbedo`) —
 * transparent outside it, so the shader draws nothing there.
 */
export function ObjectAlbedo({ object, centre, r }: ObjectAlbedoProps) {
  // A sculpt is stone throughout: its own material, whatever icon shaped it.
  if (object.form === "sculpt") {
    const sculpt = object.icon && sculptOutlineOf(object.icon);
    if (!sculpt) return null;
    return (
      <StoneAlbedo
        wear={stoneWearOf(sculpt.outline, seedOf(object.id))}
        centre={centre}
        r={r}
        carving={sculpt.carving}
      />
    );
  }
  const material = FORMATION_MATERIALS[object.finish];
  return (
    <Group layer>
      <Circle cx={centre} cy={centre} r={r} color={material.body} />
      <IconFaceColour object={object} centre={centre} r={r} />
      <LinenColour object={object} centre={centre} r={r} />
      <Rect
        x={0}
        y={0}
        width={centre * 2}
        height={centre * 2}
        blendMode="srcATop"
        opacity={GRAIN[object.finish]}
      >
        <FractalNoise
          freqX={GRAIN.frequency / (r * 2)}
          freqY={GRAIN.frequency / (r * 2)}
          octaves={4}
        />
        <LumaColorFilter />
      </Rect>
      {object.plaque && <PlaqueAlbedo object={object} centre={centre} r={r} />}
      {object.form === "ball" && object.icon && (
        <SculptedBallColour icon={object.icon} centre={centre} r={r} />
      )}
    </Group>
  );
}
