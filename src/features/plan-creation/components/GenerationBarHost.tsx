import { useContext } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { useTabBarBanner } from "@/ui/organisms/tab-bar/tab-bar-banner";
import { GenerationPreviewButton } from "../dev/GenerationPreviewButton";
import { useGenerationBar } from "../hooks/use-generation-bar";
import { useSettledFeedback } from "../hooks/use-settled-feedback";
import { GenerationBar } from "./GenerationBar";

/**
 * Floats the reader's plan being built above the tab bar's tabs, wherever
 * they are, and gives the feel of it finishing. Mounted once, beside the tab
 * navigator, inside its `TabBarBannerProvider`; it draws nothing itself —
 * but, in development, the switch that previews each of the bar's states.
 */
export function GenerationBarHost() {
  const bar = useGenerationBar();
  const insetTop = useContext(SafeAreaInsetsContext)?.top ?? 0;
  useSettledFeedback(bar.view);

  useTabBarBanner(
    bar.view ? (
      <GenerationBar
        testID="generation-bar"
        view={bar.view}
        onDismiss={bar.dismiss}
        onOpen={bar.open}
        onExpand={bar.expand}
        onRetry={bar.retry}
        onChooseAnother={bar.chooseAnother}
      />
    ) : null,
  );

  // DEVELOPMENT ONLY: remove with `dev/`.
  return __DEV__ ? (
    <View pointerEvents="box-none" style={[styles.preview, { top: insetTop }]}>
      <GenerationPreviewButton testID="generation-preview" />
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  preview: { position: "absolute", left: 0, right: 0, zIndex: 10 },
});
