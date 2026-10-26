import {
  Circle,
  FractalNoise,
  Group,
  LumaColorFilter,
  Path,
  Rect,
} from "@shopify/react-native-skia";

import { FORMATION_INLAY, FORMATION_MATERIALS } from "@/theme";
import { GLYPHS, GLYPH_FIT, GLYPH_SPAN, sculptOutlineOf } from "../logic/formation-glyphs";
import type { IdealObject } from "../logic/formation-ideal";
import { seedOf } from "../logic/formation-stone";
import { PlaqueAlbedo } from "./PlaqueAlbedo";
import { StoneAlbedo } from "./StoneAlbedo";
import { stoneWearOf } from "./stone-wear";

/** A matte surface's fine grain: how fine (per point of its diameter) and how strong, by its finish. */
const GRAIN = { frequency: 26, ceramic: 0.1, red: 0.08, stone: 0.22 };

export type ObjectAlbedoProps = { object: IdealObject; centre: number; r: number };

/** The colours set into the face: the almond's deeper red and its pearl, the badge's dark red and its white check, the pupil's hole. */
function GlyphColour({ object, centre, r }: ObjectAlbedoProps) {
  if (!object.glyph) return null;
  const fit = GLYPH_FIT[object.glyph];
  const scale = (fit.width * r) / GLYPH_SPAN;
  const drawing = GLYPHS[object.glyph];
  const red = FORMATION_MATERIALS.red;
  return (
    <Group
      transform={[
        { translateX: centre },
        { translateY: centre },
        { scale },
        { scaleY: fit.stretch },
        { translateX: -12 },
        { translateY: -12 },
      ]}
    >
      {object.glyph === "almond" && drawing.sunk && <Path path={drawing.sunk} color={red.shade} />}
      {object.glyph === "almond" && (
        <Circle cx={12} cy={12} r={3.2} color={FORMATION_INLAY.pearl} />
      )}
      {object.glyph === "shieldCheck" && drawing.sunk && (
        <Path path={drawing.sunk} color={FORMATION_INLAY.recess} />
      )}
      {object.glyph === "shieldCheck" &&
        drawing.ridges?.map((d) => (
          <Path
            key={d}
            path={d}
            style="stroke"
            strokeWidth={1.8}
            strokeCap="round"
            strokeJoin="round"
            color={FORMATION_INLAY.check}
          />
        ))}
      {drawing.bead === "pupil" && (
        <Circle cx={12} cy={12} r={0.95} color={FORMATION_INLAY.ceramicInk} />
      )}
    </Group>
  );
}

/**
 * An object's colour map, for the surface shader: its outline filled in its
 * material's own colour, the colours set into its face, and a fine grain —
 * or, for a sculpt, the stone (`StoneAlbedo`) —
 * transparent outside it, so the shader draws nothing there.
 */
export function ObjectAlbedo({ object, centre, r }: ObjectAlbedoProps) {
  // A sculpt is stone throughout: its own material, whatever icon shaped it.
  if (object.form === "heart") {
    return (
      <StoneAlbedo
        wear={stoneWearOf(sculptOutlineOf(object), seedOf(object.id))}
        centre={centre}
        r={r}
      />
    );
  }
  const material = FORMATION_MATERIALS[object.finish];
  return (
    <Group layer>
      <Circle cx={centre} cy={centre} r={r} color={material.body} />
      <GlyphColour object={object} centre={centre} r={r} />
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
    </Group>
  );
}
