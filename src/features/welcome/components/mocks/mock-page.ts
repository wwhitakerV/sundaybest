import { StyleSheet } from "react-native";

/** Every mock screen takes how far into its card's turn the story is. */
export type MockScreenProps = {
  /** 0 before its turn, counting up during it, `Infinity` after. */
  elapsedMs: number;
};

/**
 * The page inset every mock screen shares — the same 24pt sides, 12pt top,
 * and 16pt section gap `Screen`'s `padded` applies on a real screen, so a
 * mock sits in its phone exactly as the real screen would.
 */
export const MOCK_PAGE = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 24, paddingTop: 12, gap: 16 },
});
