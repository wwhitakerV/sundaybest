import type { NewPlanState } from "./new-plan-flow";
import { checkSermonLink } from "./sermon-link";

/** What the first step says at its foot about the sermon, in a `FeedbackPanel`. */
export type LinkFeedback = { tone: "correct" | "incorrect"; title: string; detail: string };

const CHEER: LinkFeedback = {
  tone: "correct",
  title: "Nice find!",
  detail: "Let's turn this sermon into your daily study.",
};

/**
 * The first step's verdict on its sermon: why a pasted link won't work, once
 * Continue has turned it down; a cheer, as soon as a pasted link looks right
 * or a search result is picked; otherwise nothing.
 */
export function getLinkFeedback(state: NewPlanState): LinkFeedback | null {
  if (state.step !== "paste") return null;
  if (state.inputMode === "search") return state.searchSelection ? CHEER : null;
  if (state.linkError) {
    return { tone: "incorrect", title: "That link won't work", detail: state.linkError };
  }
  return checkSermonLink(state.link).valid ? CHEER : null;
}
