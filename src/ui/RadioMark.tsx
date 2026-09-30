import { StyleSheet, View } from "react-native";

import { useTheme } from "@/theme";

const SIZE = 24;
const RING = 2;
const DOT = 10;

export type RadioMarkProps = {
  selected: boolean;
  testID?: string;
};

/**
 * The round mark of one choice among several: an empty ring until it's
 * picked, then an accent ring around an accent dot. Only a mark — the row or
 * card it sits on is the control, and says it's selected.
 */
export function RadioMark({ selected, testID }: RadioMarkProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={[
        styles.ring,
        {
          borderColor: selected ? theme.colors.accent : theme.colors.borderStrong,
          borderRadius: theme.radii.pill,
        },
      ]}
    >
      {selected && (
        <View
          testID={testID && `${testID}-dot`}
          style={[
            styles.dot,
            { backgroundColor: theme.colors.accent, borderRadius: theme.radii.pill },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: SIZE,
    height: SIZE,
    borderWidth: RING,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: DOT, height: DOT },
});
