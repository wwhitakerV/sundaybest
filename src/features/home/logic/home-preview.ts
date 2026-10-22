import type { ApiPlanSummary } from "@/core/api/contracts";
import { addDays } from "@/utils/dates/addDays";

/**
 * Home's states, with made-up plans, for designing each one — in development
 * builds only (`homePreviews`). Never a reader's data.
 */
export type HomePreview =
  | "real"
  | "loading"
  | "error"
  | "newcomer"
  | "noneUnderWay"
  | "dayOpen"
  | "dayDone"
  | "twoUnderWay";

/** Each, by what it's called in the developer menu ("Home: Real data"), in the menu's order. */
export const HOME_PREVIEWS: readonly (readonly [HomePreview, string])[] = [
  ["real", "Real data"],
  ["loading", "Loading"],
  ["error", "Couldn't load"],
  ["newcomer", "No plans yet"],
  ["noneUnderWay", "None under way"],
  ["dayOpen", "Day open"],
  ["dayDone", "Today done"],
  ["twoUnderWay", "Two under way"],
];

/** The artwork the made-up plans show, as image addresses. */
export type HomePreviewArt = { blessing: string | null; praying: string | null };

/** What Home shows for a preview: its real data, loading, an error, or made-up plans. */
export type HomePreviewShown =
  | { kind: "real" }
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "plans"; plans: ApiPlanSummary[] };

/**
 * What Home shows for `preview`, its made-up plans dated about `today` — but
 * for a newcomer, the reader's `real` ready-made plans when there are any, so
 * opening one works.
 */
export function previewHome(
  preview: HomePreview,
  today: string,
  art: HomePreviewArt,
  real: readonly ApiPlanSummary[] = [],
): HomePreviewShown {
  switch (preview) {
    case "real":
    case "loading":
    case "error":
      return { kind: preview };
    case "newcomer": {
      // The server's own ready-made plans, when it has any, so they open; made-up ones otherwise.
      const ours = real.filter((plan) => plan.isSample && plan.status === "ready");
      return {
        kind: "plans",
        plans:
          ours.length > 0
            ? ours
            : [
                asSample(blessing(today, art, "open")),
                asSample(praying(today, art)),
                sample(today),
              ],
      };
    }
    case "noneUnderWay":
      return {
        kind: "plans",
        plans: [ready(today, art), completed(today, art)],
      };
    case "dayOpen":
      return { kind: "plans", plans: [blessing(today, art, "open")] };
    case "dayDone":
      return { kind: "plans", plans: [blessing(today, art, "done")] };
    case "twoUnderWay":
      return { kind: "plans", plans: [blessing(today, art, "open"), praying(today, art)] };
  }
}

const at = (date: string) => `${date}T12:00:00.000Z`;

function plan(
  today: string,
  fields: Pick<ApiPlanSummary, "id" | "title" | "status" | "lengthDays" | "isSample"> & {
    sermonId: string;
    church: string | null;
    thumbnailUrl: string | null;
    colors: string[];
    completedDays: number;
    currentDay: ApiPlanSummary["currentDay"];
    startedOn: string | null;
  },
): ApiPlanSummary {
  return {
    id: fields.id,
    title: fields.title,
    status: fields.status,
    lengthDays: fields.lengthDays,
    estimatedMinutes: 9,
    quickCheckEnabled: true,
    isSample: fields.isSample,
    sermon: {
      id: fields.sermonId,
      platform: "youtube",
      externalId: fields.sermonId.slice(-11),
      canonicalUrl: "https://www.youtube.com/watch?v=preview",
      title: fields.title,
      church: fields.church,
      thumbnailUrl: fields.thumbnailUrl,
      thumbnailColors: fields.colors,
      durationSeconds: 2400,
      publishedOn: addDays(today, -8),
      transcriptStatus: "available",
      createdAt: at(addDays(today, -8)),
      updatedAt: at(addDays(today, -8)),
    },
    progress: {
      completedDays: fields.completedDays,
      currentDayNumber: fields.currentDay?.dayNumber ?? null,
      percentage: Math.round((fields.completedDays / fields.lengthDays) * 100),
    },
    currentDay: fields.currentDay,
    startDate: fields.startedOn,
    startedAt: fields.startedOn ? at(fields.startedOn) : null,
    completedAt: fields.status === "completed" ? at(addDays(today, -1)) : null,
    archivedAt: null,
    createdAt: at(addDays(today, -7)),
    updatedAt: at(today),
  };
}

