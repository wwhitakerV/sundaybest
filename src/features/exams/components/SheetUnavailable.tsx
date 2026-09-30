import { Text } from "react-native";

import { useTheme } from "@/theme";

/** In a sheet whose exam isn't there: says so, plainly. Dragging the sheet down is the way out. */
export function SheetUnavailable({ testID }: { testID: string }) {
  const theme = useTheme();

  return (
    <Text testID={testID} style={[theme.typography.body, { color: theme.colors.textInactive }]}>
      This exam isn&apos;t available.
    </Text>
  );
}
