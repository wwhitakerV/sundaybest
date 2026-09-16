import { StyleSheet, Text } from "react-native";

import { Screen } from "@/ui/Screen";
import { useTheme } from "@/theme";

export function HomeScreen() {
  const theme = useTheme();

  return (
    <Screen testID="home-screen" style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>SundayBest</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "600" },
});
