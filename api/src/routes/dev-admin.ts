import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";

import type { AppContext } from "../app-context.js";
import { apiIdSchema, planLengthSchema } from "../contracts/common.js";
import { planGenerations, plans, sermonSources, users } from "../db/schema.js";
import { DEV_ADMIN_PAGE } from "../dev-admin/page.js";
import { AppError } from "../http/errors.js";
import { parseWithSchema } from "../http/validation.js";
import { createGenerationService } from "../services/generation-service.js";
import { createSermonService } from "../services/sermon-service.js";
import { registerDevReviewRoutes } from "./dev-review.js";

/** Who owns our plans: one users row, found by its name, made the first time one is added. */
const OWNER_NAME = "SundayBest (our plans)";

/** The machine itself — never a phone or anyone else on the network. */
const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

const addSampleSchema = z
  .object({ url: z.string().url(), lengthDays: planLengthSchema, quickCheckEnabled: z.boolean() })
  .strict();
const sampleParamSchema = z.object({ planId: apiIdSchema });

const sampleSchema = z.object({
  id: apiIdSchema,
  title: z.string(),
  church: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  /** The sermon on YouTube. */
  url: z.string(),
  lengthDays: z.number().int(),
  /** Ready to try; still being written; or its generation failed. */
  state: z.enum(["ready", "generating", "failed"]),
  /** The generation's own step or error, for the page to say what's happening. */
  detail: z.string().nullable(),
});
const listSamplesResponseSchema = z.object({ samples: z.array(sampleSchema) });
const addSampleResponseSchema = z.object({ planId: apiIdSchema });
const removeSampleResponseSchema = z.object({ ok: z.literal(true) });

/**
 * Our plans — the ones "Try one of ours" offers — managed from a page on the
 * development API (`/dev/admin`): add one from a YouTube sermon (it's
 * generated as any plan is, by the worker, then marked as ours), or remove
 * one (it leaves "Try one of ours"; anyone already studying it keeps it).
 *
 * Development only, behind the same switch as `/v1/dev/session`, and only
 * from the machine itself: a phone on the network gets a 404.
 */
export function registerDevAdminRoutes(app: FastifyInstance, context: AppContext): void {
  if (context.env.NODE_ENV === "production" || !context.env.DEV_SESSION_ENABLED) return;

  const { db } = context.database;
  const sermonService = createSermonService(db, context.env);
  const generationService = createGenerationService(db);

  // The socket's own peer, not `request.ip`: a proxy header can't make a request local.
  const requireLocal = (request: FastifyRequest) => {
    if (!LOOPBACK.has(request.socket.remoteAddress ?? "")) {
      throw new AppError("NOT_FOUND", "Route not found");
    }
  };

  async function ownerId(): Promise<string> {
    const [found] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.displayName, OWNER_NAME))
      .limit(1);
    if (found) return found.id;
    const [made] = await db
      .insert(users)
      .values({ displayName: OWNER_NAME, onboardedAt: new Date() })
      .returning({ id: users.id });
    if (!made) throw new AppError("INTERNAL", "Could not make the owner of our plans");
    return made.id;
  }

  app.get("/dev/admin", async (request, reply) => {
    requireLocal(request);
    return reply.type("text/html; charset=utf-8").send(DEV_ADMIN_PAGE);
  });

  app.get("/dev/admin/samples", async (request) => {
    requireLocal(request);
    const rows = await db
      .select({
        id: plans.id,
        title: plans.title,
        lengthDays: plans.lengthDays,
        readyAt: plans.readyAt,
        church: sermonSources.churchOrChannel,
        thumbnailUrl: sermonSources.thumbnailUrl,
        url: sermonSources.canonicalUrl,
      })
      .from(plans)
      .innerJoin(sermonSources, eq(sermonSources.id, plans.sermonId))
      .where(eq(plans.visibility, "sample"))
      .orderBy(desc(plans.createdAt));

    const ids = rows.map((row) => row.id);
    const generations = ids.length
      ? await db
          .select({
            planId: planGenerations.planId,
            status: planGenerations.status,
            errorCode: planGenerations.errorCode,
          })
          .from(planGenerations)
          .where(inArray(planGenerations.planId, ids))
          .orderBy(desc(planGenerations.createdAt))
      : [];
    // Each plan's latest generation, the first seen in newest-first order.
    const latest = new Map<string, (typeof generations)[number]>();
    for (const generation of generations) {
      if (!latest.has(generation.planId)) latest.set(generation.planId, generation);
    }

    return listSamplesResponseSchema.parse({
      samples: rows.map((row) => {
        const generation = latest.get(row.id);
        const failed = !row.readyAt && generation?.status === "failed";
        return {
          id: row.id,
          title: row.title,
          church: row.church,
          thumbnailUrl: row.thumbnailUrl,
          url: row.url,
          lengthDays: row.lengthDays,
          state: row.readyAt ? "ready" : failed ? "failed" : "generating",
          detail: row.readyAt ? null : failed ? (generation?.errorCode ?? null) : (generation?.status ?? null),
        };
      }),
    });
  });

  app.post("/dev/admin/samples", async (request) => {
    requireLocal(request);
    const body = parseWithSchema(addSampleSchema, request.body);
    const sermon = await sermonService.resolve(body.url);
    const { planId } = await generationService.create(
      await ownerId(),
      { sermonId: sermon.id, lengthDays: body.lengthDays, quickCheckEnabled: body.quickCheckEnabled },
      `dev-admin:${randomUUID()}`,
    );
    await db.update(plans).set({ visibility: "sample", updatedAt: new Date() }).where(eq(plans.id, planId));
    return addSampleResponseSchema.parse({ planId });
  });

  app.delete("/dev/admin/samples/:planId", async (request) => {
    requireLocal(request);
    const { planId } = parseWithSchema(sampleParamSchema, request.params);
    // Back to private: out of "Try one of ours", while anyone already studying it keeps it.
    const [removed] = await db
      .update(plans)
      .set({ visibility: "private", updatedAt: new Date() })
      .where(and(eq(plans.id, planId), eq(plans.visibility, "sample")))
      .returning({ id: plans.id });
    if (!removed) throw new AppError("NOT_FOUND", "That plan isn't one of ours");
    return removeSampleResponseSchema.parse({ ok: true });
  });

  registerDevReviewRoutes(app, db, requireLocal);
}
