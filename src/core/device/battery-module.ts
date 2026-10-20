import { requireOptionalNativeModule } from "expo";
import type * as ExpoBattery from "expo-battery";

type BatteryModule = typeof ExpoBattery;

/**
 * expo-battery, if this build has its native module — else null. Importing
 * expo-battery on a build without it throws at once, so a development client
 * built before it was added would fail to open; this way it just has no
 * battery until it's rebuilt.
 */
export function loadBatteryModule(): BatteryModule | null {
  if (!requireOptionalNativeModule("ExpoBattery")) return null;
  // Loaded only once its native module is known to be there (see above).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("expo-battery") as BatteryModule;
}
