import { and, asc, eq, ne } from "drizzle-orm";
import type postgres from "postgres";

import type { Env } from "../config/env.js";
import type { Database } from "../db/client.js";
import {
  generationJobs,
  planDays,
  planGenerations,
  plans,
  prayers,
  quizChoices,
  quizQuestions,
  quizzes,
  reflectionPrompts,
  scriptureReferences,
  sermonSources,
  sermonTranscriptSegments,
} from "../db/schema.js";
import { AppError } from "../http/errors.js";
import type { BibleProvider } from "../providers/bible-provider.js";
import type { GeneratedPlan, PlanGenerationProvider } from "../providers/plan-generation-provider.js";
import { formatTranscript, normalizeTranscript } from "../generation/transcript.js";
import { validateGeneratedContent } from "../generation/validation.js";
import type { TranscriptProvider } from "../providers/transcript-provider.js";

interface ClaimedJob {
  id: string;
  generationId: string;
  attempts: number;
}

export interface GenerationWorker {
  run(signal: AbortSignal): Promise<void>;
  runOnce(): Promise<boolean>;
}

export function createGenerationWorker(input: {
  db: Database;
  sql: postgres.Sql;
  env: Env;
  transcripts: TranscriptProvider;
  generator: PlanGenerationProvider;
  bible: BibleProvider;
  workerId?: string;
}): GenerationWorker {
  const workerId = input.workerId ?? `worker:${process.pid}:${crypto.randomUUID()}`;

  async function claim(): Promise<ClaimedJob | null> {
    const seconds = input.env.WORKER_LOCK_SECONDS;
    const rows = await input.sql<ClaimedJob[]>`
      with candidate as (
        select id
        from generation_jobs
        where
          (status = 'queued' and available_at <= now())
          or
          (status = 'running' and locked_at < now() - (${seconds} * interval '1 second'))
        order by available_at asc, created_at asc
        for update skip locked
        limit 1
      )
      update generation_jobs as job
      set status = 'running',
          attempts = job.attempts + 1,
          locked_at = now(),
          locked_by = ${workerId},
          updated_at = now()
      from candidate
      where job.id = candidate.id
      returning job.id, job.generation_id as "generationId", job.attempts
    `;
    return rows[0] ?? null;
  }

  async function processJob(job: ClaimedJob): Promise<void> {
    const heartbeatMs = Math.max(5_000, Math.floor((input.env.WORKER_LOCK_SECONDS * 1000) / 3));
    const heartbeat = setInterval(() => {
      void input.db
        .update(generationJobs)
        .set({ lockedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(generationJobs.id, job.id),
            eq(generationJobs.status, "running"),
            eq(generationJobs.lockedBy, workerId),
          ),
        )
        .catch(() => undefined);
    }, heartbeatMs);
    heartbeat.unref();

    try {
      const generationRows = await input.db
        .select({ generation: planGenerations, plan: plans, sermon: sermonSources })
        .from(planGenerations)
        .innerJoin(plans, eq(plans.id, planGenerations.planId))
        .innerJoin(sermonSources, eq(sermonSources.id, plans.sermonId))
        .where(eq(planGenerations.id, job.generationId))
        .limit(1);
      const context = generationRows[0];
      if (!context) throw new AppError("INTERNAL", "Generation job points to missing data");

      // A worker can die after the content transaction commits but before the
      // queue row is marked complete. A reclaimed job must not call providers
      // or regenerate already-published content.
      if (context.generation.status === "completed") {
        await input.db
          .update(generationJobs)
          .set({ status: "completed", lockedAt: null, lockedBy: null, lastError: null, updatedAt: new Date() })
          .where(and(eq(generationJobs.id, job.id), eq(generationJobs.lockedBy, workerId)));
        return;
      }

      await setGenerationStatus(input.db, context.generation.id, "processingSermon", {
        startedAt: context.generation.startedAt ?? new Date(),
      });

      let transcriptRows = await input.db
        .select()
        .from(sermonTranscriptSegments)
        .where(eq(sermonTranscriptSegments.sermonId, context.sermon.id))
        .orderBy(asc(sermonTranscriptSegments.sequence));
      if (transcriptRows.length === 0) {
        const transcript = await input.transcripts.fetch({
          externalId: context.sermon.externalId,
          canonicalUrl: context.sermon.canonicalUrl,
          title: context.sermon.title,
          church: context.sermon.churchOrChannel,
        });
        await input.db.transaction(async (tx) => {
          // Concurrent plans for one sermon must reuse one complete transcript,
          // rather than interleaving segments from separate provider responses.
          await tx.select({ id: sermonSources.id }).from(sermonSources)
            .where(eq(sermonSources.id, context.sermon.id)).for("update");
          const existing = await tx.select({ id: sermonTranscriptSegments.id }).from(sermonTranscriptSegments)
            .where(eq(sermonTranscriptSegments.sermonId, context.sermon.id)).limit(1);
          if (existing.length > 0) return;
          for (const [index, segment] of transcript.segments.entries()) {
            await tx.insert(sermonTranscriptSegments).values({
              sermonId: context.sermon.id,
              sequence: index,
              startMs: segment.startMs,
              endMs: segment.endMs,
              text: segment.text,
            });
          }
          await tx
            .update(sermonSources)
            .set({
              transcriptStatus: transcript.kind === "autoCaptions" ? "autoCaptions" : "available",
              transcriptLanguage: transcript.language,
              updatedAt: new Date(),
            })
            .where(eq(sermonSources.id, context.sermon.id));
        });
        transcriptRows = await input.db
          .select()
          .from(sermonTranscriptSegments)
          .where(eq(sermonTranscriptSegments.sermonId, context.sermon.id))
          .orderBy(asc(sermonTranscriptSegments.sequence));
      }

      await setGenerationStatus(input.db, context.generation.id, "findingScripture");
      const transcriptSegments = normalizeTranscript(transcriptRows);
      const transcriptText = formatTranscript(transcriptSegments);
      await setGenerationStatus(input.db, context.generation.id, "writingDays");
      const generationInput = {
        sermon: {
          externalId: context.sermon.externalId,
          canonicalUrl: context.sermon.canonicalUrl,
          title: context.sermon.title,
          church: context.sermon.churchOrChannel,
          durationSeconds: context.sermon.durationSeconds,
        },
        transcript: transcriptText,
        transcriptSegments,
        lengthDays: context.generation.requestedLength,
        quickCheckEnabled: context.generation.quickCheckEnabled,
      };
      const generated = await input.generator.generate(generationInput);
      await validateGeneratedContent(generated, generationInput, input.bible);
      if (context.generation.quickCheckEnabled) {
        await setGenerationStatus(input.db, context.generation.id, "buildingQuiz");
      }
      await persistGeneratedPlan(input.db, context.plan.id, context.generation.id, generated, job.id, workerId);
    } catch (cause) {
      await handleFailure(input.db, job, input.env, cause, workerId);
    } finally {
      clearInterval(heartbeat);
    }
  }

  return {
    async runOnce() {
      const job = await claim();
      if (!job) return false;
      await processJob(job);
      return true;
    },
    async run(signal) {
      while (!signal.aborted) {
        const worked = await this.runOnce();
        if (!worked) await sleep(input.env.WORKER_POLL_MS, signal);
      }
    },
  };
}

