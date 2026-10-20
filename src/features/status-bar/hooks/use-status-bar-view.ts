import { useContext, useState } from "react";
import { useWindowDimensions } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { usePowerState } from "@/core/device/battery";
import { usesTwentyFourHourClock } from "@/core/localization/clock";
import { useScrollToTop } from "@/ui/organisms/status-bar/scroll-to-top";
import { useStatusBarTone } from "@/ui/organisms/status-bar/tone";
import { describeBattery } from "../logic/battery-look";
import { layOutStatusBar } from "../logic/status-bar-layout";
import { describeStatusTime } from "../logic/status-time";
import { useMinuteClock } from "./use-minute-clock";

/**
 * The status bar's view model: the time now (on the phone's 12- or 24-hour
 * clock, read once a launch as iOS does), the battery, where they sit beside
 * the island or notch, its tone, and what a tap does — scroll the page up.
 */
export function useStatusBarView() {
  const now = useMinuteClock();
  const [twentyFourHour] = useState(usesTwentyFourHourClock);
  const power = usePowerState();
  const { width } = useWindowDimensions();
  const insetTop = useContext(SafeAreaInsetsContext)?.top ?? 0;
  return {
    time: describeStatusTime(now, twentyFourHour),
    battery: describeBattery(power),
    layout: layOutStatusBar(width, insetTop),
    tone: useStatusBarTone(),
    scrollToTop: useScrollToTop(),
  };
}
