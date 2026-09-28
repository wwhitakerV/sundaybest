import { useState } from "react";
import { ScrollView } from "react-native";
import { BookOpen, Gamepad2, GraduationCap, Lightbulb, UsersRound, Zap } from "lucide-react-native";

import { Chip } from "@/ui/Chip";
import { PAGE_INSET } from "@/ui/Screen";
import { useTheme } from "@/theme";

/** Fun's categories, in order, each with its icon. */
const CATEGORIES = [
  { label: "Quick Play", icon: Gamepad2 },
  { label: "Multiplayer", icon: UsersRound },
  { label: "Trivia", icon: Lightbulb },
  { label: "Exams", icon: GraduationCap },
  { label: "From Your Plans", icon: BookOpen },
  { label: "Streaks", icon: Zap },
] as const;

type Category = (typeof CATEGORIES)[number]["label"];

export type CategoryRailProps = {
  testID: string;
};

/**
 * Fun's categories as a row of chips that runs edge to edge and scrolls
 * sideways. One is selected at a time — Quick Play to begin with — filled
 * quietly grey, so the row reads without shouting.
 */
export function CategoryRail({ testID }: CategoryRailProps) {
  const theme = useTheme();
  const [selected, setSelected] = useState<Category>("Quick Play");

  return (
    <ScrollView
      testID={testID}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: PAGE_INSET, gap: theme.spacing.sm }}
    >
      {CATEGORIES.map(({ label, icon }) => (
        <Chip
          key={label}
          testID={`${testID}-option-${label}`}
          label={label}
          icon={icon}
          selected={label === selected}
          onPress={() => setSelected(label)}
        />
      ))}
    </ScrollView>
  );
}
