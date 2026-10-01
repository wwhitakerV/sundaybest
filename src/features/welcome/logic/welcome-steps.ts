import { BookOpen, Calendar, Link2, type LucideIcon } from "lucide-react-native";

/**
 * One item of a step's label: the words leading into it (", ", ", and ") and
 * the item itself. Only the item is ever picked out — never its comma.
 */
type StepPart = { lead: string; item: string };

export type WelcomeStep = {
  Icon: LucideIcon;
  /**
   * The label, split into its items, so step 3's can be picked out one at a
   * time ("Read", "reflect", …). Joined, they are the full label.
   */
  parts: readonly StepPart[];
};

/** How SundayBest works, in three steps — told by the intro story, or listed. */
export const WELCOME_STEPS: readonly WelcomeStep[] = [
  { Icon: Link2, parts: [{ lead: "", item: "Paste any sermon link" }] },
  { Icon: Calendar, parts: [{ lead: "", item: "Get a plan for 1 to 7 days" }] },
  {
    Icon: BookOpen,
    parts: [
      { lead: "", item: "Read" },
      { lead: ", ", item: "reflect" },
      { lead: ", ", item: "pray" },
      { lead: ", and ", item: "quiz" },
    ],
  },
];

export function getStepLabel(step: WelcomeStep): string {
  return step.parts.map(({ lead, item }) => lead + item).join("");
}
