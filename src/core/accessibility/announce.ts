import { AccessibilityInfo } from "react-native";

/**
 * Has VoiceOver say `message` now — for a change the screen shows but a
 * VoiceOver user wouldn't otherwise hear, like an answer moving elsewhere.
 * Never used for anything personal: it's spoken aloud.
 */
export function announce(message: string): void {
  if (message) AccessibilityInfo.announceForAccessibility(message);
}
