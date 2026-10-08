import { View } from "react-native";

import { space, useTheme } from "@/theme";
import { SerifBody } from "@/ui/typography/SerifBody";

/** The red rule beside the statement: thin, so it marks without shouting. */
const RULE = 2;

/** A privacy page's one strong statement, in serif, set apart by a thin red rule. */
export function PrivacyQuote({ text, testID }: { text: string; testID: string }) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={{
        borderLeftWidth: RULE,
        borderLeftColor: theme.colors.accent,
        paddingLeft: space[16],
      }}
    >
      <SerifBody variant="standfirst">{text}</SerifBody>
    </View>
  );
}
