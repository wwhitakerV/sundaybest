import { and, asc, desc, eq, inArray, or } from "drizzle-orm";

import type { Database } from "../db/client.js";
import {
  planDayProgress,
  planDays,
  planStepProgress,
  plans,
  prayers,
  quizAnswers,
  quizAttempts,
  quizQuestions,
  quizzes,
  reflectionPrompts,
  savedPlans,
  scriptureReferences,
  sermonSources,
  userPlanEnrollments,
} from "../db/schema.js";
import { planAboutSchema } from "../contracts/plans.js";
import { addCalendarDays, localDateInTimeZone } from "../domain/time.js";
import { AppError } from "../http/errors.js";
import { toSermon } from "./sermon-service.js";

const STEP_ORDER = ["read", "scripture", "reflect", "pray"] as const;
const WORDS_PER_MINUTE = 150;
const PAUSE_MINUTES = 4;
const APPROX_WORDS_PER_VERSE = 20;

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

  async function buildQuickCheckStanding(userId: string, planDayId: string) {
    const quizRows = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.planDayId, planDayId))
      .limit(1);
    const quiz = quizRows[0];
    if (!quiz) return null;

    const questions = await db
      .select({ id: quizQuestions.id })
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quiz.id));

    const attemptRows = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quiz.id)))
      .orderBy(desc(quizAttempts.startedAt))
      .limit(1);
    const attempt = attemptRows[0];
    if (!attempt) {
      return {
        id: quiz.id,
        status: "notStarted" as const,
        questionCount: questions.length,
        answeredCount: 0,
        correctCount: 0,
      };
    }

    const answers = await db
      .select({ correct: quizAnswers.correct })
      .from(quizAnswers)
      .where(eq(quizAnswers.attemptId, attempt.id));

    return {
      id: quiz.id,
      status: attempt.status,
      questionCount: questions.length,
      answeredCount: answers.length,
      correctCount: answers.filter((answer) => answer.correct).length,
    };
  }

  async function buildDay(
    userId: string,
    base: Awaited<ReturnType<typeof getVisibleBase>>,
    row: {
      day: typeof planDays.$inferSelect;
      scripture: typeof scriptureReferences.$inferSelect;
    },
    today: string,
    priorIncomplete: boolean,
  ) {
    const [prompts, prayerRows, progressRows, stepRows, quickCheck] = await Promise.all([
      db
        .select()
        .from(reflectionPrompts)
        .where(eq(reflectionPrompts.planDayId, row.day.id))
        .orderBy(asc(reflectionPrompts.position)),
      db.select().from(prayers).where(eq(prayers.planDayId, row.day.id)).limit(1),
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
      buildQuickCheckStanding(userId, row.day.id),
    ]);

    const prayer = prayerRows[0];
    if (!prayer) throw new AppError("INTERNAL", "Plan day is missing prayer content");
    const progress = progressRows[0];
    const completedSteps = sortSteps(stepRows.map((item) => item.step));
    const status = deriveDayStatus({
      enrolled: Boolean(base.enrollment),
      dayNumber: row.day.dayNumber,
      priorIncomplete,
      scheduledOn: progress?.scheduledOn ?? null,
      startedAt: progress?.startedAt ?? null,
      completedAt: progress?.completedAt ?? null,
      completedSteps,
      today,
    });

    const estimatedMinutes = estimateDayMinutes({
      readingParagraphs: row.day.readingParagraphs,
      reflectionQuestions: prompts.map((prompt) => prompt.question),
      prayerText: prayer.text,
      verseCount: Math.max(1, row.scripture.verseEnd - row.scripture.verseStart + 1),
    });

    return {
      id: row.day.id,
      dayNumber: row.day.dayNumber,
      estimatedMinutes,
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
      quickCheckId: quickCheck?.id ?? null,
      quickCheck,
      progress: {
        status,
        completedSteps,
        scheduledOn: progress?.scheduledOn ?? null,
        startedAt: progress?.startedAt?.toISOString() ?? null,
        completedAt: progress?.completedAt?.toISOString() ?? null,
      },
    } as const;
  }

  async function buildPlan(userId: string, base: Awaited<ReturnType<typeof getVisibleBase>>, timezone: string) {
    if (!base.plan.readyAt) throw new AppError("PLAN_NOT_READY", "Plan is still being generated");
    const today = localDateInTimeZone(new Date(), timezone);
    const rows = await db
      .select({ day: planDays, scripture: scriptureReferences })
      .from(planDays)
      .innerJoin(scriptureReferences, eq(scriptureReferences.id, planDays.scriptureReferenceId))
      .where(eq(planDays.planId, base.plan.id))
      .orderBy(asc(planDays.dayNumber));

    const apiDays = [];
    let priorIncomplete = false;
    for (const row of rows) {
      const day = await buildDay(userId, base, row, today, priorIncomplete);
      apiDays.push(day);
      if (day.progress.status !== "completed") priorIncomplete = true;
    }

    const completedDays = apiDays.filter((day) => day.progress.status === "completed").length;
    const currentDay = apiDays.find((day) => day.progress.status !== "completed") ?? null;
    const status = base.enrollment?.status ?? "ready";
    const lengthDays = asPlanLength(base.plan.lengthDays);
    const summary = {
      id: base.plan.id,
      title: base.plan.title,
      status,
      lengthDays,
      estimatedMinutes: Math.max(1, apiDays.reduce((total, day) => total + day.estimatedMinutes, 0)),
      quickCheckEnabled: base.plan.quickCheckEnabled,
      isSample: base.plan.visibility === "sample",
      saved: Boolean(base.savedUserId),
      sermon: toSermon(base.sermon),
      progress: {
        completedDays,
        currentDayNumber: currentDay?.dayNumber ?? null,
        percentage: Math.round((completedDays / Math.max(1, base.plan.lengthDays)) * 100),
      },
      currentDay: currentDay
        ? {
            id: currentDay.id,
            dayNumber: currentDay.dayNumber,
            title: currentDay.reading.title,
            estimatedMinutes: currentDay.estimatedMinutes,
            scheduledOn: currentDay.progress.scheduledOn,
            status: currentDay.progress.status,
            quickCheck: currentDay.quickCheck,
          }
        : null,
      startDate: base.enrollment?.startDate ?? null,
      startedAt: base.enrollment?.startedAt?.toISOString() ?? null,
      completedAt: base.enrollment?.completedAt?.toISOString() ?? null,
      archivedAt: base.enrollment?.archivedAt?.toISOString() ?? null,
      createdAt: base.plan.createdAt.toISOString(),
      updatedAt: maxDate(base.plan.updatedAt, base.enrollment?.updatedAt).toISOString(),
    } as const;

    return { summary, days: apiDays };
  }

  async function getSummary(userId: string, planId: string, timezone: string) {
    const base = await getVisibleBase(userId, planId);
    return (await buildPlan(userId, base, timezone)).summary;
  }

  async function getDetail(userId: string, planId: string, timezone: string) {
    const base = await getVisibleBase(userId, planId);
    const built = await buildPlan(userId, base, timezone);
    // Stored JSON is untrusted on read; a malformed value hides the section rather than failing the plan.
    const about = planAboutSchema.safeParse(base.plan.about);
    return { ...built.summary, about: about.success ? about.data : null, days: built.days };
  }

  return {
    async list(userId: string, timezone: string) {
      // The list endpoint is a hot path for Home + Plans. Load its data in
      // batches instead of rebuilding each plan detail (which would create an
      // N+1 query pattern as a user's library grows).
      const bases = await db
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
          or(
            eq(plans.ownerUserId, userId),
            eq(plans.visibility, "sample"),
            eq(userPlanEnrollments.userId, userId),
          ),
        )
        .orderBy(asc(plans.createdAt));

      const readyBases = bases.filter((base) => base.plan.readyAt !== null);
      if (readyBases.length === 0) return [];

      const planIds = readyBases.map((base) => base.plan.id);
      const dayRows = await db
        .select({ day: planDays, scripture: scriptureReferences })
        .from(planDays)
        .innerJoin(scriptureReferences, eq(scriptureReferences.id, planDays.scriptureReferenceId))
        .where(inArray(planDays.planId, planIds))
        .orderBy(asc(planDays.planId), asc(planDays.dayNumber));

      const enrollmentIds = readyBases.flatMap((base) => (base.enrollment ? [base.enrollment.id] : []));
      const dayIds = dayRows.map((row) => row.day.id);

      const [progressRows, promptRows, prayerRows] = await Promise.all([
        enrollmentIds.length > 0
          ? db.select().from(planDayProgress).where(inArray(planDayProgress.enrollmentId, enrollmentIds))
          : Promise.resolve([]),
        dayIds.length > 0
          ? db
              .select({ planDayId: reflectionPrompts.planDayId, question: reflectionPrompts.question })
              .from(reflectionPrompts)
              .where(inArray(reflectionPrompts.planDayId, dayIds))
          : Promise.resolve([]),
        dayIds.length > 0
          ? db
              .select({ planDayId: prayers.planDayId, text: prayers.text })
              .from(prayers)
              .where(inArray(prayers.planDayId, dayIds))
          : Promise.resolve([]),
      ]);

      const rowsByPlan = new Map<string, typeof dayRows>();
      for (const row of dayRows) {
        const current = rowsByPlan.get(row.day.planId) ?? [];
        current.push(row);
        rowsByPlan.set(row.day.planId, current);
      }

      const progressByEnrollmentAndDay = new Map<string, (typeof progressRows)[number]>();
      for (const progress of progressRows) {
        progressByEnrollmentAndDay.set(`${progress.enrollmentId}:${progress.planDayId}`, progress);
      }

      const questionsByDay = new Map<string, string[]>();
      for (const prompt of promptRows) {
        const current = questionsByDay.get(prompt.planDayId) ?? [];
        current.push(prompt.question);
        questionsByDay.set(prompt.planDayId, current);
      }
      const prayerByDay = new Map(prayerRows.map((prayer) => [prayer.planDayId, prayer.text] as const));
      const today = localDateInTimeZone(new Date(), timezone);

      const summaries = readyBases.map((base) => {
        const rows = rowsByPlan.get(base.plan.id) ?? [];
        let priorIncomplete = false;
        let completedDays = 0;
        let currentDay: {
          id: string;
          dayNumber: number;
          title: string;
          estimatedMinutes: number;
          scheduledOn: string | null;
          status: "locked" | "available" | "inProgress" | "completed";
          quickCheck: Awaited<ReturnType<typeof buildQuickCheckStanding>>;
        } | null = null;
        let totalMinutes = 0;

        for (const row of rows) {
          const progress = base.enrollment
            ? progressByEnrollmentAndDay.get(`${base.enrollment.id}:${row.day.id}`)
            : undefined;
          const status = deriveDayStatus({
            enrolled: Boolean(base.enrollment),
            dayNumber: row.day.dayNumber,
            priorIncomplete,
            scheduledOn: progress?.scheduledOn ?? null,
            startedAt: progress?.startedAt ?? null,
            completedAt: progress?.completedAt ?? null,
            completedSteps: [],
            today,
          });
          const prayerText = prayerByDay.get(row.day.id);
          if (!prayerText) throw new AppError("INTERNAL", "Plan day is missing prayer content");
          const estimatedMinutes = estimateDayMinutes({
            readingParagraphs: row.day.readingParagraphs,
            reflectionQuestions: questionsByDay.get(row.day.id) ?? [],
            prayerText,
            verseCount: Math.max(1, row.scripture.verseEnd - row.scripture.verseStart + 1),
          });
          totalMinutes += estimatedMinutes;

          if (status === "completed") completedDays += 1;
          if (currentDay === null && status !== "completed") {
            currentDay = {
              id: row.day.id,
              dayNumber: row.day.dayNumber,
              title: row.day.readingTitle,
              estimatedMinutes,
              scheduledOn: progress?.scheduledOn ?? null,
              status,
              quickCheck: null,
            };
          }
          if (status !== "completed") priorIncomplete = true;
        }

        const lengthDays = asPlanLength(base.plan.lengthDays);
        return {
          id: base.plan.id,
          title: base.plan.title,
          status: base.enrollment?.status ?? ("ready" as const),
          lengthDays,
          estimatedMinutes: Math.max(1, totalMinutes),
          quickCheckEnabled: base.plan.quickCheckEnabled,
          isSample: base.plan.visibility === "sample",
          saved: Boolean(base.savedUserId),
          sermon: toSermon(base.sermon),
          progress: {
            completedDays,
            currentDayNumber: currentDay?.dayNumber ?? null,
            percentage: Math.round((completedDays / Math.max(1, base.plan.lengthDays)) * 100),
          },
          currentDay,
          startDate: base.enrollment?.startDate ?? null,
          startedAt: base.enrollment?.startedAt?.toISOString() ?? null,
          completedAt: base.enrollment?.completedAt?.toISOString() ?? null,
          archivedAt: base.enrollment?.archivedAt?.toISOString() ?? null,
          createdAt: base.plan.createdAt.toISOString(),
          updatedAt: maxDate(base.plan.updatedAt, base.enrollment?.updatedAt).toISOString(),
        };
      });

      // Only the current day appears in list responses, so Quick Check standing
      // is resolved for at most one day per plan instead of every day.
      await Promise.all(
        summaries.map(async (summary) => {
          if (!summary.currentDay) return;
          summary.currentDay.quickCheck = await buildQuickCheckStanding(userId, summary.currentDay.id);
        }),
      );

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
      if (enrollment?.status === "active" || enrollment?.status === "completed") {
        return getDetail(userId, planId, timezone);
      }

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
      return getDetail(userId, planId, timezone);
    },
    async archive(userId: string, planId: string, timezone: string) {
      const base = await getVisibleBase(userId, planId);
      if (!base.enrollment) throw new AppError("CONFLICT", "Plan has not been started");
      const now = new Date();
      await db
        .update(userPlanEnrollments)
        .set({ status: "archived", archivedAt: now, updatedAt: now })
        .where(eq(userPlanEnrollments.id, base.enrollment.id));
      return getSummary(userId, planId, timezone);
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

export function estimateDayMinutes(input: {
  readingParagraphs: readonly string[];
  reflectionQuestions: readonly string[];
  prayerText: string;
  verseCount: number;
}): number {
  const textWords = [...input.readingParagraphs, ...input.reflectionQuestions, input.prayerText]
    .reduce((total, text) => total + countWords(text), 0);
  const scriptureWords = Math.max(1, input.verseCount) * APPROX_WORDS_PER_VERSE;
  return Math.max(1, Math.round((textWords + scriptureWords) / WORDS_PER_MINUTE) + PAUSE_MINUTES);
}

function deriveDayStatus(input: {
  enrolled: boolean;
  dayNumber: number;
  priorIncomplete: boolean;
  scheduledOn: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  completedSteps: readonly string[];
  today: string;
}): "locked" | "available" | "inProgress" | "completed" {
  if (input.completedAt) return "completed";
  if (input.startedAt || input.completedSteps.length > 0) return "inProgress";
  if (!input.enrolled) return input.dayNumber === 1 ? "available" : "locked";
  if (input.priorIncomplete) return "locked";
  if (input.scheduledOn && input.scheduledOn > input.today) return "locked";
  return "available";
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function asPlanLength(value: number): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  if (value < 1 || value > 7) throw new AppError("INTERNAL", "Stored plan length is invalid");
  return value as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

function maxDate(a: Date, b: Date | null | undefined): Date {
  return b && b > a ? b : a;
}
