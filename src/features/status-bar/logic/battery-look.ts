import type { PowerState } from "@/core/device/battery";

/** At this level and below, the battery is red. */
const LOW_LEVEL = 20;

/**
 * How the battery is drawn: a brush stroke as long as the charge — never
 * figures, which would claim a precision iOS doesn't give apps (its level
 * comes in 5% steps) — red when low, else ink; hollow in Low Power Mode; a
 * bolt after it while it's on the charger. `spoken` is how
 * VoiceOver reads it. Nothing when the phone can't say.
 */
export function describeBattery(power: PowerState | null) {
  if (!power) return null;
  const onCharger = power.charging || power.full;
  const tone = power.level <= LOW_LEVEL ? "low" : "ink";
  const spoken = [
    `Battery ${power.level} percent`,
    ...(onCharger ? ["charging"] : []),
    ...(power.lowPower ? ["Low Power Mode"] : []),
  ].join(", ");
  return {
    level: power.level,
    tone,
    hollow: power.lowPower,
    charging: onCharger,
    spoken,
  } as const;
}
