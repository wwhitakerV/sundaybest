import { Fragment } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { radius, space, useTheme } from "@/theme";
import { Divider } from "@/ui/atoms/Divider";
import { RadioMark } from "@/ui/RadioMark";
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
    <View
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.containerBorder,
          borderRadius: radius[24],
        },
      ]}
    >
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
              style={[styles.row, { paddingHorizontal: space[18], gap: space[16] }]}
            >
              <View style={[styles.copy, { gap: space[4] }]}>
                <SFProBody>{choice.label}</SFProBody>
                {choice.detail ? (
                  <SFProBody variant="rowDetail" tone="textSupporting">
                    {choice.detail}
                  </SFProBody>
                ) : null}
              </View>
              <RadioMark selected={selected} testID={`${testID}-${choice.value}-radio`} />
            </Pressable>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: "hidden" },
  row: { minHeight: 68, flexDirection: "row", alignItems: "center", paddingVertical: space[14] },
  copy: { flex: 1 },
});
