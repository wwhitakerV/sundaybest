import { and, asc, eq } from "drizzle-orm";

import type { Database } from "../db/client.js";
import {
  planDayProgress,
  planStepProgress,
  prayers,
  quizAttempts,
  quizzes,
  reflectionPrompts,
  scriptureReferences,
  scriptureTexts,
  userPlanEnrollments,
  userSettings,
} from "../db/schema.js";
import { AppError } from "../http/errors.js";
import type { BibleProvider } from "../providers/bible-provider.js";
import { sortSteps } from "./plan-service.js";
import { requireStudyAccess } from "./study-access.js";

const STEP_ORDER = ["read", "scripture", "reflect", "pray"] as const;
type StudyStep = (typeof STEP_ORDER)[number];

export function createStudyService(db: Database, bibleProvider: BibleProvider) {
  return {
    async getDay(userId: string, planId: string, dayNumber: number, timezone: string) {
      const access = await requireStudyAccess({ db, userId, planId, dayNumber, timezone });
      const [scriptureRows, promptRows, prayerRows, quizRows, stepRows, settingsRows] = await Promise.all([
        db.select().from(scriptureReferences).where(eq(scriptureReferences.id, access.day.scriptureReferenceId)).limit(1),
        db
          .select()
          .from(reflectionPrompts)
          .where(eq(reflectionPrompts.planDayId, access.day.id))
          .orderBy(asc(reflectionPrompts.position)),
        db.select().from(prayers).where(eq(prayers.planDayId, access.day.id)).limit(1),
        db.select({ id: quizzes.id }).from(quizzes).where(eq(quizzes.planDayId, access.day.id)).limit(1),
        db
          .select({ step: planStepProgress.step })
          .from(planStepProgress)
          .where(and(eq(planStepProgress.enrollmentId, access.enrollment.id), eq(planStepProgress.planDayId, access.day.id))),
        db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1),
      ]);
      const scripture = scriptureRows[0];
      const prayer = prayerRows[0];
      const settings = settingsRows[0];
      if (!scripture || !prayer || !settings) throw new AppError("INTERNAL", "Study content is incomplete");

      const translation = settings.bibleTranslation;
      let textRows = await db
        .select()
        .from(scriptureTexts)
        .where(and(eq(scriptureTexts.referenceId, scripture.id), eq(scriptureTexts.translation, translation)))
        .limit(1);
      let verses: Array<{ number: number; text: string }>;
      if (textRows[0]) {
        verses = textRows[0].verses;
      } else {
        const passage = await bibleProvider.getPassage({ reference: scripture.canonicalReference, translation });
        verses = passage.verses;
        if (passage.cacheAllowed) {
          await db
            .insert(scriptureTexts)
            .values({
              referenceId: scripture.id,
              translation,
              verses,
              provider: passage.provider,
              providerVersion: passage.providerVersion ?? null,
            })
            .onConflictDoUpdate({
              target: [scriptureTexts.referenceId, scriptureTexts.translation],
              set: { verses, provider: passage.provider, providerVersion: passage.providerVersion ?? null, fetchedAt: new Date() },
            });
          textRows = await db
            .select()
            .from(scriptureTexts)
            .where(and(eq(scriptureTexts.referenceId, scripture.id), eq(scriptureTexts.translation, translation)))
            .limit(1);
        }
      }

      return {
        id: access.day.id,
        planId,
        dayNumber,
        reading: {
          title: access.day.readingTitle,
          paragraphs: access.day.readingParagraphs,
          sermonQuote: access.day.sermonQuote,
          sermonClip:
            access.day.clipStartSeconds === null
              ? null
              : { startSeconds: access.day.clipStartSeconds, endSeconds: access.day.clipEndSeconds },
        },
        scripture: {
          id: scripture.id,
          reference: scripture.canonicalReference,
          book: scripture.book,
          chapter: scripture.chapter,
          verseStart: scripture.verseStart,
          verseEnd: scripture.verseEnd,
          translation,
          verses,
        },
        reflectionPrompts: promptRows.map((prompt) => ({ id: prompt.id, order: prompt.position, question: prompt.question })),
        prayer: { id: prayer.id, title: prayer.title, text: prayer.text },
        quickCheckId: quizRows[0]?.id ?? null,
        progress: {
          status: access.progress.completedAt
            ? "completed"
            : access.progress.startedAt || stepRows.length > 0
              ? "inProgress"
              : "available",
          completedSteps: sortSteps(stepRows.map((row) => row.step)),
          scheduledOn: access.progress.scheduledOn,
          startedAt: access.progress.startedAt?.toISOString() ?? null,
          completedAt: access.progress.completedAt?.toISOString() ?? null,
        },
      };
    },

    async completeStep(userId: string, planId: string, dayNumber: number, step: StudyStep, timezone: string) {
      const access = await requireStudyAccess({ db, userId, planId, dayNumber, timezone });
      if (access.progress.completedAt) {
        const rows = await db
          .select({ step: planStepProgress.step })
          .from(planStepProgress)
          .where(and(eq(planStepProgress.enrollmentId, access.enrollment.id), eq(planStepProgress.planDayId, access.day.id)));
        return { completedSteps: sortSteps(rows.map((row) => row.step)), updatedAt: access.progress.completedAt.toISOString() };
      }

      const existing = await db
        .select({ step: planStepProgress.step })
        .from(planStepProgress)
        .where(and(eq(planStepProgress.enrollmentId, access.enrollment.id), eq(planStepProgress.planDayId, access.day.id)));
      const completed = sortSteps(existing.map((row) => row.step));
      if (completed.includes(step)) return { completedSteps: completed, updatedAt: new Date().toISOString() };
      const expected = STEP_ORDER[completed.length];
      if (expected !== step) throw new AppError("STUDY_INCOMPLETE", `Complete ${expected ?? "the previous step"} first`);

      const now = new Date();
      await db.transaction(async (tx) => {
        await tx.insert(planStepProgress).values({ enrollmentId: access.enrollment.id, planDayId: access.day.id, step, completedAt: now });
        if (!access.progress.startedAt) {
          await tx.update(planDayProgress).set({ startedAt: now }).where(eq(planDayProgress.id, access.progress.id));
        }
      });
      return { completedSteps: [...completed, step], updatedAt: now.toISOString() };
    },

    async completeDay(userId: string, planId: string, dayNumber: number, timezone: string) {
      const access = await requireStudyAccess({ db, userId, planId, dayNumber, timezone });
      if (access.progress.completedAt) {
        return {
          completedAt: access.progress.completedAt.toISOString(),
          planCompletedAt: access.enrollment.completedAt?.toISOString() ?? null,
        };
      }

      const steps = await db
        .select({ step: planStepProgress.step })
        .from(planStepProgress)
        .where(and(eq(planStepProgress.enrollmentId, access.enrollment.id), eq(planStepProgress.planDayId, access.day.id)));
      if (sortSteps(steps.map((row) => row.step)).length !== STEP_ORDER.length) {
        throw new AppError("STUDY_INCOMPLETE", "Complete Read, Scripture, Reflect and Pray first");
      }

      if (access.plan.quickCheckEnabled) {
        const quizRows = await db.select({ id: quizzes.id }).from(quizzes).where(eq(quizzes.planDayId, access.day.id)).limit(1);
        const quiz = quizRows[0];
        if (!quiz) throw new AppError("INTERNAL", "Quick Check content is missing");
        const completedAttempt = await db
          .select({ id: quizAttempts.id })
          .from(quizAttempts)
          .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quiz.id), eq(quizAttempts.status, "completed")))
          .limit(1);
        if (!completedAttempt[0]) throw new AppError("QUICK_CHECK_REQUIRED", "Complete Quick Check before finishing this day");
      }

      const now = new Date();
      const planCompletedAt = await db.transaction(async (tx): Promise<Date | null> => {
        await tx
          .update(planDayProgress)
          .set({ completedAt: now, completedLocalDate: access.localDate, completedTimezone: timezone })
          .where(eq(planDayProgress.id, access.progress.id));

        // Recount directly after the update; the server never trusts a client-provided day count.
        const all = await tx
          .select({ completedAt: planDayProgress.completedAt })
          .from(planDayProgress)
          .where(eq(planDayProgress.enrollmentId, access.enrollment.id));
        if (all.length === access.plan.lengthDays && all.every((row) => row.completedAt !== null)) {
          await tx
            .update(userPlanEnrollments)
            .set({ status: "completed", completedAt: now, updatedAt: now })
            .where(eq(userPlanEnrollments.id, access.enrollment.id));
          return now;
        }
        return null;
      });

      return { completedAt: now.toISOString(), planCompletedAt: planCompletedAt?.toISOString() ?? null };
    },
  };
}
