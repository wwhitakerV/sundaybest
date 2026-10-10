import { useContext, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { EDGE_FADE } from "@/ui/organisms/frame-edges";
import { hasClearedFade } from "../logic/band-fade";

/**
 * A subpage closing on a band of its own colour (the tab bar stepped away
 * for it): once what's above the band has risen clear of the fade at the
 * screen's foot — the home indicator's inset and its fade — the fade steps
 * aside, so it never washes the band out. Scrolled back down, it returns.
 */
export function useBandFade() {
  const insetBottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const { height } = useWindowDimensions();
  const bandY = useRef<number | null>(null);
  const [cleared, setCleared] = useState(false);

  const fadeHeight = insetBottom + EDGE_FADE;

  return {
    cleared,
    /** Where the band starts in the scroll's content: the foot of what's above it. */
    onBandLayout: (y: number) => {
      bandY.current = y;
    },
    onScroll: (scrollY: number) =>
      setCleared(
        hasClearedFade({ lineY: bandY.current, scrollY, viewportHeight: height, fadeHeight }),
      ),
  };
}
