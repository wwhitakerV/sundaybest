import { Stack } from "expo-router";

import { headerEntranceLayout } from "@/ui/header-entrance/HeaderEntranceScope";
import { HALF_SHEET_OPTIONS } from "@/ui/SheetLayout";

export default function FunLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} screenLayout={headerEntranceLayout}>
      {/* Declared first so Fun stays the stack's initial route: listed screens register ahead of discovered ones. */}
      <Stack.Screen name="index" />
      {/* Every exam subject, in a half-height sheet over the exams page. */}
      <Stack.Screen name="exam-subjects" options={HALF_SHEET_OPTIONS} />
    </Stack>
  );
}
