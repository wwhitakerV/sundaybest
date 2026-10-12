import { createContext, useContext } from "react";

/**
 * Whether the page a cold launch lands on (Welcome or Home) is ready to be
 * seen: who the reader is, their plans and settings, and the page itself. The
 * launch intro plays over it and waits for this before revealing it.
 */
export const LaunchReadyContext = createContext(false);

/** Whether the launch's first page is ready to be revealed. */
export function useLaunchReady(): boolean {
  return useContext(LaunchReadyContext);
}
