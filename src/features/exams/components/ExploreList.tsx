import { BookOpen, FileText, Users, type LucideIcon } from "lucide-react-native";

import { DividedList } from "@/ui/DividedList";
import { LinkRow } from "@/ui/LinkRow";
import type { ExploreIcon, ExploreItem } from "../types";

/** The mark for each kind of thing explored. */
const ICONS: Record<ExploreIcon, LucideIcon> = {
  scripture: BookOpen,
  people: Users,
  letter: FileText,
};

export type ExploreListProps = {
  items: readonly ExploreItem[];
  onOpen: (item: ExploreItem) => void;
  testID: string;
};

/** What an exam explores, a row each (`{testID}-{index}`), each opening the passage it's explored in. */
export function ExploreList({ items, onOpen, testID }: ExploreListProps) {
  return (
    <DividedList testID={testID}>
      {items.map((item, index) => (
        <LinkRow
          key={item.title}
          testID={`${testID}-${index}`}
          icon={ICONS[item.icon]}
          label={item.title}
          accessibilityHint={`Opens ${item.passage.reference} in Safari`}
          onPress={() => onOpen(item)}
        />
      ))}
    </DividedList>
  );
}
