/**
 * Route objects for the exams slice. Pure: they only describe a destination.
 *
 * The overview lives in Fun's stack, where it replaced Theology Exams'
 * "Coming soon" page. `/exam/...` — a session, its results, and Understand
 * why — is a full-screen modal with its own stack (see `src/app/_layout.tsx`).
 */

export const theologyExamsHref = "/(tabs)/fun/theology-exams" as const;

export function examSessionHref(attemptId: string) {
  return { pathname: "/exam/[attemptId]", params: { attemptId } } as const;
}

export function examResultsHref(attemptId: string) {
  return { pathname: "/exam/[attemptId]/results", params: { attemptId } } as const;
}

export function understandWhyHref(attemptId: string, questionId: string) {
  return {
    pathname: "/exam/[attemptId]/why/[questionId]",
    params: { attemptId, questionId },
  } as const;
}
