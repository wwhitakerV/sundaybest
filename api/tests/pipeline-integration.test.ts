import assert from "node:assert/strict";
import test from "node:test";
import { getPlanResponseSchema, getStudyDayResponseSchema, getPlanGenerationResponseSchema } from "../src/contracts/index.js";
import { apiHarness } from "./fixtures/api-harness.js";
import { QUICK_CHECK_QUESTIONS } from "./fixtures/generation.js";

// Exercise the real migrations, Drizzle queries, job worker and HTTP handlers in
// an embedded PostgreSQL engine. Network providers use deterministic transports;
// this verifies plumbing, not live provider availability or theological quality.
test("YouTube resolve → transcript → OpenAI → SQL persistence → plan/study/quiz routes, cache and recovery", async () => {
  const harness = await apiHarness();
  const { app, pg, worker, counts, flags } = harness;
  try {
    const first = await harness.user("pipeline-test");
    const settings = await first.get("/v1/me/settings");
    assert.equal(settings.json().settings.bibleTranslation, "BSB", settings.body);
    const unavailable = await first.mutate("PATCH", "/v1/me/settings", { bibleTranslation: "NIV" });
    assert.equal(unavailable.statusCode, 400, unavailable.body);
    const sermonId = await harness.resolveSermon(first);
    for (const [days, quickCheck] of [[1, true], [7, false]] as const) {
      // One person has one plan per sermon, so each plan here has its own reader.
      const reader = days === 1 ? first : await harness.user(`pipeline-test-${days}`);
      const { mutate, headers } = reader;
      const key = crypto.randomUUID();
      const created = await mutate("POST", "/v1/plans", { sermonId, lengthDays: days, quickCheckEnabled: quickCheck }, key);
      assert.equal(created.statusCode, 200, created.body);
      const { planId, generationId } = created.json();
      const again = await mutate("POST", "/v1/plans", { sermonId, lengthDays: days, quickCheckEnabled: quickCheck }, key);
      assert.deepEqual(again.json(), created.json());
      assert.equal(await worker.runOnce(), true);
      const status = await reader.get(`/v1/plan-generations/${generationId}`);
      const generation = getPlanGenerationResponseSchema.parse(status.json()).generation;
      assert.equal(generation.status, "completed", status.body);
      const detail = await reader.get(`/v1/plans/${planId}`);
      assert.equal(detail.statusCode, 200, detail.body);
      const plan = getPlanResponseSchema.parse(detail.json()).plan;
      assert.equal(plan.days.length, days);
      assert.equal(plan.days[0]!.reading.sermonClip?.endSeconds, 30);
      assert.equal(plan.days[0]!.quickCheckId !== null, quickCheck);
      assert.deepEqual(plan.about, {
        overview: ["This plan studies how God's love is shown in giving His Son."],
        keyTakeaways: ["God's love is demonstrated in giving His Son.", "Love calls for a faithful response today."],
        scripturesReferenced: [{ reference: "John 3:16", book: "John", chapter: 3, verseStart: 16, verseEnd: 16 }],
      });
      const started = await mutate("POST", `/v1/plans/${planId}/start`);
      assert.equal(started.statusCode, 200, started.body);
      const study = await reader.get(`/v1/plans/${planId}/days/1`);
      assert.equal(study.statusCode, 200, study.body);
      const studyDay = getStudyDayResponseSchema.parse(study.json()).day;
      assert.equal(studyDay.scripture.translation, "BSB");
      assert.equal(studyDay.scripture.cacheAllowed, true);
      assert.match(studyDay.scripture.verses[0]!.text, /^For God so loved the world/);
      assert.equal(studyDay.supportingScriptures.length, 1);
      assert.equal(studyDay.supportingScriptures[0]!.reference, "Romans 5:8");
      assert.equal(studyDay.supportingScriptures[0]!.connection, "God's love came first.");
      assert.equal(studyDay.supportingScriptures[0]!.translation, "BSB");
      assert.deepEqual(studyDay.supportingScriptures[0]!.verses.map((verse) => verse.number), [8]);
      // Bundled text is served from memory, never copied into the database.
      assert.equal((await pg.query("select * from scripture_texts")).rows.length, 0);
      if (quickCheck) {
        for (const step of ["read", "scripture", "reflect", "pray"]) {
          const response = await mutate("PUT", `/v1/plans/${planId}/days/1/steps/${step}`, { step });
          assert.equal(response.statusCode, 200, response.body);
        }
        const attempt = await mutate("POST", `/v1/quizzes/${plan.days[0]!.quickCheckId}/attempts`);
        assert.equal(attempt.statusCode, 200, attempt.body);
        const quiz = attempt.json().quiz;
        assert.equal(quiz.questions.length, QUICK_CHECK_QUESTIONS + 1);
        assert.equal(quiz.questions[0].choices.length, 4);
        assert.equal("correct" in quiz.questions[0].choices[0], false);
        assert.equal("isCorrect" in quiz.questions[0].choices[0], false);
        assert.equal("explanation" in quiz.questions[0], false);
        // Finish the verse reads in the reader's translation, with the same choices underneath.
        type QuizQuestion = { id: string; kind: string; prompt: string; choices: Array<{ id: string; text: string }> };
        const verseIn = (body: { quiz: { questions: QuizQuestion[] } }) => body.quiz.questions.find((question) => question.kind === "finishTheVerse")!;
        const bsb = verseIn(attempt.json());
        assert.match(bsb.prompt, /shall not perish but have ___\.”$/);
        assert.ok(bsb.choices.some((choice) => choice.text === "eternal life"));
        const toKjv = await mutate("PATCH", "/v1/me/settings", { bibleTranslation: "KJV" });
        assert.equal(toKjv.statusCode, 200, toKjv.body);
        const reopened = await app.inject({ method: "GET", url: `/v1/quizzes/${plan.days[0]!.quickCheckId}/attempt`, headers });
        const kjv = verseIn(reopened.json());
        assert.match(kjv.prompt, /should not perish, but have ___\.”$/);
        assert.deepEqual(kjv.choices.map((choice) => choice.id), bsb.choices.map((choice) => choice.id));
        for (const question of reopened.json().quiz.questions as QuizQuestion[]) {
          const choice = question.kind === "finishTheVerse" ? question.choices.find((option) => option.text === "everlasting life")! : question.choices[0]!;
          const answer = await mutate("POST", `/v1/quiz-attempts/${attempt.json().attempt.id}/answers`, { questionId: question.id, choiceId: choice.id });
          assert.equal(answer.statusCode, 200, answer.body);
          assert.equal(answer.json().correct, true);
        }
        const backToBsb = await mutate("PATCH", "/v1/me/settings", { bibleTranslation: "BSB" });
        assert.equal(backToBsb.statusCode, 200, backToBsb.body);
        const completed = await mutate("POST", `/v1/quiz-attempts/${attempt.json().attempt.id}/complete`);
        assert.equal(completed.statusCode, 200, completed.body);
        const dayDone = await mutate("POST", `/v1/plans/${planId}/days/1/complete`);
        assert.equal(dayDone.statusCode, 200, dayDone.body);
      }
      // Reclaim after a commit/queue acknowledgement crash must reuse content.
      await pg.query("update generation_jobs set status = 'queued', available_at = now() where generation_id = $1", [generationId]);
      const before = counts.openai;
      assert.equal(await worker.runOnce(), true);
      assert.equal(counts.openai, before);
    }
    assert.equal(counts.transcripts, 1);
    assert.equal(counts.jobPolls, 1);
    // One plan call, one call per day, and one quiz per day when Quick Check is on: 1 + 1 + 1, then 1 + 7.
    assert.equal(counts.openai, 11);
    assert.equal(await worker.runOnce(), false);
    // Finished steps are not kept once their plan is published.
    assert.equal((await pg.query("select * from generation_steps")).rows.length, 0);

    // Three days: no finished plan of that length exists to reuse.
    const failing = await harness.user("pipeline-test-failure");
    flags.invalidOutput = true;
    const callsBeforeFailure = counts.openai;
    const failedCreate = await failing.mutate("POST", "/v1/plans", { sermonId, lengthDays: 3, quickCheckEnabled: false });
    assert.equal(failedCreate.statusCode, 200, failedCreate.body);
    const failedIds = failedCreate.json();
    await worker.runOnce();
    const failure = await failing.get(`/v1/plan-generations/${failedIds.generationId}`);
    assert.equal(failure.json().generation.status, "failed", failure.body);
    const failedCalls = (await pg.query<{ stage: string; outcome: string; error: string; completion_tokens: number; cached_prompt_tokens: number }>("select stage, outcome, error, completion_tokens, cached_prompt_tokens from generation_attempts where generation_id = $1 and stage <> 'total' order by created_at", [failedIds.generationId])).rows;
    assert.deepEqual(failedCalls.map((row) => [row.stage, row.outcome]), [["plan", "rejected"], ["plan", "rejected"], ["plan", "rejected"]]);
    assert.equal(counts.openai, callsBeforeFailure + 3);
    assert.match(failedCalls[0]!.error, /Romans 8:28 is not named in the transcript/);
    assert.equal(failedCalls[0]!.completion_tokens, 500);
    assert.equal(failedCalls[0]!.cached_prompt_tokens, 800);
    const [failedTotal] = (await pg.query<{ outcome: string; completion_tokens: number; cached_prompt_tokens: number }>("select outcome, completion_tokens, cached_prompt_tokens from generation_attempts where generation_id = $1 and stage = 'total'", [failedIds.generationId])).rows;
    assert.equal(failedTotal!.outcome, "failed");
    assert.equal(failedTotal!.completion_tokens, 1500);
    assert.equal(failedTotal!.cached_prompt_tokens, 2400);
    const incomplete = await failing.get(`/v1/plans/${failedIds.planId}`);
    assert.equal(incomplete.json().error.code, "PLAN_NOT_READY", incomplete.body);
    assert.equal((await pg.query("select * from plan_days where plan_id = $1", [failedIds.planId])).rows.length, 0);
    flags.invalidOutput = false;
    const retry = await failing.mutate("POST", `/v1/plan-generations/${failedIds.generationId}/retry`);
    assert.equal(retry.statusCode, 200, retry.body);
    await worker.runOnce();
    const recovered = await failing.get(`/v1/plan-generations/${failedIds.generationId}`);
    assert.equal(recovered.json().generation.status, "completed", recovered.body);
    assert.equal(recovered.json().generation.attempt, 2);
    const attempts = (await pg.query<{ outcome: string; round: number }>("select outcome, round from generation_attempts where generation_id = $1 and stage = 'total' order by created_at", [failedIds.generationId])).rows;
    assert.deepEqual(attempts.map((row) => [row.round, row.outcome]), [[1, "failed"], [2, "completed"]]);
    assert.equal(counts.transcripts, 1);

    // A worker that lost its claim must not publish. Two days: nothing to reuse.
    const leased = await harness.user("pipeline-test-lease");
    flags.stealClaim = true;
    const leaseCreate = await leased.mutate("POST", "/v1/plans", { sermonId, lengthDays: 2, quickCheckEnabled: false });
    const leaseIds = leaseCreate.json();
    await worker.runOnce();
    const [leaseRow] = (await pg.query<{ status: string; locked_by: string }>("select status, locked_by from generation_jobs where generation_id = $1", [leaseIds.generationId])).rows;
    assert.equal(leaseRow!.status, "running");
    assert.equal(leaseRow!.locked_by, "other-worker");
    assert.equal((await pg.query("select * from plan_days where plan_id = $1", [leaseIds.planId])).rows.length, 0);
    flags.stealClaim = false;
    await pg.query("update generation_jobs set status = 'queued', available_at = now() where generation_id = $1", [leaseIds.generationId]);
    const callsBeforeReclaim = counts.openai;
    await worker.runOnce();
    const leaseRecovered = await leased.get(`/v1/plan-generations/${leaseIds.generationId}`);
    assert.equal(leaseRecovered.json().generation.status, "completed");
    // The reclaimed job resumed from the steps the first worker finished.
    assert.equal(counts.openai, callsBeforeReclaim);
  } finally {
    await harness.close();
  }
});
