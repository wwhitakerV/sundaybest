import { SheetLayout } from "@/ui/SheetLayout";
import { openPassageLink } from "@/core/links/open-passage-link";
import { PassageList } from "../components/PassageList";
import { SheetUnavailable } from "../components/SheetUnavailable";
import { useExamSummary } from "../hooks/use-exam-summary";

/** An exam's passages, in a half-height sheet over its overview, each opening in Safari. */
export function ExamPassagesScreen() {
  const summary = useExamSummary();

  return (
    <SheetLayout testID="exam-passages-sheet" title="Passages">
      {summary ? (
        <PassageList
          testID="exam-passages"
          rowTestID="exam-overview-source-link"
          passages={summary.sourceLinks}
          onOpen={(passage) => void openPassageLink(passage.url)}
        />
      ) : (
        <SheetUnavailable testID="exam-passages-unavailable" />
      )}
    </SheetLayout>
  );
}
