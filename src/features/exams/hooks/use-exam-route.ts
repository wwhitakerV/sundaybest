import { useLocalSearchParams } from "expo-router";
import { z } from "zod";

/** An attempt or question ID as it may appear in a route: letters, digits, `-` and `_`, and not too long. */
const idParam = z.string().regex(/^[A-Za-z0-9_-]{1,120}$/);

function parseId(value: unknown): string | null {
  const parsed = idParam.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * The exam routes' params, parsed — `attemptId`, and `questionId` on
 * Understand why. Anything malformed is null, and the screen shows that it
 * isn't there rather than guessing.
 */
export function useExamRouteParams(): { attemptId: string | null; questionId: string | null } {
  const params = useLocalSearchParams();
  return { attemptId: parseId(params.attemptId), questionId: parseId(params.questionId) };
}
