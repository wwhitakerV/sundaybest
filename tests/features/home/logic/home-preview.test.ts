import { getApiActivePlan, getApiSamplePlan, getApiUserPlans } from "@/features/plans";
import {
  HOME_PREVIEW_NAMES,
  nextHomePreview,
  previewHome,
  type HomePreview,
} from "@/features/home/logic/home-preview";

const art = {
  blessing: "https://example.test/blessing.jpg",
  praying: "https://example.test/p.jpg",
};

const plansFor = (preview: HomePreview) => {
  const shown = previewHome(preview, "2026-10-19", art);
  if (shown.kind !== "plans") throw new Error(`${preview} shows no plans`);
  return shown.plans;
};

describe("Home's previews", () => {
  it("steps through every state, then back to the real Home", () => {
    const seen: HomePreview[] = [];
    let current: HomePreview = "real";
    do {
      seen.push(current);
      current = nextHomePreview(current);
    } while (current !== "real");

    expect(seen).toEqual([
      "real",
      "loading",
      "error",
      "newcomer",
      "noneUnderWay",
      "dayOpen",
      "dayDone",
      "twoUnderWay",
    ]);
  });

  it("names each for its button", () => {
    expect(HOME_PREVIEW_NAMES.dayDone).toBe("Today done");
  });

  it("leaves the real Home alone, and shows loading and an error as they are", () => {
    expect(previewHome("real", "2026-10-19", art)).toEqual({ kind: "real" });
    expect(previewHome("loading", "2026-10-19", art)).toEqual({ kind: "loading" });
    expect(previewHome("error", "2026-10-19", art)).toEqual({ kind: "error" });
  });

  it("gives a newcomer no plans of their own, only the sample to try", () => {
    const plans = plansFor("newcomer");

    expect(getApiUserPlans(plans)).toEqual([]);
    expect(getApiSamplePlan(plans)).not.toBeNull();
  });

  it("gives plans with none under way: one ready, one finished", () => {
    const plans = plansFor("noneUnderWay");

    expect(getApiUserPlans(plans).map((plan) => plan.status)).toEqual(["ready", "completed"]);
    expect(getApiActivePlan(plans)).toBeNull();
  });

  it("opens today's day on a plan under way, with its artwork", () => {
    const active = getApiActivePlan(plansFor("dayOpen"));

    expect(active?.currentDay).toMatchObject({ dayNumber: 2, status: "available" });
    expect(active?.sermon.thumbnailUrl).toBe(art.blessing);
  });

  it("has today's day done and the next not open yet", () => {
    const active = getApiActivePlan(plansFor("dayDone"));

    expect(active?.currentDay).toMatchObject({ dayNumber: 3, status: "locked" });
    expect(active?.progress.completedDays).toBe(2);
  });

  it("has two plans under way, the one started last shown", () => {
    const plans = plansFor("twoUnderWay");

    expect(getApiUserPlans(plans).filter((plan) => plan.status === "active")).toHaveLength(2);
    expect(getApiActivePlan(plans)?.sermon.thumbnailUrl).toBe(art.praying);
  });
});
