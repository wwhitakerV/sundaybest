import { type ReactNode } from "react";

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
