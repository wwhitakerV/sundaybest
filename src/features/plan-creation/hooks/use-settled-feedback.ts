import { useEffect, useRef } from "react";

import { errorFeedback, successFeedback } from "@/core/haptics/haptics";
import type { GenerationBarView } from "../logic/generation-bar";

/**
 * The feel of a build finishing while the reader watched it build: success
 * when it's ready, an error when it fails. A build already finished when the
 * bar first saw it gives none.
 */
export function useSettledFeedback(view: GenerationBarView | null) {
  const watched = useRef<string | null>(null);

  useEffect(() => {
    if (view?.kind === "building") {
      watched.current = view.id;
      return;
    }
    if (!view || view.id === null || view.id !== watched.current) return;
    watched.current = null;
    if (view.kind === "ready") successFeedback();
    else errorFeedback();
  }, [view]);
}
