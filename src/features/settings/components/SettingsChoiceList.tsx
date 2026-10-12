import { Fragment } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Check } from "lucide-react-native";

import { controlHeight, iconSize, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { Divider } from "@/ui/atoms/Divider";
import { SFProBody } from "@/ui/typography/SFProBody";

export type SettingsChoice<T extends string> = {
  value: T;
  label: string;
  detail?: string;
};

export function SettingsChoiceList<T extends string>({
  choices,
  value,
  onChange,
  testID,
  disabled = false,
}: {
  choices: readonly SettingsChoice<T>[];
  value: T;
  onChange: (value: T) => void;
  testID: string;
  disabled?: boolean;
}) {
  const theme = useTheme();

  return (
    <Card testID={testID} kind="list" style={styles.card}>
      {choices.map((choice, index) => {
        const selected = choice.value === value;
        return (
          <Fragment key={choice.value}>
            {index > 0 && <Divider />}
            <Pressable
              testID={`${testID}-${choice.value}`}
              accessibilityRole="radio"
              accessibilityLabel={
                choice.detail ? `${choice.label}. ${choice.detail}` : choice.label
              }
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(choice.value)}
              style={[styles.row, { paddingHorizontal: space[16], gap: space[16] }]}
            >
              <View style={[styles.copy, { gap: space[4] }]}>
                <SFProBody>{choice.label}</SFProBody>
                {choice.detail ? (
                  <SFProBody variant="rowDetail" tone="textSupporting">
                    {choice.detail}
                  </SFProBody>
                ) : null}
              </View>
              {/* The one chosen ends in a check, as iOS Settings marks it; the rest in nothing. */}
              {selected && (
                <View testID={`${testID}-${choice.value}-check`}>
                  <Check
                    size={iconSize.row}
                    color={theme.colors.text}
                    strokeWidth={theme.icon.strokeWidthStrong}
                  />
                </View>
              )}
            </Pressable>
          </Fragment>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden" },
  row: {
    minHeight: controlHeight.row,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: space[14],
  },
  copy: { flex: 1 },
});