function day(
  id: string,
  dayNumber: number,
  title: string,
  status: "available" | "locked",
  on: string,
) {
  return { id, dayNumber, title, estimatedMinutes: 9, scheduledOn: on, status, quickCheck: null };
}

/** Today I Choose to Be a Blessing, under way: today's day open, or done with the next not yet. */
function blessing(today: string, art: HomePreviewArt, state: "open" | "done") {
  const open = state === "open";
  return plan(today, {
    id: "00000000-0000-4000-8000-0000000000b1",
    sermonId: "00000000-0000-4000-8000-0000000000c1",
    title: "Today I Choose to Be a Blessing",
    status: "active",
    lengthDays: 6,
    isSample: false,
    church: "VOUS Church",
    thumbnailUrl: art.blessing,
    // As a sermon is before its colours are known: the hero takes its own.
    colors: [],
    completedDays: open ? 1 : 2,
    currentDay: open
      ? day("00000000-0000-4000-8000-0000000000d2", 2, "Grace is received", "available", today)
      : day("00000000-0000-4000-8000-0000000000d3", 3, "One master", "locked", addDays(today, 1)),
    startedOn: addDays(today, -2),
  });
}

/** Still Praying, under way too, started after Blessing: the one Home shows of the two. */
function praying(today: string, art: HomePreviewArt) {
  return plan(today, {
    id: "00000000-0000-4000-8000-0000000000b2",
    sermonId: "00000000-0000-4000-8000-0000000000c2",
    title: "Still Praying",
    status: "active",
    lengthDays: 5,
    isSample: false,
    church: "VOUS Church",
    thumbnailUrl: art.praying,
    // As a sermon is before its colours are known: the hero takes its own.
    colors: [],
    completedDays: 0,
    currentDay: day(
      "00000000-0000-4000-8000-0000000000d4",
      1,
      "Asleep in the boat",
      "available",
      today,
    ),
    startedOn: addDays(today, -1),
  });
}

/** A plan made and not started. */
function ready(today: string, art: HomePreviewArt) {
  return { ...praying(today, art), status: "ready" as const, startDate: null, startedAt: null };
}

/** A plan finished yesterday. */
function completed(today: string, art: HomePreviewArt) {
  const done = blessing(today, art, "open");
  return {
    ...done,
    status: "completed" as const,
    currentDay: null,
    progress: { completedDays: 6, currentDayNumber: null, percentage: 100 },
    completedAt: at(addDays(today, -1)),
  };
}

/** A plan as one of our ready-made ones, not yet started. */
function asSample(made: ApiPlanSummary): ApiPlanSummary {
  return {
    ...made,
    status: "ready",
    isSample: true,
    currentDay: null,
    progress: { completedDays: 0, currentDayNumber: null, percentage: 0 },
    startDate: null,
    startedAt: null,
  };
}

/** The sample plan, ready to try. */
function sample(today: string) {
  return plan(today, {
    id: "00000000-0000-4000-8000-0000000000b9",
    sermonId: "00000000-0000-4000-8000-0000000000c9",
    title: "Overcome Temptation",
    status: "ready",
    lengthDays: 3,
    isSample: true,
    church: "VOUS Church",
    thumbnailUrl: null,
    colors: [],
    completedDays: 0,
    currentDay: null,
    startedOn: null,
  });
}
