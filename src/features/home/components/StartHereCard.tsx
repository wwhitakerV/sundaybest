import { StyleSheet, View } from "react-native";

import { Button } from "@/ui/atoms/Button";
import { radius, space, useTheme } from "@/theme";
import { Card } from "@/ui/atoms/Card";
import { SFProBody } from "@/ui/typography/SFProBody";
import { SFProTitle } from "@/ui/typography/SFProTitle";

export type StartHereCardProps = {
  onAddSermon: () => void;
};

/** Home with no plan under way: start one from last Sunday's sermon. */
export function StartHereCard({ onAddSermon }: StartHereCardProps) {
  const theme = useTheme();

  return (
    <Card testID="home-tab-start-here" radius={32} style={styles.card}>
      <View
        style={[
          styles.pill,
          { backgroundColor: theme.colors.segmentBackground, borderRadius: radius.pill },
        ]}
      >
        <SFProBody>Start here</SFProBody>
      </View>
      <View style={styles.text}>
        <SFProTitle>Start with last Sunday&apos;s sermon</SFProTitle>
        <SFProBody tone="textMuted">Paste a link and get a daily plan in seconds.</SFProBody>
      </View>
      <Button testID="home-tab-add-sermon-button" label="Add a sermon" onPress={onAddSermon} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: space[24], gap: space[24] },
  pill: { alignSelf: "flex-start", paddingHorizontal: space[14], paddingVertical: space[8] },
  text: { gap: space[10], marginTop: space[20] },
});
