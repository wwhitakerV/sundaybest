import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";

import splashWordmark from "../../../assets/splash-wordmark.png";
import { useTheme } from "@/theme";

/** The native splash's wordmark width (`app.config.ts`), so the two are one picture. */
const WORDMARK_WIDTH = 180;
/** The wordmark image's own proportions (1123 × 130). */
const WORDMARK_ASPECT = 1123 / 130;

/**
 * The launch screen, drawn by the app: the SUNDAYBEST wordmark on white,
 * exactly where and as large as the native splash draws it, and nothing else
 * — never a spinner. Shown while fonts load (`AppProviders`) and while the
 * first route decides where a reader belongs, so lifting the native splash
 * over it changes nothing on screen.
 */
export function LoadingScreen() {
  const theme = useTheme();
  return (
    // Centred on the whole screen, not the safe area, exactly as the native
    // splash centres it — so the hand-off never nudges the wordmark.
    <View
      testID="loading-screen"
      style={[styles.centre, { backgroundColor: theme.colors.background }]}
    >
      <Image
        testID="loading-wordmark"
        source={splashWordmark}
        style={styles.wordmark}
        contentFit="contain"
        transition={null}
        accessibilityLabel="SundayBest"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: "center", justifyContent: "center" },
  wordmark: { width: WORDMARK_WIDTH, aspectRatio: WORDMARK_ASPECT },
});