async function setGenerationStatus(
  db: Database,
  generationId: string,
  status: typeof planGenerations.$inferSelect.status,
  extra: { startedAt?: Date } = {},
): Promise<void> {
  await db
    .update(planGenerations)
    .set({ status, updatedAt: new Date(), ...(extra.startedAt ? { startedAt: extra.startedAt } : {}) })
    .where(and(eq(planGenerations.id, generationId), ne(planGenerations.status, "completed")));
}

async function persistGeneratedPlan(db: Database, planId: string, generationId: string, generated: GeneratedPlan, jobId: string, workerId: string): Promise<void> {
  const now = new Date();
  await db.transaction(async (tx) => {
    const [claim] = await tx.select().from(generationJobs).where(eq(generationJobs.id, jobId)).for("update");
    if (!claim || claim.status !== "running" || claim.lockedBy !== workerId) {
      throw new AppError("INTERNAL", "Generation worker no longer owns this job");
    }
    await tx.delete(planDays).where(eq(planDays.planId, planId));

    for (const day of generated.days) {
      let refs = await tx
        .select()
        .from(scriptureReferences)
        .where(eq(scriptureReferences.canonicalReference, day.scripture.reference))
        .limit(1);
      if (!refs[0]) {
        const created = await tx
          .insert(scriptureReferences)
          .values({
            book: day.scripture.book,
            chapter: day.scripture.chapter,
            verseStart: day.scripture.verseStart,
            verseEnd: day.scripture.verseEnd,
            canonicalReference: day.scripture.reference,
          })
          .onConflictDoNothing()
          .returning();
        refs = created.length
          ? created
          : await tx
              .select()
              .from(scriptureReferences)
              .where(eq(scriptureReferences.canonicalReference, day.scripture.reference))
              .limit(1);
      }
      const scripture = refs[0];
      if (!scripture) throw new AppError("INTERNAL", "Could not persist Scripture reference");

      const [planDay] = await tx
        .insert(planDays)
        .values({
          planId,
          dayNumber: day.dayNumber,
          readingTitle: day.readingTitle,
          readingParagraphs: day.readingParagraphs,
          sermonQuote: day.sermonQuote,
          clipStartSeconds: day.clipStartSeconds,
          clipEndSeconds: day.clipEndSeconds,
          scriptureReferenceId: scripture.id,
        })
        .returning();
      if (!planDay) throw new AppError("INTERNAL", "Could not persist plan day");

      for (const [index, question] of day.reflections.entries()) {
        await tx.insert(reflectionPrompts).values({ planDayId: planDay.id, position: index + 1, question });
      }
      await tx.insert(prayers).values({ planDayId: planDay.id, title: day.prayer.title, text: day.prayer.text });

      if (day.quickCheck) {
        const [quiz] = await tx
          .insert(quizzes)
          .values({ planId, planDayId: planDay.id, title: day.quickCheck.title })
          .returning();
        if (!quiz) throw new AppError("INTERNAL", "Could not persist Quick Check");
        for (const [questionIndex, question] of day.quickCheck.questions.entries()) {
          const [questionRow] = await tx
            .insert(quizQuestions)
            .values({
              quizId: quiz.id,
              position: questionIndex + 1,
              kind: question.kind,
              source: question.source,
              prompt: question.prompt,
              scriptureReference: question.scriptureReference,
              explanation: question.explanation,
            })
            .returning();
          if (!questionRow) throw new AppError("INTERNAL", "Could not persist Quick Check question");
          for (const [choiceIndex, choice] of question.choices.entries()) {
            await tx.insert(quizChoices).values({
              questionId: questionRow.id,
              position: choiceIndex + 1,
              label: choice.label,
              text: choice.text,
              isCorrect: choice.correct,
            });
          }
        }
      }
    }

    await tx
      .update(plans)
      .set({ title: generated.title, readyAt: now, updatedAt: now })
      .where(eq(plans.id, planId));
    await tx
      .update(planGenerations)
      .set({
        status: "completed",
        generatorVersion: generated.generator.version,
        promptVersion: generated.generator.promptVersion,
        modelProvider: generated.generator.provider,
        modelName: generated.generator.model,
        errorCode: null,
        errorMessage: null,
        finishedAt: now,
        updatedAt: now,
      })
      .where(eq(planGenerations.id, generationId));
    await tx.update(generationJobs).set({ status: "completed", lockedAt: null, lockedBy: null, lastError: null, updatedAt: now })
      .where(eq(generationJobs.id, jobId));
  });
}

