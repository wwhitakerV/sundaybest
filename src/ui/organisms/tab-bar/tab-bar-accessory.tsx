import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useIsFocused } from "expo-router";
import type { LucideIcon } from "lucide-react-native";

/** A screen's button, shown in the minimised tab bar in place of its tabs. */
export type TabBarAccessory = {
  label: string;
  testID: string;
  icon?: LucideIcon;
  /** A way on that isn't open yet (a day tomorrow): opaque grey, grey words. */
  waiting?: boolean;
  onPress: () => void;
};

type Shown = { accessory: TabBarAccessory; owner: object };

/** How screens ask — stable for the provider's life, so asking never re-renders the asker. */
type AccessoryChannel = {
  show: (shown: Shown) => void;
  hide: (owner: object) => void;
  /** A screen with no use for the floating button: it's hidden while that screen's shown. */
  hideFab: (owner: object) => void;
  showFab: (owner: object) => void;
  /** A page that runs to the screen's foot: the whole bar steps away while it's shown. */
  hideBar: (owner: object) => void;
  showBar: (owner: object) => void;
};

const AccessoryChannelContext = createContext<AccessoryChannel | null>(null);
/** What's been asked — for the tab bar. */
const ShownAccessoryContext = createContext<Shown | null>(null);
/** Whether a screen has asked the floating button away — for the tab bar. */
const FabHiddenContext = createContext(false);
/** Whether a screen has asked the whole bar away — for the tab bar. */
const BarHiddenContext = createContext(false);

/**
 * Lets a screen ask the tab bar to minimise beside a button of its own —
 * the tabs gathering into one, the button filling the space beside it.
 * Wrap the tab navigator (and so its tab bar) in it once.
 */
export function TabBarAccessoryProvider({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState<Shown | null>(null);
  const [fabHiddenBy, setFabHiddenBy] = useState<object | null>(null);
  const [barHiddenBy, setBarHiddenBy] = useState<object | null>(null);
  const [channel] = useState<AccessoryChannel>(() => ({
    show: (next) => setShown(next),
    // Only the screen that asked can take it back.
    hide: (owner) => setShown((current) => (current?.owner === owner ? null : current)),
    hideFab: (owner) => setFabHiddenBy(owner),
    showFab: (owner) => setFabHiddenBy((current) => (current === owner ? null : current)),
    hideBar: (owner) => setBarHiddenBy(owner),
    showBar: (owner) => setBarHiddenBy((current) => (current === owner ? null : current)),
  }));

  return (
    <AccessoryChannelContext.Provider value={channel}>
      <ShownAccessoryContext.Provider value={shown}>
        <FabHiddenContext.Provider value={fabHiddenBy !== null}>
          <BarHiddenContext.Provider value={barHiddenBy !== null}>
            {children}
          </BarHiddenContext.Provider>
        </FabHiddenContext.Provider>
      </ShownAccessoryContext.Provider>
    </AccessoryChannelContext.Provider>
  );
}

/** For the tab bar: whether the screen shown has asked the floating button away. */
export function useTabBarFabHidden(): boolean {
  return useContext(FabHiddenContext);
}

/**
 * For a screen with no use for the floating button (Plan Overview): while
 * `hide` is true and the screen is the one shown, the tab bar leaves it out,
 * and a button the screen shows beside the tabs takes its place.
 */
export function useHideTabBarFab(hide: boolean) {
  const channel = useContext(AccessoryChannelContext);
  const isFocused = useIsFocused();
  const [owner] = useState(() => ({}));
  const active = hide && isFocused;

  useEffect(() => {
    if (!channel || !active) return;
    channel.hideFab(owner);
    return () => channel.showFab(owner);
  }, [channel, active, owner]);
}

/** For the tab bar: whether the screen shown has asked it away. */
export function useTabBarHidden(): boolean {
  return useContext(BarHiddenContext);
}

/**
 * For a page that runs to the screen's foot (Meet the creator): while `hide`
 * is true and the page is the one shown, the tab bar steps away — dropping
 * as the page arrives, as it does under a modal — and comes back with its
 * usual reveal once the page goes.
 */
export function useHideTabBar(hide: boolean) {
  const channel = useContext(AccessoryChannelContext);
  const isFocused = useIsFocused();
  const [owner] = useState(() => ({}));
  const active = hide && isFocused;

  useEffect(() => {
    if (!channel || !active) return;
    channel.hideBar(owner);
    return () => channel.showBar(owner);
  }, [channel, active, owner]);
}

/** For the tab bar: the button a screen has asked it to minimise beside, if any. */
export function useShownTabBarAccessory(): TabBarAccessory | null {
  return useContext(ShownAccessoryContext)?.accessory ?? null;
}

/**
 * For a screen: while `show` is true and the screen is the one shown, the
 * tab bar minimises beside `accessory`; otherwise it's left as it is. The
 * button always does what the screen's latest `onPress` does.
 */
export function useTabBarAccessory(accessory: TabBarAccessory, show: boolean) {
  const channel = useContext(AccessoryChannelContext);
  const isFocused = useIsFocused();
  const [owner] = useState(() => ({}));
  const onPress = useRef(accessory.onPress);
  const { label, testID, icon, waiting = false } = accessory;
  const active = show && isFocused;

  useEffect(() => {
    onPress.current = accessory.onPress;
  });

  // Keeps the tab bar — outside React's tree of this screen — in step with it.
  useEffect(() => {
    if (!channel || !active) return;
    channel.show({
      owner,
      accessory: {
        label,
        testID,
        ...(icon && { icon }),
        ...(waiting && { waiting }),
        onPress: () => onPress.current(),
      },
    });
    return () => channel.hide(owner);
  }, [channel, active, owner, label, testID, icon, waiting]);
}
