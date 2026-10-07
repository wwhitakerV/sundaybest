import { http, HttpResponse } from "msw";

import { submitQuizAnswerRequestSchema, type ApiPlanDetail } from "@/core/api/contracts";
import { API_URL, aReminder, aUser } from "../factories/api";
import { aQuizSession, aStudyDay, summaryOf, uuid, type QuizSession } from "../factories/api-plans";
import { server } from "./server";

const STEP_ORDER = ["read", "scripture", "reflect", "pray"] as const;

/** A request a test can check was made: its method, path, and JSON body. */
export type SeenRequest = { method: string; path: string; body: unknown };

/**
 * Serves these plans the way the API does — the list, each plan, and each of
 * its days for the Daily Study — for a returning, onboarded reader. Returns
 * the requests made, so a test can check what was asked for.
 *
 * Writes (start, steps, a day done, a Quick Check's start, answers and finish) answer as the server would
 * for the simple case; a test that needs a different answer adds its own
 * handler with `server.use(...)` after this one.
 */
export function servePlans(
  plans: readonly ApiPlanDetail[],
  { quizzes = {} }: { quizzes?: Readonly<Record<string, QuizSession>> } = {},
): SeenRequest[] {
  const seen: SeenRequest[] = [];
  const record = async (request: Request) => {
    const text = request.method === "GET" ? "" : await request.clone().text();
    seen.push({
      method: request.method,
      path: new URL(request.url).pathname,
      body: text ? (JSON.parse(text) as unknown) : null,
    });
  };
  const planFor = (planId: unknown) => plans.find((plan) => plan.id === planId);
  // Each day's steps done, as they're recorded: a refetch shows the steps done so far.
  const stepsDone = new Map<string, Set<string>>();
  const stepsDoneIn = (planId: unknown, dayNumber: unknown) => {
    const key = `${String(planId)}:${String(dayNumber)}`;
    const existing = stepsDone.get(key);
    if (existing) return existing;
    const day = planFor(planId)?.days.find(
      (candidate) => candidate.dayNumber === Number(dayNumber),
    );
    const done = new Set<string>(day?.progress.completedSteps ?? []);
    stepsDone.set(key, done);
    return done;
  };
  // Quick Check sessions, by quiz: those given, and those started, as answers arrive.
  const sessions = new Map<string, QuizSession>(Object.entries(quizzes));
  const sessionFor = (attemptId: unknown) =>
    [...sessions.entries()].find(([, session]) => session.attempt.id === attemptId) ?? [];

  server.use(
    http.get(`${API_URL}/v1/me`, () =>
      HttpResponse.json({ user: aUser({ onboardedAt: "2026-10-01T12:00:00.000Z" }) }),
    ),
    // No plan being written.
    http.get(`${API_URL}/v1/plan-generations/current`, () =>
      HttpResponse.json({ generations: [] }),
    ),
    // Finishing a day refreshes when the next one's reminded.
    http.get(`${API_URL}/v1/me/reminders`, () => HttpResponse.json({ reminders: [aReminder()] })),
    http.get(`${API_URL}/v1/plans`, async ({ request }) => {
      await record(request);
      return HttpResponse.json({ plans: plans.map(summaryOf) });
    }),
    http.get(`${API_URL}/v1/plans/:planId`, async ({ request, params }) => {
      await record(request);
      const plan = planFor(params.planId);
      return plan
        ? HttpResponse.json({ plan })
        : HttpResponse.json(
            { error: { code: "NOT_FOUND", message: "Plan not found" } },
            { status: 404 },
          );
    }),
    http.get(`${API_URL}/v1/plans/:planId/days/:dayNumber`, async ({ request, params }) => {
      await record(request);
      const plan = planFor(params.planId);
      const dayNumber = Number(params.dayNumber);
      if (!plan || !plan.days.some((day) => day.dayNumber === dayNumber)) {
        return HttpResponse.json(
          { error: { code: "NOT_FOUND", message: "Day not found" } },
          { status: 404 },
        );
      }
      const day = aStudyDay(plan, dayNumber);
      const done = stepsDoneIn(plan.id, dayNumber);
      return HttpResponse.json({
        day: {
          ...day,
          progress: {
            ...day.progress,
            completedSteps: STEP_ORDER.filter((step) => done.has(step)),
          },
        },
      });
    }),
    http.post(`${API_URL}/v1/plans/:planId/start`, async ({ request, params }) => {
      await record(request);
      const plan = planFor(params.planId);
      return plan
        ? HttpResponse.json({ plan: { ...plan, status: "active", startedAt: plan.createdAt } })
        : HttpResponse.json(
            { error: { code: "NOT_FOUND", message: "Plan not found" } },
            { status: 404 },
          );
    }),
    http.put(
      `${API_URL}/v1/plans/:planId/days/:dayNumber/steps/:step`,
      async ({ request, params }) => {
        await record(request);
        const done = stepsDoneIn(params.planId, params.dayNumber);
        done.add(String(params.step));
        return HttpResponse.json({
          completedSteps: STEP_ORDER.filter((step) => done.has(step)),
          updatedAt: "2026-10-05T12:00:00.000Z",
        });
      },
    ),
    http.post(`${API_URL}/v1/plans/:planId/days/:dayNumber/complete`, async ({ request }) => {
      await record(request);
      return HttpResponse.json({ completedAt: "2026-10-05T12:00:00.000Z", planCompletedAt: null });
    }),
    http.put(`${API_URL}/v1/plans/:planId/saved`, async ({ request }) => {
      await record(request);
      return HttpResponse.json({ saved: true });
    }),
    http.delete(`${API_URL}/v1/plans/:planId/saved`, async ({ request }) => {
      await record(request);
      return HttpResponse.json({ saved: false });
    }),
    http.post(`${API_URL}/v1/plans/:planId/reset`, async ({ request, params }) => {
      await record(request);
      const plan = planFor(params.planId);
      if (!plan) {
        return HttpResponse.json(
          { error: { code: "NOT_FOUND", message: "Plan not found" } },
          { status: 404 },
        );
      }
      return HttpResponse.json({
        plan: summaryOf({ ...plan, status: "ready", startedAt: null, startDate: null }),
        reflectionIds: plan.days.flatMap((day) => day.reflectionPrompts.map(({ id }) => id)),
      });
    }),
    http.get(`${API_URL}/v1/quizzes/:quizId/attempt`, async ({ request, params }) => {
      await record(request);
      const session = sessions.get(String(params.quizId));
      return session
        ? HttpResponse.json(session)
        : HttpResponse.json(
            { error: { code: "NOT_FOUND", message: "No attempt" } },
            { status: 404 },
          );
    }),
    http.post(`${API_URL}/v1/quizzes/:quizId/attempts`, async ({ request, params }) => {
      await record(request);
      const quizId = String(params.quizId);
      const plan = plans.find((candidate) =>
        candidate.days.some((day) => day.quickCheckId === quizId),
      );
      const day = plan?.days.find((candidate) => candidate.quickCheckId === quizId);
      if (!plan || !day) {
        return HttpResponse.json(
          { error: { code: "NOT_FOUND", message: "Quiz not found" } },
          { status: 404 },
        );
      }
      const session = sessions.get(quizId) ?? aQuizSession(plan, day.dayNumber);
      sessions.set(quizId, session);
      return HttpResponse.json(session);
    }),
    http.post(`${API_URL}/v1/quiz-attempts/:attemptId/answers`, async ({ request, params }) => {
      await record(request);
      const [quizId, session] = sessionFor(params.attemptId);
      const { questionId, choiceId } = submitQuizAnswerRequestSchema.parse(await request.json());
      const question = session?.quiz.questions.find((candidate) => candidate.id === questionId);
      if (!quizId || !session || !question) {
        return HttpResponse.json(
          { error: { code: "NOT_FOUND", message: "Attempt not found" } },
          { status: 404 },
        );
      }
      // The right answer is always a quiz's first choice (see `aQuizSession`).
      const rightId = question.choices[0]?.id ?? "";
      const feedback = {
        answerId: uuid(810_000 + question.order),
        questionId,
        choiceId,
        correct: choiceId === rightId,
        correctChoiceId: rightId,
        explanation: `Why ${question.order} is right.`,
        scriptureReference: null,
        answeredAt: "2026-10-05T12:00:00.000Z",
      };
      sessions.set(quizId, { ...session, answers: [...session.answers, feedback] });
      return HttpResponse.json(feedback);
    }),
    http.post(`${API_URL}/v1/quiz-attempts/:attemptId/complete`, async ({ request, params }) => {
      await record(request);
      const [quizId, session] = sessionFor(params.attemptId);
      if (!quizId || !session) {
        return HttpResponse.json(
          { error: { code: "NOT_FOUND", message: "Attempt not found" } },
          { status: 404 },
        );
      }
      const total = session.quiz.questions.length;
      const correct = session.answers.filter((answer) => answer.correct).length;
      const score = { correct, total, percentage: Math.round((correct / total) * 100) };
      const attempt = {
        ...session.attempt,
        status: "completed" as const,
        currentQuestionId: null,
        completedAt: "2026-10-05T12:00:00.000Z",
      };
      sessions.set(quizId, { ...session, attempt, score });
      return HttpResponse.json({ attempt, score });
    }),
  );

  return seen;
}