async function handleFailure(db: Database, job: ClaimedJob, env: Env, cause: unknown, workerId: string): Promise<void> {
  const message = cause instanceof Error ? cause.message.slice(0, 1000) : "Unknown generation failure";
  const shouldRetry = job.attempts < env.WORKER_MAX_ATTEMPTS;
  await db.transaction(async (tx) => {
    const [claim] = await tx.select().from(generationJobs).where(eq(generationJobs.id, job.id)).for("update");
    // A recovered job belongs to its new worker; an old worker cannot requeue it.
    if (!claim || claim.status !== "running" || claim.lockedBy !== workerId) return;
    if (shouldRetry) {
      const delaySeconds = Math.min(60, 5 * 2 ** Math.max(0, job.attempts - 1));
      await tx.update(generationJobs).set({ status: "queued", availableAt: new Date(Date.now() + delaySeconds * 1000),
        lockedAt: null, lockedBy: null, lastError: message, updatedAt: new Date() }).where(eq(generationJobs.id, job.id));
      return;
    }
    const failure = toPublicGenerationFailure(cause);
    const now = new Date();
    await tx.update(generationJobs).set({ status: "failed", lockedAt: null, lockedBy: null, lastError: message, updatedAt: now })
      .where(eq(generationJobs.id, job.id));
    await tx.update(planGenerations).set({ status: "failed", errorCode: failure.code, errorMessage: failure.message, finishedAt: now, updatedAt: now })
      .where(and(eq(planGenerations.id, job.generationId), ne(planGenerations.status, "completed")));
  });
}

function toPublicGenerationFailure(cause: unknown): {
  code: "invalidLink" | "unsupportedSource" | "videoUnavailable" | "noCaptions" | "network" | "unknown";
  message: string;
} {
  if (cause instanceof AppError) {
    switch (cause.code) {
      case "TRANSCRIPT_UNAVAILABLE":
        return {
          code: "noCaptions",
          message: "We couldn’t find usable captions for this sermon.",
        };
      case "SERMON_UNSUPPORTED":
        return {
          code: "unsupportedSource",
          message: "This sermon source isn’t supported yet.",
        };
      case "SERMON_UNAVAILABLE":
        return {
          code: "videoUnavailable",
          message: "This sermon isn’t available right now.",
        };
      default:
        break;
    }
  }

  return {
    code: "unknown",
    message: "We couldn’t build this plan right now. Please try again.",
  };
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}
