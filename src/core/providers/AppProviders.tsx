import { type ReactNode } from "react";

// Side-effect import, on purpose. `env.ts` parses and freezes the environment at
// module scope, so importing it here — the app's composition root — is what makes
// a misconfigured build fail at launch, with the offending variables named,
// instead of surfacing as `undefined` somewhere far from the cause.
//
// Without this the module is unreachable from the entry point, Metro leaves it
// out of the bundle entirely, and the startup check silently does not happen.
import "@/core/config/env";

export type AppProvidersProps = {
  children: ReactNode;
};

/**
 * Single place every app-wide provider gets mounted (theme, query client,
 * session, error boundary). Deliberately empty for now so later prompts have one
 * obvious seam to add to.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return <>{children}</>;
}
