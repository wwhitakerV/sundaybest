import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useIsFocused } from "expo-router";
import type { LucideIcon } from "lucide-react-native";

/** A screen's button, shown in the minimised tab bar in place of its tabs. */
export type TabBarAccessory = {
  label: string;
  testID: string;
  icon?: LucideIcon;
  onPress: () => void;
};

type Shown = { accessory: TabBarAccessory; owner: object };

/** How screens ask — stable for the provider's life, so asking never re-renders the asker. */
type AccessoryChannel = {
  show: (shown: Shown) => void;
  hide: (owner: object) => void;
};

const AccessoryChannelContext = createContext<AccessoryChannel | null>(null);
/** What's been asked — for the tab bar. */
const ShownAccessoryContext = createContext<Shown | null>(null);

/**
 * Lets a screen ask the tab bar to minimise beside a button of its own —
 * the tabs gathering into one, the button filling the space beside it.
 * Wrap the tab navigator (and so its tab bar) in it once.
 */
export function TabBarAccessoryProvider({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState<Shown | null>(null);
  const [channel] = useState<AccessoryChannel>(() => ({
    show: (next) => setShown(next),
    // Only the screen that asked can take it back.
    hide: (owner) => setShown((current) => (current?.owner === owner ? null : current)),
  }));

  return (
    <AccessoryChannelContext.Provider value={channel}>
      <ShownAccessoryContext.Provider value={shown}>{children}</ShownAccessoryContext.Provider>
    </AccessoryChannelContext.Provider>
  );
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
  const { label, testID, icon } = accessory;
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
        onPress: () => onPress.current(),
      },
    });
    return () => channel.hide(owner);
  }, [channel, active, owner, label, testID, icon]);
}
