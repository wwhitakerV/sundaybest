import { z } from "zod";

import { loadBatteryModule } from "./battery-module";

/** The phone's battery: its level as a whole percentage, and what it's doing. */
export type PowerState = {
  level: number;
  charging: boolean;
  full: boolean;
  lowPower: boolean;
};

// expo-battery's BatteryState: UNKNOWN 0, UNPLUGGED 1, CHARGING 2, FULL 3 (NOT_CHARGING 4 is Android's).
const CHARGING = 2;
const FULL = 3;

const reading = z.object({
  batteryLevel: z.number().min(0).max(1),
  batteryState: z.number().int().min(1),
  lowPowerMode: z.boolean(),
});

/**
 * expo-battery's reading, parsed: null when the phone can't say — a
 * simulator's level of -1, an unknown state, or anything that isn't a reading.
 */
export function readPowerState(raw: unknown): PowerState | null {
  const parsed = reading.safeParse(raw);
  if (!parsed.success) return null;
  const { batteryLevel, batteryState, lowPowerMode } = parsed.data;
  return {
    level: Math.round(batteryLevel * 100),
    charging: batteryState === CHARGING,
    full: batteryState === FULL,
    lowPower: lowPowerMode,
  };
}

const battery = loadBatteryModule();

/**
 * The phone's battery, kept current as it changes (expo-battery's listeners:
 * the level at most once a minute). Null when it can't be read, or on a build
 * without the battery module.
 */
export const usePowerState: () => PowerState | null = battery
  ? () => readPowerState(battery.usePowerState())
  : () => null;
