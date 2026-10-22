import { useEffect, useSyncExternalStore } from "react";

import { addDevMenuItem } from "@/core/dev-menu/dev-menu";
import { HOME_PREVIEWS, type HomePreview } from "../logic/home-preview";

/** The state picked from the developer menu, outside React: the menu lives outside it too. */
let chosen: HomePreview = "real";
const listeners = new Set<() => void>();
/** Replays the welcome on the Home that's mounted, if one is. */
let replayWelcome: (() => void) | null = null;

function choose(preview: HomePreview) {
  chosen = preview;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The Home state picked from the developer menu ("Home: …"): the real one until one is. */
export function useChosenPreview(): HomePreview {
  return useSyncExternalStore(subscribe, () => chosen);
}

/**
 * Home's states, and replaying its welcome, as items in React Native's
 * developer menu (shake the phone) — development builds only, so no control
 * of them is ever drawn on Home itself (ADR 0035).
 */
export function useHomeDevMenu(replay: () => void) {
  useEffect(() => {
    replayWelcome = replay;
    return () => {
      if (replayWelcome === replay) replayWelcome = null;
    };
  }, [replay]);

  useEffect(() => {
    for (const [preview, name] of HOME_PREVIEWS) {
      addDevMenuItem(`Home: ${name}`, () => choose(preview));
    }
    addDevMenuItem("Home: Replay the welcome", () => replayWelcome?.());
  }, []);
}
