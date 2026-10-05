import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import type postgres from "postgres";
import OpenAI from "openai";
import { buildApp } from "../src/app.js";
import { createAppAttestVerifier } from "../src/auth/app-attest.js";
import { createChallengeService } from "../src/auth/challenge-service.js";
import { createJwtService } from "../src/auth/jwt.js";
import { createSessionService } from "../src/auth/session-service.js";
import type { Database } from "../src/db/client.js";
import * as schema from "../src/db/schema.js";
import { createBibleProvider } from "../src/providers/bible-provider.js";
import { createTranscriptProvider } from "../src/providers/transcript-provider.js";
import { createPlanGenerationProvider } from "../src/providers/plan-generation-provider.js";
import { createGenerationWorker } from "../src/worker/generation-worker.js";
import { generationInput, generationOutput, testEnv } from "./fixtures/generation.js";
import { getPlanResponseSchema, getStudyDayResponseSchema, getPlanGenerationResponseSchema } from "../src/contracts/index.js";

// Exercise the real migrations, Drizzle queries, job worker and HTTP handlers in
// an embedded PostgreSQL engine. Network providers use deterministic transports;
// this verifies plumbing, not live provider availability or theological quality.
test("YouTube resolve → transcript → OpenAI → SQL persistence → plan/study/quiz routes, cache and recovery", async () => {
  const pg = new PGlite();
  for (const filename of (await readdir('drizzle')).filter((n) => n.endsWith('.sql')).sort()) await pg.exec(await readFile(`drizzle/${filename}`, 'utf8'));
  const db = drizzle(pg, { schema }) as unknown as Database;
  const taggedSql = async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.reduce((text, part, index) => text + (index ? `$${index}` : '') + part, '');
    return (await pg.query(query, values)).rows;
  };
  const sql = taggedSql as unknown as postgres.Sql;
  const env = testEnv({ DEV_SESSION_ENABLED: "true", SUPADATA_API_KEY: "test", BIBLE_PROVIDER_URL: "https://bible.test/passage", WORKER_MAX_ATTEMPTS: "1" });
  const jwt = createJwtService(env);
  let transcriptRequests = 0;
  let jobPolls = 0;
  let openaiCalls = 0;
  let invalidOutput = false;
  let stealClaim = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (resource, init) => {
    const url = new URL(String(resource));
    if (url.hostname === 'api.supadata.ai' && url.pathname === '/v1/metadata') return Response.json({ platform: 'youtube', type: 'video', id: '5fVA7C24eI4', url: generationInput().sermon.canonicalUrl, title: "God's love", author: { displayName: 'Test church' }, media: { type: 'video', duration: 60, thumbnailUrl: 'https://example.test/thumbnail.jpg' } });
    if (url.hostname === 'api.supadata.ai' && url.pathname === '/v1/transcript') {
      transcriptRequests++;
      assert.equal(url.searchParams.get('text'), 'false');
      return Response.json({ jobId: 'test-transcript-job' }, { status: 202 });
    }
    if (url.pathname === '/v1/transcript/test-transcript-job') {
      jobPolls++;
      return Response.json({ status: 'completed', result: { lang: 'en', content: generationInput().transcriptSegments!.map((s) => ({ text: s.text, offset: s.startMs, duration: s.endMs! - s.startMs })) } });
    }
    if (url.hostname === 'bible.test') {
      const body = JSON.parse(String(init?.body));
      return Response.json({ reference: body.reference, translation: body.translation, provider: 'test-gateway', cacheAllowed: false, verses: [{ number: 16, text: 'Deterministic test passage, not production Scripture.' }] });
    }
    throw new Error(`Unexpected test URL ${url.origin}${url.pathname}`);
  };
  const bible = createBibleProvider(env);
  const app = await buildApp({ env, database: { db, sql, close: async () => {} }, jwt,
    verifier: createAppAttestVerifier(env), challenges: createChallengeService(db), sessions: createSessionService(db, jwt, env), bible });
  const client = new OpenAI({ apiKey: 'test-key', maxRetries: 0, fetch: async (_url, init) => {
    openaiCalls++;
    const request = JSON.parse(String(init?.body));
    const payload = JSON.parse(request.messages[1].content);
    const output = generationOutput(payload.request.lengthDays, payload.request.quickCheckEnabled);
    if (stealClaim) await pg.query("update generation_jobs set locked_by = 'other-worker' where status = 'running'");
    if (invalidOutput) output.days[0]!.sermonQuote = "Fabricated quotation";
    return Response.json({ id: 'test', object: 'chat.completion', created: 0, model: 'test-snapshot', choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: JSON.stringify(output) } }] });
  } });
  const worker = createGenerationWorker({ db, sql, env, bible, transcripts: createTranscriptProvider(env), generator: createPlanGenerationProvider(env, { client }), workerId: 'test-worker' });
  try {
    const session = await app.inject({ method: 'POST', url: '/v1/dev/session', payload: { installationId: 'pipeline-test', timezone: 'UTC' } });
    assert.equal(session.statusCode, 200, session.body);
    const token = session.json().accessToken;
    const headers = { authorization: `Bearer ${token}`, 'x-client-timezone': 'UTC' };
    const mutate = (method: 'POST' | 'PUT', url: string, payload: object = {}, key = crypto.randomUUID()) => app.inject({ method, url, headers: { ...headers, 'idempotency-key': key }, payload });
    const resolved = await mutate('POST', '/v1/sermons/resolve', { url: generationInput().sermon.canonicalUrl });
    assert.equal(resolved.statusCode, 200, resolved.body);
    const sermonId = resolved.json().sermon.id;
    for (const [days, quickCheck] of [[1, true], [7, false]] as const) {
      const key = crypto.randomUUID();
      const created = await mutate('POST', '/v1/plans', { sermonId, lengthDays: days, quickCheckEnabled: quickCheck }, key);
      assert.equal(created.statusCode, 200, created.body);
      const { planId, generationId } = created.json();
      const again = await mutate('POST', '/v1/plans', { sermonId, lengthDays: days, quickCheckEnabled: quickCheck }, key);
      assert.deepEqual(again.json(), created.json());
      assert.equal(await worker.runOnce(), true);
      const status = await app.inject({ method: 'GET', url: `/v1/plan-generations/${generationId}`, headers });
      const generation = getPlanGenerationResponseSchema.parse(status.json()).generation;
      assert.equal(generation.status, 'completed', status.body);
      const detail = await app.inject({ method: 'GET', url: `/v1/plans/${planId}`, headers });
      assert.equal(detail.statusCode, 200, detail.body);
      const plan = getPlanResponseSchema.parse(detail.json()).plan;
      assert.equal(plan.days.length, days);
      assert.equal(plan.days[0]!.reading.sermonClip?.endSeconds, 30);
      assert.equal(plan.days[0]!.quickCheckId !== null, quickCheck);
      const started = await mutate('POST', `/v1/plans/${planId}/start`);
      assert.equal(started.statusCode, 200, started.body);
      const study = await app.inject({ method: 'GET', url: `/v1/plans/${planId}/days/1`, headers });
      assert.equal(study.statusCode, 200, study.body);
      const studyDay = getStudyDayResponseSchema.parse(study.json()).day;
      assert.equal(studyDay.scripture.translation, 'NIV');
      assert.equal(studyDay.scripture.cacheAllowed, false);
      assert.equal((await pg.query('select * from scripture_texts')).rows.length, 0);
      if (quickCheck) {
        for (const step of ['read', 'scripture', 'reflect', 'pray']) {
          const response = await mutate('PUT', `/v1/plans/${planId}/days/1/steps/${step}`, { step });
          assert.equal(response.statusCode, 200, response.body);
        }
        const attempt = await mutate('POST', `/v1/quizzes/${plan.days[0]!.quickCheckId}/attempts`);
        assert.equal(attempt.statusCode, 200, attempt.body);
        const quiz = attempt.json().quiz;
        assert.equal(quiz.questions.length, 1);
        assert.equal(quiz.questions[0].choices.length, 4);
        assert.equal('correct' in quiz.questions[0].choices[0], false);
        assert.equal('isCorrect' in quiz.questions[0].choices[0], false);
        assert.equal('explanation' in quiz.questions[0], false);
        const answer = await mutate('POST', `/v1/quiz-attempts/${attempt.json().attempt.id}/answers`, {
          questionId: quiz.questions[0].id, choiceId: quiz.questions[0].choices[0].id,
        });
        assert.equal(answer.statusCode, 200, answer.body);
        assert.equal(answer.json().correct, true);
        const completed = await mutate('POST', `/v1/quiz-attempts/${attempt.json().attempt.id}/complete`);
        assert.equal(completed.statusCode, 200, completed.body);
        const dayDone = await mutate('POST', `/v1/plans/${planId}/days/1/complete`);
        assert.equal(dayDone.statusCode, 200, dayDone.body);
      }
      // Reclaim after a commit/queue acknowledgement crash must reuse content.
      await pg.query("update generation_jobs set status = 'queued', available_at = now() where generation_id = $1", [generationId]);
      const before = openaiCalls;
      assert.equal(await worker.runOnce(), true);
      assert.equal(openaiCalls, before);
    }
    assert.equal(transcriptRequests, 1);
    assert.equal(jobPolls, 1);
    assert.equal(openaiCalls, 2);
    assert.equal(await worker.runOnce(), false);
    invalidOutput = true;
    const failedCreate = await mutate('POST', '/v1/plans', { sermonId, lengthDays: 1, quickCheckEnabled: false });
    assert.equal(failedCreate.statusCode, 200, failedCreate.body);
    const failedIds = failedCreate.json();
    await worker.runOnce();
    const failure = await app.inject({ method: 'GET', url: `/v1/plan-generations/${failedIds.generationId}`, headers });
    assert.equal(failure.json().generation.status, 'failed', failure.body);
    const incomplete = await app.inject({ method: 'GET', url: `/v1/plans/${failedIds.planId}`, headers });
    assert.equal(incomplete.json().error.code, 'PLAN_NOT_READY', incomplete.body);
    assert.equal((await pg.query('select * from plan_days where plan_id = $1', [failedIds.planId])).rows.length, 0);
    invalidOutput = false;
    const retry = await mutate('POST', `/v1/plan-generations/${failedIds.generationId}/retry`);
    assert.equal(retry.statusCode, 200, retry.body);
    await worker.runOnce();
    const recovered = await app.inject({ method: 'GET', url: `/v1/plan-generations/${failedIds.generationId}`, headers });
    assert.equal(recovered.json().generation.status, 'completed', recovered.body);
    assert.equal(recovered.json().generation.attempt, 2);
    assert.equal(transcriptRequests, 1);
    stealClaim = true;
    const leaseCreate = await mutate('POST', '/v1/plans', { sermonId, lengthDays: 1, quickCheckEnabled: false });
    const leaseIds = leaseCreate.json();
    await worker.runOnce();
    const [leaseRow] = (await pg.query<{ status: string; locked_by: string }>('select status, locked_by from generation_jobs where generation_id = $1', [leaseIds.generationId])).rows;
    assert.equal(leaseRow!.status, 'running');
    assert.equal(leaseRow!.locked_by, 'other-worker');
    assert.equal((await pg.query('select * from plan_days where plan_id = $1', [leaseIds.planId])).rows.length, 0);
    stealClaim = false;
    await pg.query("update generation_jobs set status = 'queued', available_at = now() where generation_id = $1", [leaseIds.generationId]);
    await worker.runOnce();
    const leaseRecovered = await app.inject({ method: 'GET', url: `/v1/plan-generations/${leaseIds.generationId}`, headers });
    assert.equal(leaseRecovered.json().generation.status, 'completed');
  } finally {
    globalThis.fetch = originalFetch;
    await app.close();
    await pg.close();
  }
});
