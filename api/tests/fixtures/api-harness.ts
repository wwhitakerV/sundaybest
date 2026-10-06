import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type postgres from "postgres";
import OpenAI from "openai";
import { buildApp } from "../../src/app.js";
import { createAppAttestVerifier } from "../../src/auth/app-attest.js";
import { createChallengeService } from "../../src/auth/challenge-service.js";
import { createJwtService } from "../../src/auth/jwt.js";
import { createSessionService } from "../../src/auth/session-service.js";
import type { Database } from "../../src/db/client.js";
import * as schema from "../../src/db/schema.js";
import { createBibleProvider } from "../../src/providers/bible-provider.js";
import { createTranscriptProvider } from "../../src/providers/transcript-provider.js";
import { createPlanGenerationProvider } from "../../src/providers/plan-generation-provider.js";
import { createGenerationWorker } from "../../src/worker/generation-worker.js";
import { dayOutput, finishTheVerseQuestion, generationInput, outlineOutput, quizOutput, testEnv } from "./generation.js";

/** The search result Supadata's fake returns for every term. */
export const SEARCH_HIT = "searchHit01";

/**
 * The real migrations, Drizzle queries, job worker and HTTP handlers on an
 * embedded PostgreSQL engine, with Supadata and OpenAI faked at the fetch
 * boundary. Counters say how often each provider was called; flags make the
 * next OpenAI answers fail in known ways.
 */
