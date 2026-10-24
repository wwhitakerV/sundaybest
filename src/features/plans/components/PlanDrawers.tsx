import { Pressable, StyleSheet, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { controlHeight, iconSize, space, useTheme } from "@/theme";
import { SFProBody } from "@/ui/typography/SFProBody";
import type { PlanAboutLook } from "../logic/plan-about";
import { PlanAbout } from "./PlanAbout";
import { PlanDrawer } from "./PlanDrawer";

/** A plan page's drawers, by key. */
export type PlanDrawerKey = "about" | "scriptures" | "takeaways" | "settings";

/** Every drawer, in order down the page. */
export const PLAN_DRAWERS: readonly PlanDrawerKey[] = [
  "about",
  "scriptures",
  "takeaways",
  "settings",
];

export type PlanDrawersProps = {
  about: PlanAboutLook | null;
  /** The plan's settings: its menu's own items, each what it does. */
  settings: { key: string; label: string; select: () => void }[];
  /** Which are open — kept as the plans turn, so each page opens as the last was left. */
  open: ReadonlySet<PlanDrawerKey>;
  onToggle: (key: PlanDrawerKey) => void;
  testID: string;
};

/** A row of the plan's settings: what it does, and a chevron, the whole row tapped. */
function SettingRow({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress: () => void;
  testID: string;
}) {
  const { colors, icon } = useTheme();
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={styles.setting}>
      <SFProBody>{label}</SFProBody>
      <ChevronRight
        size={iconSize.chevron}
        color={colors.textSupporting}
        strokeWidth={icon.strokeWidth}
      />
    </Pressable>
  );
}

/**
 * The rest of a plan, under its days: About this plan, the Scripture it
 * references, its key takeaways, and its settings — each a drawer, closed
 * until it's opened. A plan from before About existed has only its settings.
 */
export function PlanDrawers({ about, settings, open, onToggle, testID }: PlanDrawersProps) {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={[styles.drawers, { borderBottomColor: colors.divider }]}>
      {about && about.overview.length > 0 && (
        <PlanDrawer
          testID={`${testID}-about`}
          title="About this plan"
          open={open.has("about")}
          onToggle={() => onToggle("about")}
        >
          <PlanAbout {...about} only="overview" testID={`${testID}-about-body`} />
        </PlanDrawer>
      )}
      {about && about.scriptures.length > 0 && (
        <PlanDrawer
          testID={`${testID}-scriptures`}
          title="Scripture referenced"
          open={open.has("scriptures")}
          onToggle={() => onToggle("scriptures")}
        >
          <PlanAbout {...about} only="scriptures" testID={`${testID}-scriptures-body`} />
        </PlanDrawer>
      )}
      {about && about.takeaways.length > 0 && (
        <PlanDrawer
          testID={`${testID}-takeaways`}
          title="Key takeaways"
          open={open.has("takeaways")}
          onToggle={() => onToggle("takeaways")}
        >
          <PlanAbout {...about} only="takeaways" testID={`${testID}-takeaways-body`} />
        </PlanDrawer>
      )}
      <PlanDrawer
        testID={`${testID}-settings`}
        title="Plan settings"
        open={open.has("settings")}
        onToggle={() => onToggle("settings")}
      >
        {settings.map((item) => (
          <SettingRow
            key={item.key}
            testID={`${testID}-setting-${item.key}`}
            label={item.label}
            onPress={item.select}
          />
        ))}
      </PlanDrawer>
    </View>
  );
}

const styles = StyleSheet.create({
  // A hairline under the last drawer, as over each.
  drawers: { borderBottomWidth: StyleSheet.hairlineWidth },
  setting: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: controlHeight.row,
    gap: space[12],
  },
});
