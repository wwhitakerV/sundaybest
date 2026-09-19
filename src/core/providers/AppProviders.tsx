import { useMemo, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { createQueryClient } from "@/core/api/query-client";

// Side-effect import. `env.ts` validates and freezes the environment at module
// scope, so importing it from the composition root is what makes a misconfigured
// build fail at launch. Without a reachable import Metro drops the module from
// the bundle and the startup check silently never runs.
import "@/core/config/env";

export type AppProvidersProps = {
  children: ReactNode;
};

/**
 * Single place every app-wide provider gets mounted.
 *
 * Integrity monitoring is deliberately **not** mounted here yet. It needs a
 * session to clear and a monitoring sink to report to, and neither is wired up —
 * `src/core/security/integrity` is ready for whichever prompt does that.
 */
export function AppProviders({ children }: AppProvidersProps) {
  // One client for the life of the app. Rebuilding it on a re-render would
  // throw away every cached query and every in-flight request.
  const queryClient = useMemo(() => createQueryClient(), []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
