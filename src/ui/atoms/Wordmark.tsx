import { memo } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import WordmarkArt from "../../../assets/sb-wordmark.svg";

export type WordmarkProps = { testID?: string; style?: StyleProp<ViewStyle> };

/**
 * SundayBest's wordmark, drawn straight from assets/sb-wordmark.svg at the size
 * and in the colours the file sets: replace the file and the app draws the new
 * one. The one place the mark is drawn.
 */
export const Wordmark = memo(function Wordmark({ testID, style }: WordmarkProps) {
  return (
    <View
      {...(testID && { testID })}
      accessible
      accessibilityRole="image"
      accessibilityLabel="SundayBest"
      style={style}
    >
      <WordmarkArt />
    </View>
  );
});
