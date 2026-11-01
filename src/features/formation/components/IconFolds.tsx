import { BlurMask, Group, LinearGradient, Path, vec } from "@shopify/react-native-skia";

import { ICON_FACE } from "../logic/formation-icon-faces";
import { greyOf } from "./ideal-paint";

/** How far either side of its middle the folds' fade runs (the icon's half-widths). */
const SPAN = 1.3;

/** Raised (or, `level` 0, sunk) `amount` at its left, fading to `fade` of it at its right. */
function Fading({ amount, level = 1 }: { amount: number; level?: number }) {
  const { fade } = ICON_FACE.engraved.folds;
  return (
    <LinearGradient
      start={vec(-SPAN, 0)}
      end={vec(SPAN, 0)}
      colors={[greyOf(level, amount), greyOf(level, amount * fade)]}
    />
  );
}

/**
 * The soft folds the face rolls into round an engraved icon, read off the
 * reference's eye, in the icon's own units: a rounded fold whose `crest`
 * runs round it a little way out (its outline scaled about its middle),
 * and a soft `socket` the face sinks into along its outline — so above it
 * the face rolls down into it, below it a lid catches the light — both
 * fading toward the light (`fade`). Drawn before the icon's sunk into it.
 * Each path's own colour is opaque: Skia multiplies a shader by its
 * paint's alpha.
 */
export function IconFolds({ outline }: { outline: string }) {
  const { crest, socket } = ICON_FACE.engraved.folds;
  return (
    <>
      <Group transform={[{ scale: crest.scale }]}>
        <Path
          path={outline}
          style="stroke"
          strokeWidth={crest.width}
          color={greyOf(1, 1)}
          blendMode="plus"
        >
          <Fading amount={crest.height} />
          <BlurMask blur={crest.soft} style="normal" />
        </Path>
      </Group>
      <Path path={outline} style="stroke" strokeWidth={socket.width} color={greyOf(0, 1)}>
        <Fading amount={socket.depth} level={0} />
        <BlurMask blur={socket.soft} style="normal" />
      </Path>
    </>
  );
}
