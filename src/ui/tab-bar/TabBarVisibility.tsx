import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type TabBarVisibilityContextValue = {
  visible: boolean;
  hide: () => void;
  show: () => void;
};

const TabBarVisibilityContext = createContext<TabBarVisibilityContextValue | undefined>(undefined);

export function TabBarVisibilityProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);

  return (
    <TabBarVisibilityContext.Provider
      value={{ visible, hide: () => setVisible(false), show: () => setVisible(true) }}
    >
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

function useTabBarVisibilityContext(): TabBarVisibilityContextValue {
  const context = useContext(TabBarVisibilityContext);
  if (!context) {
    throw new Error("useTabBarVisibility must be used within a TabBarVisibilityProvider");
  }
  return context;
}

/** Read by `TabBar` itself to decide whether it's shown. */
export function useTabBarVisible(): boolean {
  return useTabBarVisibilityContext().visible;
}

/**
 * Called by a screen that should not show the main tab bar — the study
 * flow (Read/Scripture/Reflect/Pray) hides it in favour of `StudyNav`.
 * Hides on mount, restores on unmount, so leaving the screen (back or
 * forward) always puts the tab bar back regardless of how it left.
 */
export function useHideTabBar(): void {
  const { hide, show } = useTabBarVisibilityContext();

  useEffect(() => {
    hide();
    return show;
    // Only ever run once per mount: `hide`/`show` are stable setState
    // wrappers from the provider and re-running this on their identity
    // would be a no-op at best, so they're deliberately left out of the
    // dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
