import type { SharedValue } from "react-native-reanimated";

/**
 * How the intro reveals the page underneath: `revealed` (0 or 1) on the UI
 * thread, in the same frame as the drawing, and `onReveal` to tell React.
 */
export type Reveal = { revealed: SharedValue<number>; onReveal: () => void };
