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
import { withAlpha } from "./ideal-paint";
import type { Patch } from "./stone-marks";
import { polyline } from "./stone-paths";

const TONES = {
  cream: FORMATION_INLAY.stoneCream,
  putty: FORMATION_INLAY.stonePutty,
  dusk: FORMATION_INLAY.stoneDusk,
} as const;

/** Where a patch's edge breaks up: noise below this, and it's gone. */
const BREAK = { fine: 5, from: 0.22, gain: 3 };

/**
 * Its patches of tone — cream, putty, dusk — laid over its colour (and only
 * on it), each soft or crisp at its edge, their edges broken up a little as
 * layered plaster's are.
 */
export function StonePatches({ patches }: { patches: Patch[] }) {
  return (
    <Group layer={<Paint blendMode="srcATop" />}>
      {patches.map((patch, i) => (
        <Path
          key={`patch-${i}`}
          path={polyline(patch.points, true)}
          color={withAlpha(TONES[patch.tone], patch.strength)}
        >
          <BlurMask blur={patch.soft} style="normal" />
        </Path>
      ))}
      <Rect x={-1.5} y={-1.5} width={3} height={3} blendMode="dstIn">
        <FractalNoise freqX={BREAK.fine} freqY={BREAK.fine} octaves={3} />
        <ColorMatrix
          matrix={[
            ...[0, 0, 0, 0, 0],
            ...[0, 0, 0, 0, 0],
            ...[0, 0, 0, 0, 0],
            ...[
              0.2126 * BREAK.gain,
              0.7152 * BREAK.gain,
              0.0722 * BREAK.gain,
              0,
              -BREAK.from * BREAK.gain,
            ],
          ]}
        />
      </Rect>
    </Group>
  );
}
