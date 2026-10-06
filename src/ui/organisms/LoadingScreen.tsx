import { StyleSheet, View } from "react-native";

import { Screen } from "./Screen";
import { Spinner } from "@/ui/atoms/Spinner";
import { Wordmark } from "@/ui/typography/Wordmark";

const SPINNER_BOTTOM_OFFSET = 56;

/**
 * Shown while the app's fonts are still loading (see `AppProviders`), in
 * place of a blank screen. The masthead falls back to the system font for
 * this brief render — the real masthead face (`src/theme/fonts.ts`) is
 * exactly what is not loaded yet.
 */
export function LoadingScreen() {
  return (
    <Screen testID="loading-screen" style={styles.content}>
      <Wordmark />
      <View style={styles.spinner}>
        <Spinner testID="loading-spinner" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: "center", justifyContent: "center" },
  spinner: { position: "absolute", bottom: SPINNER_BOTTOM_OFFSET },
});
