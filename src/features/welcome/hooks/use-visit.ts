import { useEffect, useState } from "react";
import { useNavigation } from "expo-router";
import type { NativeStackNavigationProp } from "expo-router/native-stack";

import { FIRST_VISIT, onAppeared, onDisappeared, type Visit } from "../logic/visit";

/** After the screen has slid back in, a beat for the UI thread to settle. */
const SETTLE_MS = 200;

/**
 * This screen's visits (`Visit`), from the native stack's transitions. A
 * screen stays mounted while another covers it, so focus alone can't tell a
 * fresh visit: this goes out of view only once the screen is fully covered
 * (so nothing changes while it slides away), and starts a new visit only
 * once it has fully come back and settled (so nothing new competes with the
 * transition).
 */
export function useVisit(): Visit {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, undefined>>>();
  const [visit, setVisit] = useState<Visit>(FIRST_VISIT);

  useEffect(() => {
    let settle: ReturnType<typeof setTimeout> | undefined;
    const off = navigation.addListener("transitionEnd", (event) => {
      clearTimeout(settle);
      if (event.data.closing) setVisit(onDisappeared);
      else settle = setTimeout(() => setVisit(onAppeared), SETTLE_MS);
    });
    return () => {
      clearTimeout(settle);
      off();
    };
  }, [navigation]);

  return visit;
}
