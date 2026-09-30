import { SheetLayout } from "@/ui/SheetLayout";
import { openPassageLink } from "@/core/links/open-passage-link";
import { ExploreList } from "../components/ExploreList";
import { SheetUnavailable } from "../components/SheetUnavailable";
import { useExamSummary } from "../hooks/use-exam-summary";

/**
 * An exam's topics, in a half-height sheet over its overview: what it
 * explores, a row each, each opening the passage it's explored in.
 */
export function ExamTopicsScreen() {
  const summary = useExamSummary();

  return (
    <SheetLayout testID="exam-topics-sheet" title="Topics covered">
      {summary ? (
        <ExploreList
          testID="exam-topics"
          items={summary.explore}
          onOpen={(item) => void openPassageLink(item.passage.url)}
        />
      ) : (
        <SheetUnavailable testID="exam-topics-unavailable" />
      )}
    </SheetLayout>
  );
}
