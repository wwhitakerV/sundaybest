import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { useSundayBestApi } from "@/core/api/ApiProvider";
import { flushMutationOutbox } from "@/core/api/offline-outbox";

const FOREGROUND_RETRY_MS = 30_000;

/**
 * Opportunistic sync without a second connectivity dependency.
 *
 * The outbox is flushed at launch, whenever the app returns to the foreground,
 * and periodically while it remains active. A transport failure stops a flush
 * immediately, so queued writes stay ordered and idempotent until connectivity
 * returns.
 */
export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const api = useSundayBestApi();
  const queryClient = useQueryClient();
  const inFlight = useRef<Promise<unknown> | null>(null);

  const flush = useCallback(() => {
    if (inFlight.current) return;
    inFlight.current = flushMutationOutbox(api, queryClient)
      .catch(() => undefined)
      .finally(() => {
        inFlight.current = null;
      });
  }, [api, queryClient]);

  useEffect(() => {
    flush();

    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") flush();
    });

    const interval = setInterval(() => {
      if (AppState.currentState === "active") flush();
    }, FOREGROUND_RETRY_MS);

    return () => {
      appState.remove();
      clearInterval(interval);
    };
  }, [flush]);

  return children;
}
