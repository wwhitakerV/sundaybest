import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { NavigationContext } from "expo-router/react-navigation";

type Targets = {
  add: (target: { current: () => void }) => () => void;
  scrollToTop: () => void;
};

const TargetsContext = createContext<Targets | null>(null);

/**
 * Where a tap on the status bar goes: iOS's bar scrolls the page up when
 * tapped, and ours does too. Pages' scrollers register while their screen is
 * focused (`useScrollToTopTarget`); a tap scrolls the one registered last.
 */
export function ScrollToTopProvider({ children }: { children: ReactNode }) {
  const [targets] = useState<Targets>(() => {
    const live: { current: () => void }[] = [];
    return {
      add: (target) => {
        live.push(target);
        return () => {
          const at = live.indexOf(target);
          if (at !== -1) live.splice(at, 1);
        };
      },
      scrollToTop: () => live.at(-1)?.current(),
    };
  });
  return <TargetsContext.Provider value={targets}>{children}</TargetsContext.Provider>;
}

/** Scrolls the page registered last to its top; nothing without one. */
export function useScrollToTop(): () => void {
  const targets = useContext(TargetsContext);
  return () => targets?.scrollToTop();
}

/**
 * Registers this page's scroller for the status bar's tap while its screen is
 * focused (always, outside a navigator).
 */
export function useScrollToTopTarget(scrollToTop: () => void) {
  const targets = useContext(TargetsContext);
  const navigation = useContext(NavigationContext);
  const latest = useRef(scrollToTop);
  useEffect(() => {
    latest.current = scrollToTop;
  });

  useEffect(() => {
    if (!targets) return;
    if (!navigation) return targets.add(latest);
    let remove = navigation.isFocused() ? targets.add(latest) : null;
    const offFocus = navigation.addListener("focus", () => {
      remove ??= targets.add(latest);
    });
    const offBlur = navigation.addListener("blur", () => {
      remove?.();
      remove = null;
    });
    return () => {
      offFocus();
      offBlur();
      remove?.();
    };
  }, [targets, navigation]);
}
