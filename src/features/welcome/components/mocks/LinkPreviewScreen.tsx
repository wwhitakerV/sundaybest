import { StyleSheet, Text, View } from "react-native";
import { ArrowLeft, Check, Link2, ListChecks, Sparkles } from "lucide-react-native";

import { HeaderIconButton } from "@/ui/HeaderIconButton";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { StepCounter } from "@/ui/StepCounter";
import { useTheme } from "@/theme";
import { PASTE_LINK } from "../../logic/scenes";
import { LiftAnchor } from "../lift/LiftAnchor";
import { DayPicker } from "../lifts/DayPicker";
import { SermonThumbnail } from "../lifts/SermonThumbnail";
import { MOCK_PAGE } from "./mock-page";

const TOGGLE_WIDTH = 52;

export type LinkPreviewScreenProps = {
  /** Which part lifts off on this card's turn: the day chips, or the sermon card. */
  lift: "days" | "sermon";
  elapsedMs: number;
};

/**
 * New Plan's second step, drawn to match the design: the pasted link, the
 * sermon it points to, how many days, the quick-check toggle, and "Create my
 * plan". Two story cards show it — one lifts the day chips (picking the
 * days), the next, with the days already picked, lifts the sermon's
 * thumbnail and taps into it.
 */
export function LinkPreviewScreen({ lift, elapsedMs }: LinkPreviewScreenProps) {
  const theme = useTheme();
  // On the sermon card's turn, the days were picked on the turn before.
  const daysElapsedMs = lift === "days" ? elapsedMs : Infinity;
  const sermonElapsedMs = lift === "sermon" ? elapsedMs : 0;

  const days = <DayPicker elapsedMs={daysElapsedMs} />;
  const thumbnail = <SermonThumbnail elapsedMs={sermonElapsedMs} />;

  return (
    <View style={MOCK_PAGE.page}>
      <ScreenHeader
        title="New plan"
        left={
          <HeaderIconButton
            testID="mock-plan-back"
            icon={ArrowLeft}
            accessibilityLabel="Back"
            onPress={() => undefined}
          />
        }
        right={<StepCounter label="2 of 2" />}
      />

      <View
        style={[
          styles.link,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
        ]}
      >
        <Link2 size={22} color={theme.colors.textMuted} strokeWidth={theme.icon.strokeWidth} />
        <Text
          numberOfLines={1}
          style={[theme.typography.body, styles.grow, { color: theme.colors.text }]}
        >
          …/{PASTE_LINK.split("/").at(-1)}
        </Text>
        <View style={[styles.linkCheck, { backgroundColor: theme.colors.segmentBackground }]}>
          <Check size={20} color={theme.colors.selected} strokeWidth={2.5} />
        </View>
      </View>

      <View
        style={[
          styles.sermon,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
        ]}
      >
        {lift === "sermon" ? <LiftAnchor>{thumbnail}</LiftAnchor> : thumbnail}
        <View style={styles.sermonText}>
          <Text numberOfLines={1} style={[theme.typography.listItem, { color: theme.colors.text }]}>
            Choose Whom You Will Serve
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
            VOUS Church
          </Text>
        </View>
      </View>

      <Text style={[theme.typography.body, styles.label, { color: theme.colors.textMuted }]}>
        How many days?
      </Text>
      {lift === "days" ? <LiftAnchor>{days}</LiftAnchor> : days}

      <View
        style={[
          styles.toggleRow,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.divider },
        ]}
      >
        <ListChecks size={20} color={theme.colors.text} strokeWidth={theme.icon.strokeWidth} />
        <Text style={[theme.typography.listItem, styles.grow, { color: theme.colors.text }]}>
          Add a quick check quiz
        </Text>
        <View
          style={[
            styles.toggle,
            { backgroundColor: theme.colors.controlPrimary, borderRadius: theme.radii.pill },
          ]}
        >
          <View
            style={[
              styles.knob,
              { backgroundColor: theme.colors.onControlPrimary, borderRadius: theme.radii.pill },
            ]}
          />
        </View>
      </View>

      <View style={styles.spacer} />
      <View
        style={[
          styles.create,
          { backgroundColor: theme.colors.controlPrimary, borderRadius: theme.radii.pill },
        ]}
      >
        <Sparkles
          size={22}
          color={theme.colors.onControlPrimary}
          strokeWidth={theme.icon.strokeWidth}
        />
        <Text style={[theme.typography.button, { color: theme.colors.onControlPrimary }]}>
          Create my plan
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  link: {
    height: 64,
    borderWidth: 1,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 8,
    gap: 12,
  },
  grow: { flex: 1 },
  linkCheck: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  sermon: { borderWidth: 1, borderRadius: 26, padding: 10 },
  sermonText: { paddingHorizontal: 6, paddingTop: 10, paddingBottom: 2, gap: 2 },
  label: { marginTop: 6 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  toggle: { width: TOGGLE_WIDTH, height: 30, padding: 3, alignItems: "flex-end" },
  knob: { width: 24, height: 24 },
  spacer: { flex: 1 },
  create: {
    height: 64,
    marginBottom: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
});
