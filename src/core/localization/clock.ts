import { getCalendars } from "expo-localization";

/**
 * Whether the iPhone is set to 24-hour time (Settings › General › Date & Time),
 * so a time written in the app matches iOS's own — its time wheel, its clock.
 * iOS reads the setting once per launch. When it can't be read, the app keeps
 * its 12-hour clock. See ADR 0025.
 */
export function usesTwentyFourHourClock(): boolean {
  return getCalendars()[0].uses24hourClock === true;
}
