import { useNavigation, useRouter, type Href } from "expo-router";

/**
 * Leaving a full-screen modal flow that holds its own stack — the Daily Study
 * session (`src/app/study`) and New Plan (`src/app/(plan-creation)`).
 *
 * Leaving must dismiss that whole stack — not push a tab route inside it
 * (which is what stacked cards on cards) and not pop one screen at a time.
 * The parent of any screen in the flow is the root stack, and going back
 * there removes the entire modal in a single slide down.
 */
export function useModalSession() {
  const navigation = useNavigation();
  const router = useRouter();

  /** Slides the whole modal down to the screen that opened it. */
  function exit() {
    navigation.getParent()?.goBack();
  }

  /** Dismisses the modal, then lands on `href` (e.g. a tab). */
  function exitTo(href: Href) {
    exit();
    router.navigate(href);
  }

  return { exit, exitTo };
}
