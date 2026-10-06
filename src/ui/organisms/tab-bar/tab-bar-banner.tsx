import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/** How a host sets the banner — stable for the provider's life, so setting it never re-renders the host. */
type BannerChannel = (banner: ReactNode) => void;

const BannerChannelContext = createContext<BannerChannel | null>(null);
/** What's been set — for the tab bar. */
const ShownBannerContext = createContext<ReactNode>(null);

/**
 * Lets one part of the app float a banner above the tab bar's tabs — a plan
 * being built, say — at the bar's full width, wherever the reader is. Wrap
 * the tab navigator (and so its tab bar) in it once.
 */
export function TabBarBannerProvider({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState<ReactNode>(null);

  return (
    <BannerChannelContext.Provider value={setShown}>
      <ShownBannerContext.Provider value={shown}>{children}</ShownBannerContext.Provider>
    </BannerChannelContext.Provider>
  );
}

/** For the tab bar: the banner to float above the tabs, if any. */
export function useShownTabBarBanner(): ReactNode {
  return useContext(ShownBannerContext);
}

/** For the banner's one host: shows `banner` above the tabs while it isn't null, and nothing once it is. */
export function useTabBarBanner(banner: ReactNode) {
  const show = useContext(BannerChannelContext);

  useEffect(() => {
    show?.(banner);
  }, [show, banner]);

  useEffect(() => () => show?.(null), [show]);
}
