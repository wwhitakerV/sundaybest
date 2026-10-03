import { and, asc, eq, or } from "drizzle-orm";

import type { Database } from "../db/client.js";
import {
  planDayProgress,
  planDays,
  planStepProgress,
  plans,
  prayers,
  quizzes,
  reflectionPrompts,
  savedPlans,
  scriptureReferences,
  sermonSources,
  userPlanEnrollments,
} from "../db/schema.js";
import { addCalendarDays, localDateInTimeZone } from "../domain/time.js";
import { AppError } from "../http/errors.js";
import { toSermon } from "./sermon-service.js";

const STEP_ORDER = ["read", "scripture", "reflect", "pray"] as const;

export function createPlanService(db: Database) {
  async function getVisibleBase(userId: string, planId: string) {
    const rows = await db
      .select({
        plan: plans,
        enrollment: userPlanEnrollments,
        sermon: sermonSources,
        savedUserId: savedPlans.userId,
      })
      .from(plans)
      .innerJoin(sermonSources, eq(sermonSources.id, plans.sermonId))
      .leftJoin(
        userPlanEnrollments,
        and(eq(userPlanEnrollments.planId, plans.id), eq(userPlanEnrollments.userId, userId)),
      )
      .leftJoin(savedPlans, and(eq(savedPlans.planId, plans.id), eq(savedPlans.userId, userId)))
      .where(
        and(
          eq(plans.id, planId),
          or(eq(plans.ownerUserId, userId), eq(plans.visibility, "sample"), eq(userPlanEnrollments.userId, userId)),
        ),
      )
      .limit(1);
    const row = rows[0];
    if (!row) throw new AppError("NOT_FOUND", "Plan not found");
    return row;
  }

  async function getSummary(userId: string, planId: string) {
    const base = await getVisibleBase(userId, planId);
    return buildSummary(base);
  }

  async function buildSummary(base: Awaited<ReturnType<typeof getVisibleBase>>) {
    const dayRows = await db
      .select({ dayId: planDays.id, dayNumber: planDays.dayNumber })
      .from(planDays)
      .where(eq(planDays.planId, base.plan.id))
      .orderBy(asc(planDays.dayNumber));

    let completedDays = 0;
    let currentDayNumber: number | null = dayRows[0]?.dayNumber ?? 1;
    if (base.enrollment) {
      const progressRows = await db
        .select({ dayId: planDayProgress.planDayId, completedAt: planDayProgress.completedAt })
        .from(planDayProgress)
        .where(eq(planDayProgress.enrollmentId, base.enrollment.id));
      const completed = new Set(progressRows.filter((row) => row.completedAt).map((row) => row.dayId));
      completedDays = completed.size;
      currentDayNumber = dayRows.find((day) => !completed.has(day.dayId))?.dayNumber ?? null;
    }

    const status = base.enrollment?.status ?? "ready";
    const lengthDays = asPlanLength(base.plan.lengthDays);
    return {
      id: base.plan.id,
      title: base.plan.title,
      status,
      lengthDays,
      quickCheckEnabled: base.plan.quickCheckEnabled,
      isSample: base.plan.visibility === "sample",
      saved: Boolean(base.savedUserId),
      sermon: toSermon(base.sermon),
      progress: {
        completedDays,
        currentDayNumber,
        percentage: Math.round((completedDays / Math.max(1, base.plan.lengthDays)) * 100),
      },
      startDate: base.enrollment?.startDate ?? null,
      startedAt: base.enrollment?.startedAt?.toISOString() ?? null,
      completedAt: base.enrollment?.completedAt?.toISOString() ?? null,
      archivedAt: base.enrollment?.archivedAt?.toISOString() ?? null,
      createdAt: base.plan.createdAt.toISOString(),
      updatedAt: maxDate(base.plan.updatedAt, base.enrollment?.updatedAt).toISOString(),
    } as const;
  }

  async function getDetail(userId: string, planId: string) {
    const base = await getVisibleBase(userId, planId);
    if (!base.plan.readyAt) throw new AppError("PLAN_NOT_READY", "Plan is still being generated");
    const summary = await buildSummary(base);
    const days = await db
      .select({ day: planDays, scripture: scriptureReferences })
      .from(planDays)
      .innerJoin(scriptureReferences, eq(scriptureReferences.id, planDays.scriptureReferenceId))
      .where(eq(planDays.planId, planId))
      .orderBy(asc(planDays.dayNumber));

    const apiDays = [];
    for (const row of days) {
      const [prompts, prayerRows, quizRows, progressRows, stepRows] = await Promise.all([
        db
          .select()
          .from(reflectionPrompts)
          .where(eq(reflectionPrompts.planDayId, row.day.id))
          .orderBy(asc(reflectionPrompts.position)),
        db.select().from(prayers).where(eq(prayers.planDayId, row.day.id)).limit(1),
        db.select({ id: quizzes.id }).from(quizzes).where(eq(quizzes.planDayId, row.day.id)).limit(1),
        base.enrollment
          ? db
              .select()
              .from(planDayProgress)
              .where(and(eq(planDayProgress.enrollmentId, base.enrollment.id), eq(planDayProgress.planDayId, row.day.id)))
              .limit(1)
          : Promise.resolve([]),
        base.enrollment
          ? db
              .select({ step: planStepProgress.step })
              .from(planStepProgress)
              .where(and(eq(planStepProgress.enrollmentId, base.enrollment.id), eq(planStepProgress.planDayId, row.day.id)))
          : Promise.resolve([]),
      ]);
      const prayer = prayerRows[0];
      if (!prayer) throw new AppError("INTERNAL", "Plan day is missing prayer content");
      const progress = progressRows[0];
      apiDays.push({
        id: row.day.id,
        dayNumber: row.day.dayNumber,
        reading: {
          title: row.day.readingTitle,
          paragraphs: row.day.readingParagraphs,
          sermonQuote: row.day.sermonQuote,
          sermonClip:
            row.day.clipStartSeconds === null
              ? null
              : { startSeconds: row.day.clipStartSeconds, endSeconds: row.day.clipEndSeconds },
        },
        scriptureReference: {
          id: row.scripture.id,
          reference: row.scripture.canonicalReference,
          book: row.scripture.book,
          chapter: row.scripture.chapter,
          verseStart: row.scripture.verseStart,
          verseEnd: row.scripture.verseEnd,
        },
        reflectionPrompts: prompts.map((prompt) => ({ id: prompt.id, order: prompt.position, question: prompt.question })),
        prayer: { id: prayer.id, title: prayer.title, text: prayer.text },
        quickCheckId: quizRows[0]?.id ?? null,
        progress: {
          completedSteps: sortSteps(stepRows.map((item) => item.step)),
          scheduledOn: progress?.scheduledOn ?? null,
          startedAt: progress?.startedAt?.toISOString() ?? null,
          completedAt: progress?.completedAt?.toISOString() ?? null,
        },
      });
    }
    return { ...summary, days: apiDays };
  }

  return {
    async list(userId: string) {
      const visible = await db
        .select({ planId: plans.id })
        .from(plans)
        .leftJoin(
          userPlanEnrollments,
          and(eq(userPlanEnrollments.planId, plans.id), eq(userPlanEnrollments.userId, userId)),
        )
        .where(or(eq(plans.ownerUserId, userId), eq(plans.visibility, "sample"), eq(userPlanEnrollments.userId, userId)))
        .orderBy(asc(plans.createdAt));
      const summaries = [];
      for (const item of visible) {
        const base = await getVisibleBase(userId, item.planId);
        if (!base.plan.readyAt) continue;
        summaries.push(await buildSummary(base));
      }
      return summaries;
    },
    getDetail,
    getSummary,
    async start(userId: string, planId: string, timezone: string) {
      const base = await getVisibleBase(userId, planId);
      if (!base.plan.readyAt) throw new AppError("PLAN_NOT_READY", "Plan is still being generated");
      const now = new Date();
      const startDate = localDateInTimeZone(now, timezone);
      let enrollment = base.enrollment;
      if (enrollment?.status === "active" || enrollment?.status === "completed") return getDetail(userId, planId);

      await db.transaction(async (tx) => {
        if (!enrollment) {
          const [created] = await tx
            .insert(userPlanEnrollments)
            .values({
              userId,
              planId,
              status: "active",
              startDate,
              startedTimezone: timezone,
              startedAt: now,
              updatedAt: now,
            })
            .returning();
          if (!created) throw new AppError("INTERNAL");
          enrollment = created;
        } else {
          const [updated] = await tx
            .update(userPlanEnrollments)
            .set({
              status: "active",
              startDate,
              startedTimezone: timezone,
              startedAt: enrollment.startedAt ?? now,
              archivedAt: null,
              updatedAt: now,
            })
            .where(eq(userPlanEnrollments.id, enrollment.id))
            .returning();
          if (!updated) throw new AppError("INTERNAL");
          enrollment = updated;
        }

        const days = await tx.select().from(planDays).where(eq(planDays.planId, planId)).orderBy(asc(planDays.dayNumber));
        for (const day of days) {
          await tx
            .insert(planDayProgress)
            .values({
              enrollmentId: enrollment!.id,
              planDayId: day.id,
              scheduledOn: addCalendarDays(startDate, day.dayNumber - 1),
              scheduledTimezone: timezone,
            })
            .onConflictDoNothing();
        }
      });
      return getDetail(userId, planId);
    },
    async archive(userId: string, planId: string) {
      const base = await getVisibleBase(userId, planId);
      if (!base.enrollment) throw new AppError("CONFLICT", "Plan has not been started");
      const now = new Date();
      await db
        .update(userPlanEnrollments)
        .set({ status: "archived", archivedAt: now, updatedAt: now })
        .where(eq(userPlanEnrollments.id, base.enrollment.id));
      return getSummary(userId, planId);
    },
    async save(userId: string, planId: string) {
      await getVisibleBase(userId, planId);
      await db.insert(savedPlans).values({ userId, planId }).onConflictDoNothing();
    },
    async unsave(userId: string, planId: string) {
      await db.delete(savedPlans).where(and(eq(savedPlans.userId, userId), eq(savedPlans.planId, planId)));
    },
    getVisibleBase,
  };
}

export function sortSteps(values: Array<(typeof STEP_ORDER)[number]>) {
  const set = new Set(values);
  return STEP_ORDER.filter((step) => set.has(step));
}

function asPlanLength(value: number): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  if (value < 1 || value > 7) throw new AppError("INTERNAL", "Stored plan length is invalid");
  return value as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

function maxDate(a: Date, b: Date | null | undefined): Date {
  return b && b > a ? b : a;
}
