import {
  BlurMask,
  ColorMatrix,
  FractalNoise,
  Group,
  Paint,
  Path,
  Rect,
} from "@shopify/react-native-skia";

import { FORMATION_INLAY } from "@/theme";
import { STONE } from "../logic/formation-stone";
import { tintNoise, withAlpha } from "./ideal-paint";
import { polyline } from "./stone-paths";
import type { StoneWear } from "./stone-wear";

/** How patchy a bloom's powder is: where the noise falls below this, it's gone. */
const POWDER = { from: 0.35, gain: 3 };

/**
 * Its blooms: pure white patches, soft-edged and broken up as dry powder
 * is — laid over its colour (and only on it), so the grain and specks under them go quiet.
 */
export function StoneBloom({ blooms }: { blooms: StoneWear["blooms"] }) {
  const { soft, strength, break: fine } = STONE.bloom;
  return (
    <Group layer={<Paint blendMode="srcATop" />}>
      {blooms.map((bloom, i) => (
        <Path
          key={`bloom-${i}`}
          path={polyline(bloom, true)}
          color={withAlpha(FORMATION_INLAY.stoneBloom, strength)}
        >
          <BlurMask blur={soft} style="normal" />
        </Path>
      ))}
      <Rect x={-1.5} y={-1.5} width={3} height={3} blendMode="dstIn">
        <FractalNoise freqX={fine} freqY={fine} octaves={3} />
        <ColorMatrix matrix={tintNoise(FORMATION_INLAY.stoneBloom, POWDER.gain, POWDER.from)} />
      </Rect>
    </Group>
  );
}
