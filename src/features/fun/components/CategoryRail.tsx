import { ScrollView, type LayoutChangeEvent } from "react-native";
import {
  Gamepad2,
  GraduationCap,
  Lightbulb,
  UsersRound,
  Zap,
  type LucideIcon,
} from "lucide-react-native";

import { Chip } from "@/ui/Chip";
import { useTheme } from "@/theme";
import { FUN_CATEGORIES, type FunCategory } from "../logic/categories";

/** Each category's icon. */
function getCategoryIcon(category: FunCategory): LucideIcon {
  switch (category) {
    case "Multiplayer":
      return UsersRound;
    case "Trivia":
      return Lightbulb;
    case "Exams":
      return GraduationCap;
    case "Streaks":
      return Zap;
    default:
      return Gamepad2;
  }
}

export type CategoryRailProps = {
  selected: FunCategory;
  onSelect: (category: FunCategory) => void;
  /** Where the row lands on the page, so the page can bring it up. */
  onLayout?: (event: LayoutChangeEvent) => void;
  testID: string;
};

/**
 * Fun's categories as a row of chips that runs edge to edge and scrolls
 * sideways, so none has to shrink its label to fit. One is selected at a
 * time, filled quietly grey, so the row reads without shouting.
 */
export function CategoryRail({ selected, onSelect, onLayout, testID }: CategoryRailProps) {
  const theme = useTheme();

  return (
    <ScrollView
      testID={testID}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={onLayout}
      contentContainerStyle={{ paddingHorizontal: theme.spacing.md, gap: theme.spacing.sm }}
    >
      {FUN_CATEGORIES.map((category) => (
        <Chip
          key={category}
          testID={`${testID}-option-${category}`}
          label={category}
          icon={getCategoryIcon(category)}
          selected={category === selected}
          onPress={() => onSelect(category)}
        />
      ))}
    </ScrollView>
  );
}
