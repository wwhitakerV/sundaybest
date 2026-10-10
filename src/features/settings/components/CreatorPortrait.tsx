import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";

import headshot from "../../../../assets/images/creator/walter-whitaker.jpg";
import { space } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

/** Square, so the letter starts close below. */
const PORTRAIT_RATIO = 1;

export type CreatorPortraitProps = { name: string; role: string; testID: string };

/**
 * Walter, introduced as a plan's card introduces its sermon: his photo
 * filling the top of a soft card, then his name and what he does.
 */
export function CreatorPortrait({ name, role, testID }: CreatorPortraitProps) {
  return (
    <Card edge={false} testID={testID} style={styles.card}>
      <Image
        source={headshot}
        style={styles.photo}
        contentFit="cover"
        accessible
        accessibilityRole="image"
        accessibilityLabel="Walter Whitaker, smiling, in a black cap and T-shirt"
      />
      <View style={{ gap: space[4], padding: space[20] }}>
        <SFProTitle variant="screen" accessibilityRole="header">
          {name}
        </SFProTitle>
        <SFProBody tone="textInactive">{role}</SFProBody>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden" },
  photo: { width: "100%", aspectRatio: PORTRAIT_RATIO },
});
