import { useTabBarBanner } from "@/ui/organisms/tab-bar/tab-bar-banner";
import { useGenerationBar } from "../hooks/use-generation-bar";
import { useSettledFeedback } from "../hooks/use-settled-feedback";
import { GenerationBar } from "./GenerationBar";

/**
 * Floats the reader's plan being built above the tab bar's tabs, wherever
 * they are, and gives the feel of it finishing. Mounted once, beside the tab
 * navigator, inside its `TabBarBannerProvider`; it draws nothing itself.
 */
export function GenerationBarHost() {
  const bar = useGenerationBar();
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

  return null;
}
