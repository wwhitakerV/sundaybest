import type { ApiWeek, ApiWeekHistory } from "@/core/api/contracts";
import { addDays } from "@/utils/dates/addDays";

import blessing from "../../../../assets/images/mock/today-i-choose-to-be-a-blessing.jpg";
import negativeThinking from "../../../../assets/images/mock/break-the-cycle-of-negative-thinking.jpg";
import stillPraying from "../../../../assets/images/mock/still-praying.jpg";
import temptation from "../../../../assets/images/mock/overcome-temptation.jpg";
import churchAndWorld from "../../../../assets/images/mock/the-church-must-not-partner-with-the-world.jpg";

/**
 * Made-up histories for looking at the week picker as it grows — the popover
 * at a few weeks and at its fullest, then the full-screen weeks from their
 * first, over months, over years, and with several plans a week — in
 * development builds only. Never a reader's data.
 */
export type PickerPreview = "real" | "weeks3" | "weeks4" | "weeks5" | "months" | "years" | "heavy";

/** The order a tap steps through them. */
const PICKER_PREVIEWS: readonly PickerPreview[] = [
  "real",
  "weeks3",
  "weeks4",
  "weeks5",
  "months",
  "years",
  "heavy",
];

/** What each is called on its button. */
export const PICKER_PREVIEW_NAMES: Record<PickerPreview, string> = {
  real: "Real",
  weeks3: "3 weeks",
  weeks4: "4 weeks",
  weeks5: "5 weeks",
  months: "Months",
  years: "Years",
  heavy: "Several plans",
};

/** How many past weeks each made-up history holds. */
const PREVIEW_WEEKS: Record<Exclude<PickerPreview, "real">, number> = {
  weeks3: 3,
  weeks4: 4,
  weeks5: 5,
  months: 22,
  years: 70,
  heavy: 12,
};

const SERMONS = [
  {
    title: "Today I Choose to Be a Blessing",
    church: "VOUS Church",
    art: blessing,
    refs: ["Genesis 12:1–3", "Ephesians 2:8–10"],
  },
  {
    title: "Break the Cycle of Negative Thinking",
    church: "Elevation Church",
    art: negativeThinking,
    refs: ["Philippians 4:6–8", "Romans 12:2"],
  },
  {
    title: "Still Praying",
    church: "VOUS Church",
    art: stillPraying,
    refs: ["Luke 18:1–8", "1 Thessalonians 5:16–18"],
  },
  {
    title: "Overcome Temptation",
    church: "Transformation Church",
    art: temptation,
    refs: ["James 1:12–15", "1 Corinthians 10:13"],
  },
  {
    title: "The Church Must Not Partner with the World",
    church: "Grace Community",
    art: churchAndWorld,
    refs: ["2 Corinthians 6:14–18", "John 17:14–19"],
  },
] as const;

/** The preview after this one, coming back round to the reader's own weeks. */
export function nextPreview(current: PickerPreview): PickerPreview {
  const index = PICKER_PREVIEWS.indexOf(current);
  return PICKER_PREVIEWS[(index + 1) % PICKER_PREVIEWS.length] ?? "real";
}

/** A preview by name, from a route's params — the reader's own weeks for anything else. */
export function toPreview(value: string | null): PickerPreview {
  return PICKER_PREVIEWS.find((preview) => preview === value) ?? "real";
}

/**
 * A made-up history: this week — three sermons — and weeks back from it, one
 * sermon a week or three (every other week in the popover's histories, most
 * weeks in "several plans"), with bundled artwork by plan.
 */
export function previewHistory(
  preview: Exclude<PickerPreview, "real">,
  currentWeek: string,
): { weeks: ApiWeekHistory[]; art: Record<string, number> } {
  const art: Record<string, number> = {};
  // This week (index -1) and the weeks before it.
  const weeks = Array.from({ length: PREVIEW_WEEKS[preview] + 1 }, (_, at) => {
    const index = at - 1;
    // This week always holds several; the short histories (the popover's) alternate, so each
    // shows "+N more"; the long ones have them now and then.
    const several =
      index === -1 ||
      (preview === "heavy"
        ? index % 3 !== 2
        : preview === "months" || preview === "years"
          ? index % 5 === 3
          : index % 2 === 1);
    const plans = Array.from({ length: several ? 3 : 1 }, (_, slot) => {
      const sermon = SERMONS[(index + 1 + slot) % SERMONS.length] ?? SERMONS[0];
      const planId = `preview-${index}-${slot}`;
      art[planId] = sermon.art;
      return {
        planId,
        title: sermon.title,
        church: sermon.church,
        thumbnailUrl: null,
        thumbnailColors: [],
        passages: sermon.refs.map((reference, at) => ({
          reference,
          done: at === 0 || index % 2 === 0,
        })),
        reflectionIds: [],
      };
    });
    return {
      weekStart: addDays(currentWeek, -7 * (index + 1)),
      daysStudied: (at % 6) + 1,
      plans,
    };
  });
  return { weeks, art };
}

/** A history as the popover lists it: each week's Sunday, how many plans, and its one title. */
export function toPickerWeeks(weeks: readonly ApiWeekHistory[]): ApiWeek["weeks"] {
  return weeks.map((week) => ({
    weekStart: week.weekStart,
    planCount: week.plans.length,
    title: week.plans[0]?.title ?? "",
  }));
}
