import { StyleSheet, View } from "react-native";

import { edgeFade, useTheme } from "@/theme";
import { TopFade } from "@/ui/atoms/TopFade";
import { getHeaderBackdrop, type HeaderFade } from "./frame-edges";

export type HeaderBackdropProps = {
  fade: HeaderFade;
  /** Fully opaque at its solid end, not the edges' lighter peak (`edgeFade.peak`). */
  solid?: boolean;
  testID: string;
};

/**
 * A floating header's background, drawn inside the header's own block so
 * it's always exactly the header's size, measured or not: the page's colour
 * down the block, then its fade (`getHeaderBackdrop`) to clear — so nothing
 * scrolling under the header ever shows through it. Never takes touches.
 */
export function HeaderBackdrop({ fade, solid = false, testID }: HeaderBackdropProps) {
  const theme = useTheme();
  const peak = solid ? 1 : edgeFade.peak;
  const { past, fade: fadeHeight, ramp } = getHeaderBackdrop(fade);

  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={[styles.backdrop, { bottom: past > 0 ? -past : 0 }]}
    >
      {/* At the edges' peak, as the gradient below starts: no seam between them. */}
      <View
        testID={`${testID}-solid`}
        style={[styles.solid, { backgroundColor: theme.colors.background, opacity: peak }]}
      />
      <View style={{ height: fadeHeight }}>
        <TopFade height={fadeHeight} solidHeight={0} ramp={ramp} peak={peak} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: "absolute", top: 0, left: 0, right: 0 },
  solid: { flex: 1 },
});
