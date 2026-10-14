import { useRouter } from "expo-router";

import { getBuildSteps } from "../logic/build-steps";
import { useGenerationBar } from "./use-generation-bar";

/**
 * The generation sheet's view model: the bar's build, its steps, and the
 * bar's actions. Each that goes somewhere does it in one movement: the plan
 * opens first and the sheet slides away from over it; New Plan rises over
 * the sheet, and takes it with it when it leaves. The rest close the sheet.
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
    close: () => router.back(),
    open: () => {
      bar.open();
      // A frame on, once the plan's on its way: closed together, iOS would only
      // push it once the sheet had gone — two movements.
      requestAnimationFrame(() => router.back());
    },
    retry: thenClose(bar.retry),
    chooseAnother: bar.chooseAnother,
    dismiss: thenClose(bar.dismiss),
  };
}
