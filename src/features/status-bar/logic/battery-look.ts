import type { PowerState } from "@/core/device/battery";

/** At this level and below, the battery is red. */
const LOW_LEVEL = 20;

/**
 * How the battery is drawn: its percentage, never a fill (one would cross the
 * figures) — red when low, else ink; italic in Low Power Mode; its end cap a
 * bolt while it's on the charger. `spoken` is how VoiceOver reads it. Nothing
 * when the phone can't say.
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
    italic: power.lowPower,
    endCap: onCharger ? "bolt" : "dot",
    spoken,
  } as const;
}
