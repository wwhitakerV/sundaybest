import { useNavigation } from "expo-router";

/**
 * Leaving a full-screen modal flow that holds its own stack — the Daily Study
 * session (`src/app/study`) and New Plan (`src/app/(plan-creation)`).
 *
 * Leaving must dismiss that whole stack — not push a tab route inside it
 * (which is what stacked cards on cards) and not pop one screen at a time.
 * The parent of any screen in the flow is the root stack, and going back
 * there removes the entire modal in a single slide down, back to the screen
 * that opened it — never on somewhere else, which iOS can only do as a
 * second movement after the first.
 *
 * `alsoLeaving` names screens of the root stack this modal takes with it
 * when it was opened straight over one (New Plan over a finished study or
 * the generation sheet): all of them go in the one slide.
 */
export function useModalSession({ alsoLeaving = [] }: { alsoLeaving?: readonly string[] } = {}) {
  const navigation = useNavigation();

  /** Slides the whole modal down to the screen that opened it. */
  function exit() {
    const app = navigation.getParent();
    if (!app) return;
    const { index, routes } = app.getState();
    let count = 1;
    while (alsoLeaving.includes(routes[index - count]?.name ?? "")) count += 1;
    app.dispatch({ type: "POP", payload: { count } });
  }

  return { exit };
}
