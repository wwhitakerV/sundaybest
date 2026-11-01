import { StyleSheet, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";

import { space, useTheme } from "@/theme";
import { FilterPills } from "@/ui/molecules/FilterPills";
import { PAGE_INSET } from "@/ui/organisms/Screen";
import { MonoLabel } from "@/ui/typography/MonoLabel";
import { SerifTitle } from "@/ui/typography/SerifTitle";
import type { LibraryRow } from "../logic/library-rows";
import type { LibraryShelf } from "../logic/plan-library";
import { LibraryLead } from "./LibraryLead";
import { LibraryPlan } from "./LibraryPlan";
import { PlansEmpty } from "./PlansEmpty";

export type LibraryRowViewProps = {
  row: LibraryRow;
  shelf: LibraryShelf;
  onPickShelf: (shelf: LibraryShelf) => void;
  scrolled: SharedValue<number>;
  headerFoot: SharedValue<number>;
};

/** One row of Plans' library, drawn as what it is. */
export function LibraryRowView({
  row,
  shelf,
  onPickShelf,
  scrolled,
  headerFoot,
}: LibraryRowViewProps) {
  switch (row.kind) {
    case "shelves":
      return (
        <View style={styles.shelves}>
          <FilterPills
            testID="plans-shelves"
            options={row.shelves.map((label) => ({ label }))}
            selected={shelf}
            onSelect={onPickShelf}
            bleed={PAGE_INSET}
          />
        </View>
      );
    case "lead":
      return <LibraryLead plan={row.plan} scrolled={scrolled} headerFoot={headerFoot} />;
    case "head":
      return <SectionHead title="More studies" count={row.count} />;
    case "plan":
      return <LibraryPlan plan={row.plan} />;
    case "empty":
      return <PlansEmpty testID="plans-empty" title={row.title} message={row.message} />;
    case "colophon":
      return <Colophon text={row.text} />;
  }
}

/** A department's opening, as a magazine sets one: a rule, its name in the serif, and its count opposite. */
function SectionHead({ title, count }: { title: string; count: number }) {
  const theme = useTheme();
  return (
    <View
      testID="plans-section-head"
      style={[styles.head, { borderTopColor: theme.colors.divider }]}
    >
      <SerifTitle variant="title" accessibilityRole="header">
        {title}
      </SerifTitle>
      <MonoLabel variant="folio" tone="textSupporting">
        {String(count).padStart(2, "0")}
      </MonoLabel>
    </View>
  );
}

/** The library's closing line: what it holds, in plain facts. */
function Colophon({ text }: { text: string }) {
  return (
    <View style={styles.colophon}>
      <MonoLabel testID="plans-colophon" variant="folio" tone="textSupporting">
        {text}
      </MonoLabel>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space[24],
    paddingBottom: space[16],
    marginTop: space[16],
  },
  shelves: { paddingBottom: space[8] },
  colophon: { paddingTop: space[16] },
});
