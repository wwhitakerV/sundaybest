import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useIsFocused } from "expo-router";

import { ThemeScope, type Theme } from "@/theme";

type Shown = { theme: Theme; owner: object };

/** How screens ask — stable for the provider's life, so asking never re-renders the asker. */
type PaperChannel = {
  show: (shown: Shown) => void;
  hide: (owner: object) => void;
};

const PaperChannelContext = createContext<PaperChannel | null>(null);
/** The paper asked for — for the tab bar. */
const ShownPaperContext = createContext<Theme | null>(null);

/**
 * Lets a screen drawn on its own paper lay the tab bar on it too, so the
 * page and the bar are one sheet. Wrap the tab navigator (and so its tab
 * bar) in it once.
 */
export function TabBarPaperProvider({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState<Shown | null>(null);
  const [channel] = useState<PaperChannel>(() => ({
    show: (next) => setShown(next),
    // Only the screen that asked can take it back.
    hide: (owner) => setShown((current) => (current?.owner === owner ? null : current)),
  }));

  return (
    <PaperChannelContext.Provider value={channel}>
      <ShownPaperContext.Provider value={shown?.theme ?? null}>
        {children}
      </ShownPaperContext.Provider>
    </PaperChannelContext.Provider>
  );
}

/** For the tab bar's host: draws `children` on the paper a screen has asked for, or as they are. */
export function TabBarPaperScope({ children }: { children: ReactNode }) {
  const paper = useContext(ShownPaperContext);
  return paper ? <ThemeScope theme={paper}>{children}</ThemeScope> : children;
}

/** For a screen on its own paper (Formation vIdeal): while it's the one shown, the tab bar is laid on `theme`. */
export function useTabBarPaper(theme: Theme | null) {
  const channel = useContext(PaperChannelContext);
  const isFocused = useIsFocused();
  const [owner] = useState(() => ({}));
  const active = theme !== null && isFocused;

  useEffect(() => {
    if (!channel || !active || !theme) return;
    channel.show({ owner, theme });
    return () => channel.hide(owner);
  }, [channel, active, owner, theme]);
}
