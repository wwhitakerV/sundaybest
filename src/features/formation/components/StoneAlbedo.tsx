import { ColorMatrix, FractalNoise, Group, Path, Rect } from "@shopify/react-native-skia";

import { FORMATION_INLAY, FORMATION_MATERIALS } from "@/theme";
import { STONE } from "../logic/formation-stone";
import { tintNoise, withAlpha } from "./ideal-paint";
import { StonePatches } from "./StonePatches";
import { StoneGrime } from "./StoneGrime";
import { polyline } from "./stone-paths";
import type { StoneWear } from "./stone-wear";
import { Smudges, smudgePaths, WeaveGrime } from "./StoneWeave";

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
  /** The icon's strokes carved into it: grime gathers in them. */
  carving?: string | null;
};

/**
 * A stone sculpt's colour map, for any outline: the putty stone, its
 * patches of tone (`StonePatches`), faintly mottled and speckled; over them
 * its big rubbed smudges, its weave faintly dirty all over and filled with
 * grime inside the smudges, and its grime (`StoneGrime`, and in its
 * carving), so dirt is never
 * painted out; a couple of orange-red flecks. (Its hollows' grey-brown is the light's too: the surface
 * shader stains whatever lies lower than either side of it.)
 */
export function StoneAlbedo({ wear, centre, r, carving }: StoneAlbedoProps) {
  const stone = FORMATION_MATERIALS.stone;
  const { mottle, speckle } = STONE;
  const smudges = smudgePaths(wear.smudges);
  return (
    <Group transform={[{ translateX: centre }, { translateY: centre }, { scale: r }]}>
      <Group layer>
        <Path path={wear.outline} color={stone.body} />
        <StonePatches patches={wear.patches} />
        <Tint fine={mottle.fine} matrix={tintNoise(stone.shade, mottle.strength, mottle.from)} />
        <Tint fine={speckle.fine} matrix={tintNoise(stone.shade, speckle.strength, speckle.from)} />
        <Smudges smudges={smudges} />
        <WeaveGrime angle={wear.weave} smudges={smudges} />
        <StoneGrime wear={wear} />
        {carving && (
          <Path
            path={carving}
            style="stroke"
            strokeWidth={STONE.carve.width}
            strokeCap="round"
            strokeJoin="round"
            color={withAlpha(FORMATION_INLAY.stoneGrime, STONE.carve.grime)}
            blendMode="srcATop"
          />
        )}
        {wear.flecks.map((fleck, i) => (
          <Path
            key={`fleck-${i}`}
            path={polyline(fleck, true)}
            color={FORMATION_INLAY.stoneFleck}
            blendMode="srcATop"
          />
        ))}
      </Group>
    </Group>
  );
}