export async function apiHarness() {
  const pg = new PGlite();
  for (const filename of (await readdir("drizzle")).filter((n) => n.endsWith(".sql")).sort()) await pg.exec(await readFile(`drizzle/${filename}`, "utf8"));
  const db = drizzle(pg, { schema }) as unknown as Database;
  const taggedSql = async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.reduce((text, part, index) => text + (index ? `$${index}` : "") + part, "");
    return (await pg.query(query, values)).rows;
  };
  const sql = taggedSql as unknown as postgres.Sql;
  const env = testEnv({ DEV_SESSION_ENABLED: "true", SUPADATA_API_KEY: "test", WORKER_MAX_ATTEMPTS: "1" });
  const jwt = createJwtService(env);
  const counts = { transcripts: 0, jobPolls: 0, metadata: 0, searches: 0, openai: 0 };
  const flags: {
    invalidOutput: boolean;
    stealClaim: boolean;
    transcript: string[] | null;
    /** Runs as each OpenAI call arrives, named by its response schema, before it is answered. */
    onOpenAiCall: ((step: string) => Promise<void>) | null;
  } = { invalidOutput: false, stealClaim: false, transcript: null, onOpenAiCall: null };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (resource) => {
    const url = new URL(String(resource));
    if (url.hostname === "api.supadata.ai" && url.pathname === "/v1/youtube/search") {
      counts.searches++;
      return Response.json({ query: url.searchParams.get("query"), results: [{ type: "video", id: SEARCH_HIT, title: "Grace that saves", description: "", thumbnail: "https://example.test/s.jpg", duration: 1800, viewCount: 1, uploadDate: "2026-01-04", channel: { id: "c", name: "Search church" } }], totalResults: 1 });
    }
    if (url.hostname === "api.supadata.ai" && url.pathname === "/v1/metadata") {
      counts.metadata++;
      return Response.json({ platform: "youtube", type: "video", id: "5fVA7C24eI4", url: generationInput().sermon.canonicalUrl, title: "God's love", author: { displayName: "Test church" }, media: { type: "video", duration: 60, thumbnailUrl: "https://example.test/thumbnail.jpg" } });
    }
    if (url.hostname === "api.supadata.ai" && url.pathname === "/v1/transcript") {
      counts.transcripts++;
      assert.equal(url.searchParams.get("text"), "false");
      return Response.json({ jobId: "test-transcript-job" }, { status: 202 });
    }
    if (url.pathname === "/v1/transcript/test-transcript-job") {
      counts.jobPolls++;
      // `flags.transcript` replaces the sermon with other captions, 30 seconds each.
      const segments = flags.transcript?.map((text, index) => ({ text, startMs: index * 30_000, endMs: (index + 1) * 30_000 })) ?? generationInput().transcriptSegments!;
      return Response.json({ status: "completed", result: { lang: "en", content: segments.map((s) => ({ text: s.text, offset: s.startMs, duration: s.endMs! - s.startMs })) } });
    }
    throw new Error(`Unexpected test URL ${url.origin}${url.pathname}`);
  };
  const bible = createBibleProvider(env);
  const app = await buildApp({ env, database: { db, sql, close: async () => {} }, jwt,
    verifier: createAppAttestVerifier(env), challenges: createChallengeService(db), sessions: createSessionService(db, jwt, env), bible });
  const client = new OpenAI({ apiKey: "test-key", maxRetries: 0, fetch: async (_url, init) => {
    counts.openai++;
    // Each step names its response schema; answer it from that step's fixture.
    const request = JSON.parse(String(init?.body));
    const task = JSON.parse(request.messages.at(-1).content);
    const step = request.response_format.json_schema.name;
    await flags.onOpenAiCall?.(step);
    let output: unknown;
    if (step === "sundaybest_plan") {
      const outline = outlineOutput(task.request.lengthDays);
      // A day's passage is required, so one the sermon never names fails the plan.
      if (flags.invalidOutput) outline.days[0]!.scripture = { book: "Romans", chapter: 8, verseStart: 28, verseEnd: 28, reference: "Romans 8:28" };
      output = outline;
    } else if (step === "sundaybest_day") {
      const day = dayOutput(task.day.dayNumber);
      if (task.day.dayNumber === 1) day.supportingScriptures = [{ book: "Romans", chapter: 5, verseStart: 8, verseEnd: 8, reference: "Romans 5:8", connection: "God's love came first." }];
      output = day;
    } else {
      const quiz = quizOutput(task.day.dayNumber);
      if (task.day.dayNumber === 1) quiz.questions.push(finishTheVerseQuestion());
      output = quiz;
    }
    if (flags.stealClaim) await pg.query("update generation_jobs set locked_by = 'other-worker' where status = 'running'");
    return Response.json({ id: "test", object: "chat.completion", created: 0, model: "test-snapshot",
      usage: { prompt_tokens: 1000, completion_tokens: 500, total_tokens: 1500, prompt_tokens_details: { cached_tokens: 800 }, completion_tokens_details: { reasoning_tokens: 100 } },
      choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: JSON.stringify(output) } }] });
  } });
  const worker = createGenerationWorker({ db, sql, env, bible, transcripts: createTranscriptProvider(env), generator: createPlanGenerationProvider(env, { client }), workerId: "test-worker" });

  /** A signed-in installation: its own user, with request helpers. */
  async function user(installationId: string) {
    const session = await app.inject({ method: "POST", url: "/v1/dev/session", payload: { installationId, timezone: "UTC" } });
    assert.equal(session.statusCode, 200, session.body);
    const headers = { authorization: `Bearer ${session.json().accessToken}`, "x-client-timezone": "UTC" };
    const get = (url: string) => app.inject({ method: "GET", url, headers });
    const mutate = (method: "POST" | "PUT" | "PATCH", url: string, payload: object = {}, key: string = crypto.randomUUID()) =>
      app.inject({ method, url, headers: { ...headers, "idempotency-key": key }, payload });
    return { headers, get, mutate };
  }

  async function resolveSermon(as: Awaited<ReturnType<typeof user>>): Promise<string> {
    const resolved = await as.mutate("POST", "/v1/sermons/resolve", { url: generationInput().sermon.canonicalUrl });
    assert.equal(resolved.statusCode, 200, resolved.body);
    return resolved.json().sermon.id;
  }

  /** Every stored piece of a plan's content, without ids, for comparing two plans. */
  async function content(planId: string) {
    return {
      plan: (await pg.query("select title, about from plans where id = $1", [planId])).rows,
      days: (await pg.query("select day_number, reading_title, focus, reading_paragraphs, sermon_quote, clip_start_seconds, clip_end_seconds, supporting_scriptures from plan_days where plan_id = $1 order by day_number", [planId])).rows,
      quiz: (await pg.query<{ day_number: number }>("select d.day_number, q.position, q.kind, q.prompt, q.variants, c.text, c.is_correct from quiz_questions q join quizzes z on z.id = q.quiz_id join plan_days d on d.id = z.plan_day_id join quiz_choices c on c.question_id = q.id where z.plan_id = $1 order by d.day_number, q.position, c.position", [planId])).rows,
    };
  }

  async function close() {
    globalThis.fetch = originalFetch;
    await app.close();
    await pg.close();
  }

  return { pg, db, app, worker, counts, flags, user, resolveSermon, content, close };
}
