import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { useTheme } from "@/theme";
import { PlanCreationHeader } from "../components/PlanCreationHeader";

export function PasteSermonScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen testID="paste-sermon-screen" style={styles.content}>
      <PlanCreationHeader
        testID="paste-sermon"
        leading="close"
        step="1 of 2"
        onPress={() => router.back()}
      />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <Button
        testID="paste-sermon-continue-button"
        label="Continue"
        onPress={() => router.push("/(plan-creation)/link-preview")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
});
