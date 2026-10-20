import { StatusBar } from "react-native";

import { EditorialStatusBar } from "@/ui/organisms/status-bar/EditorialStatusBar";
import { useStatusBarView } from "../hooks/use-status-bar-view";

/** Our status bar, live — and iOS's own kept hidden under it. */
export function SystemStatusBar() {
  const view = useStatusBarView();
  return (
    <>
      <StatusBar hidden />
      <EditorialStatusBar
        testID="status-bar"
        time={view.time}
        battery={view.battery}
        tone={view.tone}
        layout={view.layout}
        onPress={view.scrollToTop}
      />
    </>
  );
}
