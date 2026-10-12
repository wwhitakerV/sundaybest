import { Pressable, StyleSheet, View } from "react-native";

import { controlHeight, pillHitSlop, radius, space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

export type PassageHeadingProps = {
  /** "Ephesians 2:8-10". */
  reference: string;
  /** "NIV". */
  translation: string;
  /** On the soft grey (Text size's preview): the pill's edge firmer, so it holds against it. */
  onSurface?: boolean;
  /** Opens Bible translation, to change it — in the stack the reader's in. None: only a label. */
  onChangeTranslation?: () => void;
  testID?: string;
};

/**
 * A passage's heading: its reference, and its translation in a pill on the
 * right — the app's soft fill and a card's edge — that opens Bible
 * translation, so the reader can change it from wherever they're reading.
 */
export function PassageHeading({
  reference,
  translation,
  onSurface = false,
  onChangeTranslation,
  testID,
}: PassageHeadingProps) {
  const theme = useTheme();
  const pillStyle = [
    styles.pill,
    {
      backgroundColor: theme.colors.surface,
      borderColor: onSurface ? theme.colors.edgeOnSurface : theme.colors.containerBorder,
      borderRadius: radius.pill,
    },
  ];
  const label = (
    <SFProBody variant="label" tone="textInactive">
      {translation}
    </SFProBody>
  );

  return (
    <View testID={testID} style={styles.row}>
      <SFProTitle style={styles.reference}>{reference}</SFProTitle>
      {onChangeTranslation ? (
        <Pressable
          testID={testID && `${testID}-translation`}
          accessibilityRole="button"
          accessibilityLabel={`Bible translation: ${translation}`}
          accessibilityHint="Opens Bible translation, to change it"
          hitSlop={pillHitSlop}
          onPress={onChangeTranslation}
          style={pillStyle}
        >
          {label}
        </Pressable>
      ) : (
        <View testID={testID && `${testID}-translation`} style={pillStyle}>
          {label}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[12],
  },
  reference: { flexShrink: 1 },
  pill: {
    height: controlHeight.pill,
    borderWidth: 1,
    paddingHorizontal: space[14],
    justifyContent: "center",
  },
});
