import { StyleSheet } from "react-native";
import { ListChecks } from "lucide-react-native";

import { space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { Toggle } from "@/ui/atoms/Toggle";
import { SFProBody } from "@/ui/typography/SFProBody";

export type QuickCheckToggleProps = {
  value: boolean;
  onChange: (enabled: boolean) => void;
  testID: string;
};

/** "Add a quick check quiz", on or off. */
export function QuickCheckToggle({ value, onChange, testID }: QuickCheckToggleProps) {
  const theme = useTheme();

  return (
    <Card style={styles.row}>
      <ListChecks size={22} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
      <SFProBody variant="listItem" style={styles.label}>
        Add a quick check quiz
      </SFProBody>
      <Toggle
        testID={testID}
        value={value}
        onValueChange={onChange}
        accessibilityLabel="Add a quick check quiz"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[14],
    paddingHorizontal: space[20],
    paddingVertical: space[14],
  },
  label: { flex: 1 },
});
