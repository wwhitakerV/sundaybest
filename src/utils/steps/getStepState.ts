export type StepState = "completed" | "active" | "upcoming";

/** Where `index` sits relative to the current step in a linear, 0-indexed flow. */
export function getStepState(index: number, activeIndex: number): StepState {
  if (index < activeIndex) return "completed";
  if (index === activeIndex) return "active";
  return "upcoming";
}
