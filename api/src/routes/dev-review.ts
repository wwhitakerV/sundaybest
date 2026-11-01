import { asc, desc, eq, inArray } from "drizzle-orm";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

import { apiIdSchema } from "../contracts/common.js";
import type { Database } from "../db/client.js";
import { planDays, planGenerations, plans, prayers, reflectionPrompts, scriptureReferences, sermonSources } from "../db/schema.js";
import { REVIEW_PAGE } from "../dev-admin/review-page.js";
import { dayJourneySchema, planFormationSchema } from "../generation/journey.js";
import { readingParagraphForApi } from "../generation/reading.js";
import { AppError } from "../http/errors.js";
import { parseWithSchema } from "../http/validation.js";

const reviewParamSchema = z.object({ planId: apiIdSchema });
/** A Read section as stored: `{ heading, content }`, or a plain string from before headings. */
const storedParagraphSchema = z.union([z.string(), z.object({ heading: z.string(), content: z.string() })]);

/**
 * Reading a generated plan whole, on the development API: every recent plan
 * (`/dev/admin/plans`), and one plan's review (`/dev/admin/plans/:id/review`,
 * shown by `/dev/admin/review`) — each day's Read with the points each section
 * covers, its passages, reflections and prayer, beside its six faculties and
 * the sermon's points it carries. Registered with the dev admin, so it shares
 * its switch and answers only the machine itself.
 */
export function registerDevReviewRoutes(app: FastifyInstance, db: Database, requireLocal: (request: FastifyRequest) => void): void {
  app.get("/dev/admin/review", async (request, reply) => {
    requireLocal(request);
    return reply.type("text/html; charset=utf-8").send(REVIEW_PAGE);
  });

  app.get("/dev/admin/plans", async (request) => {
    requireLocal(request);
    const rows = await db
      .select({ id: plans.id, title: plans.title, lengthDays: plans.lengthDays, readyAt: plans.readyAt, church: sermonSources.churchOrChannel, url: sermonSources.canonicalUrl })
      .from(plans)
      .innerJoin(sermonSources, eq(sermonSources.id, plans.sermonId))
      .orderBy(desc(plans.createdAt))
      .limit(30);
    const ids = rows.map((row) => row.id);
    const generations = ids.length
      ? await db.select({ planId: planGenerations.planId, status: planGenerations.status }).from(planGenerations)
        .where(inArray(planGenerations.planId, ids)).orderBy(desc(planGenerations.createdAt))
      : [];
    // Each plan's latest generation, the first seen in newest-first order.
    const latest = new Map<string, string>();
    for (const generation of generations) if (!latest.has(generation.planId)) latest.set(generation.planId, generation.status);
    return {
      plans: rows.map((row) => ({
        id: row.id,
        title: row.title,
        church: row.church,
        url: row.url,
        lengthDays: row.lengthDays,
        state: row.readyAt ? "ready" : latest.get(row.id) === "failed" ? "failed" : "generating",
      })),
    };
  });

  app.get("/dev/admin/plans/:planId/review", async (request) => {
    requireLocal(request);
    const { planId } = parseWithSchema(reviewParamSchema, request.params);
    const [plan] = await db.select({ title: plans.title, speakerName: plans.speakerName, formation: plans.formation, url: sermonSources.canonicalUrl })
      .from(plans).innerJoin(sermonSources, eq(sermonSources.id, plans.sermonId)).where(eq(plans.id, planId));
    if (!plan) throw new AppError("NOT_FOUND", "No plan with that id");
    const points = planFormationSchema.safeParse(plan.formation).data?.points ?? [];
    const [generation] = await db.select({ notes: planGenerations.notes }).from(planGenerations)
      .where(eq(planGenerations.planId, planId)).orderBy(desc(planGenerations.createdAt)).limit(1);
    const days = await db.select({ day: planDays, passage: scriptureReferences.canonicalReference })
      .from(planDays).innerJoin(scriptureReferences, eq(scriptureReferences.id, planDays.scriptureReferenceId))
      .where(eq(planDays.planId, planId)).orderBy(asc(planDays.dayNumber));
    const dayIds = days.map(({ day }) => day.id);
    const [reflections, dayPrayers] = dayIds.length === 0 ? [[], []] : await Promise.all([
      db.select().from(reflectionPrompts).where(inArray(reflectionPrompts.planDayId, dayIds)).orderBy(asc(reflectionPrompts.position)),
      db.select().from(prayers).where(inArray(prayers.planDayId, dayIds)),
    ]);
    return {
      plan: { title: plan.title, speakerName: plan.speakerName, url: plan.url, points },
      notes: z.array(z.string()).safeParse(generation?.notes).data ?? [],
      days: days.map(({ day, passage }) => {
        const journey = dayJourneySchema.safeParse(day.journey).data ?? null;
        const paragraphs = z.array(storedParagraphSchema).safeParse(day.readingParagraphs).data ?? [];
        const prayer = dayPrayers.find((candidate) => candidate.planDayId === day.id);
        return {
          dayNumber: day.dayNumber,
          readingTitle: day.readingTitle,
          focus: day.focus,
          passage,
          alsoReferenced: journey?.alsoReferenced.map((reference) => reference.reference) ?? [],
          points: points.filter((point) => journey?.pointIds.includes(point.id)),
          readingParagraphs: paragraphs.map((paragraph, index) => ({
            ...readingParagraphForApi(paragraph),
            pointIds: journey?.readingPointIds[index] ?? [],
          })),
          clip: day.clipStartSeconds === null || day.clipEndSeconds === null ? null : { startSeconds: day.clipStartSeconds, endSeconds: day.clipEndSeconds },
          reflections: reflections.filter((reflection) => reflection.planDayId === day.id).map((reflection) => reflection.question),
          prayer: prayer ? { title: prayer.title, text: prayer.text } : null,
          faculties: journey?.faculties ?? [],
          ending: journey?.ending ?? [],
        };
      }),
    };
  });
}
