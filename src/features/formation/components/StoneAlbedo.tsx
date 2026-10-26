import { Circle, ColorMatrix, FractalNoise, Group, Path, Rect } from "@shopify/react-native-skia";

import { FORMATION_INLAY, FORMATION_MATERIALS, FORMATION_PAPER } from "@/theme";
import { STONE } from "../logic/formation-stone";
import { tintNoise } from "./ideal-paint";
import { StoneBloom } from "./StoneBloom";
import { StoneGrime } from "./StoneGrime";
import type { StoneWear } from "./stone-wear";

/** Noise over the whole stone, tinted by `matrix`, laid on its colour. */
function Tint({
  fine,
  across = fine,
  matrix,
}: {
  fine: number;
  across?: number;
  matrix: number[];
}) {
  return (
    <Rect x={-2} y={-2} width={4} height={4} blendMode="srcATop">
      <FractalNoise freqX={fine} freqY={across} octaves={2} />
      <ColorMatrix matrix={matrix} />
    </Rect>
  );
}

export type StoneAlbedoProps = {
  wear: StoneWear;
  centre: number;
  /** The sculpt's half-width (points): its outline's unit. */
  r: number;
};

/**
 * A stone sculpt's colour map, for any outline: the white stone, faintly
 * mottled and speckled in its own shade in patches, the weave's dark flecks; its grime
 * (`StoneGrime`); its pure white blooms over that (`StoneBloom`); a red
 * fleck or two. (Its hollows' grey-brown is the light's too: the surface
 * shader stains whatever lies lower than either side of it.)
 */
export function StoneAlbedo({ wear, centre, r }: StoneAlbedoProps) {
  const stone = FORMATION_MATERIALS.stone;
  const { mottle, speckle, weave } = STONE;
  const turn = wear.weave;
  return (
    <Group transform={[{ translateX: centre }, { translateY: centre }, { scale: r }]}>
      <Group layer>
        <Path path={wear.outline} color={stone.body} />
        <Tint fine={mottle.fine} matrix={tintNoise(stone.shade, mottle.strength, mottle.from)} />
        <Tint fine={speckle.fine} matrix={tintNoise(stone.shade, speckle.strength, speckle.from)} />
        {[turn, turn + Math.PI / 2].map((angle) => (
          <Group key={`weave-${angle}`} transform={[{ rotate: angle }]}>
            <Tint
              fine={weave.fine}
              across={weave.fine / weave.dash}
              matrix={tintNoise(FORMATION_INLAY.stoneGrime, weave.flecks, weave.from)}
            />
          </Group>
        ))}
        <StoneGrime wear={wear} />
        <StoneBloom blooms={wear.blooms} />
        {wear.flecks.map((f, i) => (
          <Circle
            key={`fleck-${i}`}
            cx={f.x}
            cy={f.y}
            r={f.r}
            color={FORMATION_PAPER.connector}
            blendMode="srcATop"
          />
        ))}
      </Group>
    </Group>
  );
}
