import {
  Blur,
  BlurMask,
  Circle,
  FractalNoise,
  Group,
  ColorMatrix,
  Paint,
  Path,
  RadialGradient,
  Rect,
  vec,
} from "@shopify/react-native-skia";

import { GLYPHS, GLYPH_FIT, GLYPH_SPAN, sculptOutlineOf } from "../logic/formation-glyphs";
import type { IdealObject } from "../logic/formation-ideal";
import { BODY_TOP, profileOf, reliefFormOf } from "../logic/formation-relief";
import { seedOf } from "../logic/formation-stone";
import { greyNoise, greyOf } from "./ideal-paint";
import { stoneWearOf } from "./stone-wear";
import { StoneHeight } from "./StoneHeight";
import { PlaqueHeight } from "./PlaqueHeight";

/**
 * How much a symbol stands up from, or sinks into, its face (0–1 of the
 * map's height), and how soft its edges are (in the lucide grid's units).
 */
const SET = { raised: 0.22, ridge: 0.16, groove: 0.3, soft: 0.6, bead: 0.22 };
/** How deep each symbol's sunk part goes: the red eye's almond only a shallow dish. */
const SUNK = { eye: 0.22, almond: 0.12, shieldCheck: 0.26, brain: 0, mouth: 0 } as const;
/** The whole map softened a touch (points): no step in it ever reads as a ridge. */
const SOFTEN = 0.5;
/**
 * A fine tooth over every surface, in its height: it breaks up the map's
 * steps, and catches the light as a matte surface's tooth does (how fine,
 * per point of the radius, and how deep).
 */
const TOOTH = { fine: 4, depth: 0.018 };

export type ObjectHeightProps = { object: IdealObject; centre: number; r: number };

/** The symbol's heights, on the lucide grid placed on the face. */
function GlyphHeight({ object, centre, r }: ObjectHeightProps) {
  if (!object.glyph) return null;
  const fit = GLYPH_FIT[object.glyph];
  const scale = (fit.width * r) / GLYPH_SPAN;
  const drawing = GLYPHS[object.glyph];
  const up = (a: number) => greyOf(1, a);
  const down = (a: number) => greyOf(0, a);
  const line = { style: "stroke", strokeCap: "round", strokeJoin: "round" } as const;
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
      {drawing.sunk && (
        <Path path={drawing.sunk} color={down(SUNK[object.glyph])}>
          <BlurMask blur={SET.soft} style="normal" />
        </Path>
      )}
      {drawing.raised && (
        <Path path={drawing.raised} color={up(SET.raised)} blendMode="plus">
          <BlurMask blur={SET.soft} style="normal" />
        </Path>
      )}
      {drawing.grooves?.map((d) => (
        <Path key={d} path={d} {...line} strokeWidth={1.3} color={down(SET.groove)}>
          <BlurMask blur={0.45} style="normal" />
        </Path>
      ))}
      {drawing.ridges?.map((d) => (
        <Path key={d} path={d} {...line} strokeWidth={1.8} color={up(SET.ridge)} blendMode="plus">
          <BlurMask blur={0.4} style="normal" />
        </Path>
      ))}
      {drawing.bead && (
        <Circle cx={12} cy={12} r={drawing.bead === "pearl" ? 3.2 : 3} blendMode="plus">
          <RadialGradient
            c={vec(12, 12)}
            r={3.2}
            colors={[up(SET.bead), up(SET.bead * 0.6), up(0)]}
          />
        </Circle>
      )}
      {drawing.bead === "pupil" && <Circle cx={12} cy={12} r={0.95} color={down(0.7)} />}
    </Group>
  );
}

/**
 * An object's height map, white highest, for the surface shader: its body's
 * profile — the ceramic's cap, the puck's rounded rim, the shield's pillow,
 * the brain's ball, the heart's pitted mound — and its symbol raised from
 * it or sunk into it.
 */
export function ObjectHeight({ object, centre, r }: ObjectHeightProps) {
  const form = reliefFormOf(object);
  const size = centre * 2;
  return (
    <Group
      layer={
        <Paint>
          <Blur blur={SOFTEN} />
        </Paint>
      }
    >
      <Rect x={0} y={0} width={size} height={size} color={greyOf(0, 1)} />
      {form === "heart" ? (
        <StoneHeight
          wear={stoneWearOf(sculptOutlineOf(object), seedOf(object.id))}
          centre={centre}
          r={r}
        />
      ) : (
        <Circle cx={centre} cy={centre} r={r}>
          <RadialGradient
            c={vec(centre, centre)}
            r={r}
            colors={profileOf(form).height.map((h) => greyOf(h * BODY_TOP, 1))}
            positions={profileOf(form).at}
          />
        </Circle>
      )}
      {/* The tooth goes on before the plaque and the symbol, which are smoother. */}
      <Rect x={0} y={0} width={size} height={size} blendMode="plus">
        <FractalNoise freqX={(TOOTH.fine / r) * 10} freqY={(TOOTH.fine / r) * 10} octaves={2} />
        <ColorMatrix matrix={greyNoise(TOOTH.depth)} />
      </Rect>
      {object.plaque && <PlaqueHeight object={object} centre={centre} r={r} />}
      <GlyphHeight object={object} centre={centre} r={r} />
    </Group>
  );
}
