import { ActionSheetIOS, DevSettings } from "react-native";

import { env } from "../config/env";

/** The items, by title, in the order they were added: each is added once, its first handler kept. */
const items = new Map<string, () => void>();

/** Whether this build has the developer menu's items: a development build, run in debug. */
export function hasDevMenu(): boolean {
  return __DEV__ && env.variant === "development";
}

/**
 * Adds a development action (ADR 0035): to React Native's developer menu —
 * opened by shaking the phone, in a development build of the app's own — and
 * to the action sheet `showDevActions` opens, which works in Expo Go too,
 * whose menu never shows an app's items — `at: "first"` heading the sheet. Never in a build that ships. A title
 * already added keeps its first handler, so `run` must read what it needs
 * when it's chosen, not capture it.
 */
export function addDevMenuItem(title: string, run: () => void, at?: "first"): void {
  if (!hasDevMenu() || items.has(title)) return;
  items.set(title, run);
  if (at === "first") {
    // Put at the top of the action sheet: the others re-added after it, in their order.
    const rest = [...items].filter(([key]) => key !== title);
    items.clear();
    items.set(title, run);
    for (const [key, value] of rest) items.set(key, value);
  }
  DevSettings.addMenuItem(title, run);
}

/**
 * Opens every development action in iOS's own action sheet — outside the
 * app's design, so it's never mistaken for part of it. Home opens it on a tap
 * of its wordmark. Nothing outside a development build.
 */
export function showDevActions(): void {
  if (!hasDevMenu() || items.size === 0) return;
  const titles = [...items.keys()];
  ActionSheetIOS.showActionSheetWithOptions(
    { title: "Development", options: [...titles, "Cancel"], cancelButtonIndex: titles.length },
    (index) => {
      const title = titles.at(index);
      if (title !== undefined) items.get(title)?.();
    },
  );
}

/** Restarts the JavaScript app, as the developer menu's own Reload does. */
export function reloadApp(reason: string): void {
  DevSettings.reload(reason);
}
