import type { LucideIcon, LucideProps } from "lucide-react-native";

import { useTheme } from "@/theme";

export type TabIconProps = {
  icon: LucideIcon;
  color: NonNullable<LucideProps["color"]>;
  size: number;
  testID?: string;
};

/** A tab's lucide icon at the theme's shared stroke weight (`theme.icon`). */
export function TabIcon({ icon: Icon, color, size, testID }: TabIconProps) {
  const theme = useTheme();

  return (
    <Icon
      {...(testID !== undefined && { testID })}
      color={color}
      size={size}
      strokeWidth={theme.icon.strokeWidth}
    />
  );
}
