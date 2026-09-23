import { Stack } from "expo-router";

export default function PlansLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/*
       * Daily Study owns its own entrance motion, including StudyNav.
       * Disable the native iOS horizontal push for this route so the entire
       * screen does not slide sideways underneath that custom animation.
       */}
      <Stack.Screen options={{ animation: "none" }} />
    </Stack>
  );
}
