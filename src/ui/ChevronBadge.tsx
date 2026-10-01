import { StyleSheet, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { radius, useTheme } from "@/theme";

const SIZE = 32;
const ICON_SIZE = 16;

export type ChevronBadgeProps = {
  testID?: string;
};

/**
 * The small round "there's more this way" mark on a card that opens
 * something: a white veil with a chevron. The card is the control, so this
 * takes no press of its own. Made for a light colour of the content's own,
 * so its fill and ink hold in either theme.
 */
export function ChevronBadge({ testID }: ChevronBadgeProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={[
        styles.badge,
        { backgroundColor: theme.colors.overlayButtonLight, borderRadius: radius.pill },
      ]}
    >
      <ChevronRight
        size={ICON_SIZE}
        color={theme.colors.inkOnLight}
        strokeWidth={theme.icon.strokeWidth}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
});
