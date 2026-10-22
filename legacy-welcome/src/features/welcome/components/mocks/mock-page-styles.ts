import { StyleSheet } from "react-native";
import { space } from "@/theme";

/**
 * The page inset every mock screen shares — the same 24pt sides, 12pt top,
 * and 16pt section gap `Screen`'s `padded` applies on a real screen, so a
 * mock sits in its phone exactly as the real screen would.
 */
export const MOCK_PAGE = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: space[24], paddingTop: space[12], gap: space[16] },
  body: { gap: space[16] },
});
