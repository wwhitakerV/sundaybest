import { useRouter } from "expo-router";
import {
  BookOpenCheck,
  CalendarDays,
  Link2,
  ListChecks,
  ScrollText,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react-native";

import { space } from "@/theme";
import { AboutCallout } from "../components/AboutCallout";
import { AboutLead } from "../components/AboutLead";
import { AboutRows } from "../components/AboutRows";
import { AboutSection } from "../components/AboutSection";
import { SettingsSubpage } from "../components/SettingsSubpage";
import { HOW_PLANS_ARE_MADE } from "../logic/how-plans-are-made";

const STEP_ICONS: Record<(typeof HOW_PLANS_ARE_MADE.steps)[number]["icon"], LucideIcon> = {
  sermon: Link2,
  scripture: BookOpenCheck,
  transcript: ScrollText,
  days: CalendarDays,
  quickCheck: ListChecks,
};

/**
 * How plans are made, set as every About page is: its title and opening
 * line, the five steps from a sermon to a plan on a card, its statement on
 * Scripture in serif, what stays true, and the way on to how SundayBest
 * handles your data.
 */
export function HowPlansAreMadeScreen() {
  const router = useRouter();
  const page = HOW_PLANS_ARE_MADE;

  return (
    <SettingsSubpage testID="how-plans-are-made" title="How plans are made" gap={space[32]}>
      <AboutLead title={page.statement} intro={page.intro} />

      <AboutRows
        testID="how-plans-are-made-steps"
        rows={page.steps.map((step) => ({
          key: step.icon,
          title: step.heading,
          text: step.text,
          icon: STEP_ICONS[step.icon],
        }))}
      />

      <AboutCallout testID="how-plans-are-made-quote" text={page.quote} />

      <AboutSection heading={page.truths.heading}>
        <AboutRows
          testID="how-plans-are-made-truths"
          rows={page.truths.items.map((item) => ({
            key: item.label,
            title: item.label,
            text: item.text,
          }))}
        />
      </AboutSection>

      <AboutRows
        testID="how-plans-are-made-privacy"
        rows={[
          {
            key: "privacy",
            title: page.privacyLink,
            icon: ShieldCheck,
            onPress: () => router.push("/(tabs)/settings/privacy-policy"),
          },
        ]}
      />
    </SettingsSubpage>
  );
}
