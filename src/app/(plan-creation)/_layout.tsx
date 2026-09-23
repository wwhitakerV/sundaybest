import { Stack } from "expo-router";

export default function PlanCreationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "modal",
      }}
    />
  );
}
