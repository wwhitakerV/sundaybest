import { createContext, useContext, useEffect, useId, useState, type ReactNode } from "react";

export type StatusBarToneValue = "dark" | "light";

type ToneAsks = {
  ask: (id: string, light: boolean) => void;
  leave: (id: string) => void;
};

const ToneAsksContext = createContext<ToneAsks | null>(null);
const ToneContext = createContext<StatusBarToneValue>("dark");

/**
 * Holds what's been asked of the status bar's tone: dark on the page, light
 * over a dark hero or paper. What was asked last wins, and when it leaves,
 * what was asked before it returns — React Native's `StatusBar` stack's rule.
 */
export function StatusBarToneProvider({ children }: { children: ReactNode }) {
  const [asked, setAsked] = useState<readonly { id: string; light: boolean }[]>([]);
  const [asks] = useState<ToneAsks>(() => ({
    ask: (id, light) =>
      setAsked((current) => [...current.filter((entry) => entry.id !== id), { id, light }]),
    leave: (id) => setAsked((current) => current.filter((entry) => entry.id !== id)),
  }));
  const tone = asked.at(-1)?.light ? "light" : "dark";
  return (
    <ToneAsksContext.Provider value={asks}>
      <ToneContext.Provider value={tone}>{children}</ToneContext.Provider>
    </ToneAsksContext.Provider>
  );
}

/**
 * Asks the status bar for its light tone (`light`) or its dark one while it's
 * mounted — in place of React Native's `StatusBar` `barStyle`, which would
 * bring iOS's own bar back.
 */
export function StatusBarTone({ light }: { light: boolean }) {
  const asks = useContext(ToneAsksContext);
  const id = useId();
  useEffect(() => {
    asks?.ask(id, light);
    return () => asks?.leave(id);
  }, [asks, id, light]);
  return null;
}

/** The status bar's tone now: "dark" on the page, "light" over a dark hero. */
export function useStatusBarTone(): StatusBarToneValue {
  return useContext(ToneContext);
}
