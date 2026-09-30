import { BookOpen } from "lucide-react-native";

import { DividedList } from "@/ui/DividedList";
import { LinkRow } from "@/ui/LinkRow";
import type { PassageLink } from "../types";

export type PassageListProps = {
  passages: readonly PassageLink[];
  onOpen: (passage: PassageLink) => void;
  /** Each row is `{rowTestID}-{index}`. */
  rowTestID: string;
  testID: string;
};

/** An exam's passages, a row each, each opening in Safari. */
export function PassageList({ passages, onOpen, rowTestID, testID }: PassageListProps) {
  return (
    <DividedList testID={testID}>
      {passages.map((passage, index) => (
        <LinkRow
          key={passage.reference}
          testID={`${rowTestID}-${index}`}
          icon={BookOpen}
          label={passage.reference}
          accessibilityHint={`Opens ${passage.reference} in Safari`}
          onPress={() => onOpen(passage)}
        />
      ))}
    </DividedList>
  );
}
