import { useEffect, useState } from "react";
import { useNavigation } from "expo-router";
import type { NativeStackNavigationProp } from "expo-router/native-stack";

import { FIRST_VISIT, onAppeared, onLeft, type Visit } from "../logic/visit";

/** After the screen has slid back in, a beat for the UI thread to settle. */
const SETTLE_MS = 200;

/**
 * This screen's visits (`Visit`), from the native stack. A screen stays
 * mounted while another covers it, so focus alone can't tell a fresh visit:
 * this stops playing the moment the screen starts being left (so nothing
 * changes while it slides away, or under what arrives over it), and starts a
 * new visit only once it has fully come back and settled (so nothing new
 * competes with the transition).
 */
export function useVisit(): Visit {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, undefined>>>();
  const [visit, setVisit] = useState<Visit>(FIRST_VISIT);

  useEffect(() => {
    let settle: ReturnType<typeof setTimeout> | undefined;
    const offBlur = navigation.addListener("blur", () => {
      clearTimeout(settle);
      setVisit(onLeft);
    });
    const offTransition = navigation.addListener("transitionEnd", (event) => {
      if (event.data.closing) return;
      clearTimeout(settle);
      settle = setTimeout(() => setVisit(onAppeared), SETTLE_MS);
    });
    return () => {
      clearTimeout(settle);
      offBlur();
      offTransition();
    };
  }, [navigation]);

  return visit;
}
