/**
 * Route objects for the exams slice. Pure: they only describe a destination.
 *
 * The exams page lives in Fun's stack, where Theology Exams' tile opens it.
 * An exam's overview is pushed above the tabs — so it has the screen, and
 * its call to action the bottom of it, to itself. Its topics and passages
 * open over it as half-height native sheets. `/exam/...` — a session,
 * its results, and Understand why — is a full-screen modal with its own
 * stack (see `src/app/_layout.tsx`).
 */

export const theologyExamsHref = "/(tabs)/fun/theology-exams" as const;

export function examOverviewHref(examId: string) {
  return { pathname: "/exams/[examId]", params: { examId } } as const;
}

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

/** An exam's topics, in a half-height sheet over its overview. */
export function examTopicsHref(examId: string) {
  return { pathname: "/exams/[examId]/topics", params: { examId } } as const;
}

/** An exam's passages, in a half-height sheet over its overview. */
export function examPassagesHref(examId: string) {
  return { pathname: "/exams/[examId]/passages", params: { examId } } as const;
}

/** A subject's exams, a row each, in Fun's stack — from its book on the exams page. */
export function examSubjectHref(subjectId: string) {
  return { pathname: "/(tabs)/fun/exam-subject/[subjectId]", params: { subjectId } } as const;
}

/** Every subject, in a half-height sheet over the exams page. */
export const examSubjectsHref = "/(tabs)/fun/exam-subjects" as const;

/** The exams page, open on a subject — how the subjects sheet hands one back. */
export function theologyExamsSubjectHref(subjectId: string) {
  return { pathname: "/(tabs)/fun/theology-exams", params: { subject: subjectId } } as const;
}
