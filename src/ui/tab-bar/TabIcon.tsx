import { View } from "react-native";
import type { LucideIcon, LucideProps } from "lucide-react-native";

import { useTheme } from "@/theme";

export type TabIconProps = {
  icon: LucideIcon;
  color: NonNullable<LucideProps["color"]>;
  size: number;
  testID?: string;
};

/**
 * A tab's lucide icon at the theme's shared stroke weight (`theme.icon`).
 * The `testID` goes on a wrapper: lucide turns its own into `data-testid`,
 * which React Native never sees.
 */
export function TabIcon({ icon: Icon, color, size, testID }: TabIconProps) {
  const theme = useTheme();

  return (
    <View testID={testID}>
      <Icon color={color} size={size} strokeWidth={theme.icon.strokeWidth} />
    </View>
  );
}
