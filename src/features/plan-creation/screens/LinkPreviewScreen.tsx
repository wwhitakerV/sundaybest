import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/ui/Screen";
import { Button } from "@/ui/Button";
import { useTheme } from "@/theme";
import { PlanCreationHeader } from "../components/PlanCreationHeader";

export function LinkPreviewScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Screen testID="link-preview-screen" style={styles.content}>
      <PlanCreationHeader
        testID="link-preview"
        leading="back"
        step="2 of 2"
        onPress={() => router.back()}
      />

      <Text style={[theme.typography.body, { color: theme.colors.text }]}>...</Text>

      <Button
        testID="link-preview-create-plan-button"
        label="Create my plan"
        onPress={() => router.push("/(plan-creation)/preparing")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
});
