import { BookOpen, Calendar, Link2, type LucideIcon } from "lucide-react-native";

export type WelcomeStep = {
  Icon: LucideIcon;
  /**
   * The label, split at its commas, so step 3's items can be picked out one
   * at a time ("Read", ", reflect", …). Joined, they are the full label.
   */
  parts: readonly string[];
};

/** How SundayBest works, in three steps — told by the intro story, or listed. */
export const WELCOME_STEPS: readonly WelcomeStep[] = [
  { Icon: Link2, parts: ["Paste any sermon link"] },
  { Icon: Calendar, parts: ["Get a plan for 1 to 7 days"] },
  { Icon: BookOpen, parts: ["Read", ", reflect", ", pray", ", and quiz"] },
];

export function getStepLabel(step: WelcomeStep): string {
  return step.parts.join("");
}
