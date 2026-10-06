import { useRouter } from "expo-router";

import { getBuildSteps } from "../logic/build-steps";
import { useGenerationBar } from "./use-generation-bar";

/**
 * The generation sheet's view model: the bar's build, its steps, and the
 * bar's actions — each closing the sheet before it goes anywhere.
 */
export function useGenerationSheet() {
  const router = useRouter();
  const bar = useGenerationBar();
  const steps = bar.subject
    ? getBuildSteps(bar.subject.status, bar.subject.lengthDays, bar.subject.quickCheck)
    : [];

  function thenClose(action: () => void) {
    return () => {
      router.back();
      action();
    };
  }

  return {
    view: bar.view,
    steps,
    /** The step under way, while building. */
    step: steps.find((candidate) => candidate.state === "active")?.label ?? null,
    close: () => router.back(),
    open: thenClose(bar.open),
    retry: thenClose(bar.retry),
    chooseAnother: thenClose(bar.chooseAnother),
    dismiss: thenClose(bar.dismiss),
  };
}
