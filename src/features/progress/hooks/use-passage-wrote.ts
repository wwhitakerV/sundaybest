import { useReflectionAnswers } from "@/core/storage/reflection-answer-queries";

/**
 * The first thing the reader wrote in a finished passage's reflection, read
 * from this phone only — or null when they wrote nothing there.
 */
export function usePassageWrote(reflectionIds: readonly string[], done: boolean): string | null {
  const answers = useReflectionAnswers(done ? reflectionIds : []);
  if (!done) return null;
  return (
    reflectionIds.map((id) => answers.answerFor(id).trim()).find((text) => text.length > 0) ?? null
  );
}
